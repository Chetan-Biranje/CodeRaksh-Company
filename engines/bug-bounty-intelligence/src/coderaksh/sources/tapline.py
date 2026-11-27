"""Tapline access: transports (mock, REST, MCP) and a policy/budget/cache-aware client.

Verified from Tapline's own documentation (2026-11-27):
- REST base URL `https://api.tapline.sh`, key sent bare in the `X-API-Key` header
  (https://tapline.sh/SKILL.md and the OpenAPI file https://tapline.sh/openapi.airbnb.json).
- Error bodies carry `code`, `message`, `request_id`. 401 bad key, 402 no credits, 403 denied,
  404 not found, 422 validation, 429 rate limit (honour Retry-After), 502/503 upstream.
- Free accounts: 1 request per second. Responses do not report the credits charged.
- MCP server `https://api.tapline.sh/mcp` (Streamable HTTP).
"""

from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Protocol
from urllib.parse import urlparse

import httpx

from ..cache import Cache
from ..config import Settings
from ..errors import CodeRakshError, ConfigError, PolicyViolation
from ..ledger import BudgetGuard
from ..policy import CallPolicy, cost_of

MCP_URL = "https://api.tapline.sh/mcp"
OFFICIAL_HOST = "api.tapline.sh"
MAX_RETRY_AFTER = 30.0


class TaplineError(CodeRakshError):
    def __init__(self, message: str, status: int | None = None, code: str | None = None,
                 request_id: str | None = None):
        super().__init__(message)
        self.status, self.code, self.request_id = status, code, request_id

    @property
    def fatal(self) -> bool:
        """401 (bad key) and 402 (no credits) mean every later call would fail too."""
        return self.status in (401, 402)

    @property
    def ambiguous(self) -> bool:
        """The request may have been processed (and billed) even though we got no usable answer."""
        return self.status == 0 or (self.status is not None and self.status >= 500)


@dataclass
class TaplineResponse:
    status_code: int
    body: Any
    credits_charged: int | None = None  # None when the transport cannot report it (REST)


class Transport(Protocol):
    simulated: bool

    def call(self, path: str, query: dict | None) -> TaplineResponse: ...


class MockTransport:
    """Serves fixtures. Never touches the network, never spends credits."""

    simulated = True

    def __init__(self, fixtures: dict[str, Any] | Callable[[str, dict], Any]):
        self._fixtures = fixtures
        self.calls: list[tuple[str, dict]] = []

    def call(self, path: str, query: dict | None) -> TaplineResponse:
        query = query or {}
        self.calls.append((path, query))
        if callable(self._fixtures):
            body = self._fixtures(path, query)
        else:
            body = self._fixtures.get(path)
            if body is None:
                key = next((k for k in self._fixtures if path.startswith(k)), None)
                body = self._fixtures.get(key) if key else None
        if body is None:
            raise TaplineError(f"no mock fixture for {path}", status=404)
        return TaplineResponse(200, body, cost_of(path))


def _short(value: object, n: int = 200) -> str | None:
    return str(value)[:n] if isinstance(value, str | int) else None


def _retry_after(resp: httpx.Response, default: float) -> float:
    try:
        return min(max(float(resp.headers.get("Retry-After", default)), 0.0), MAX_RETRY_AFTER)
    except ValueError:
        return default


class RestTransport:
    """REST access with pacing, bounded retries and error mapping.

    Credit safety:
    - 429 means the request was refused for rate limiting: retried up to 2 times (Retry-After
      honoured, capped at 30 s), and at most `MAX_TOTAL_RETRIES` times per transport.
    - 5xx and network errors are ambiguous (Tapline may have processed and billed the request).
      They are retried only for free endpoints. A paid endpoint is never retried automatically;
      the error carries `ambiguous=True` and the client books the catalog cost as a possible charge.
    - The balance before and after a run is reconciled against `/v1/account/credits`.
    """

    MAX_TOTAL_RETRIES = 6

    simulated = False

    def __init__(self, settings: Settings, client: httpx.Client, *,
                 sleep: Callable[[float], None] = time.sleep,
                 clock: Callable[[], float] = time.monotonic):
        if not settings.tapline_api_key:
            raise ConfigError("TAPLINE_API_KEY is not set (read it from the environment, never code)")
        base = urlparse(settings.tapline_base_url)
        if base.scheme != "https" or not base.hostname:
            raise ConfigError("TAPLINE_BASE_URL must be an https URL")
        if base.hostname != OFFICIAL_HOST and not settings.allow_custom_tapline_host:
            raise ConfigError(
                f"refusing to send the Tapline API key to {base.hostname!r}; the official host is "
                f"{OFFICIAL_HOST}. Set TAPLINE_ALLOW_CUSTOM_HOST=1 only for a host you control."
            )
        self._base = settings.tapline_base_url.rstrip("/")
        self._header = settings.tapline_auth_header
        self._value = f"{settings.tapline_auth_prefix}{settings.tapline_api_key}"
        self._interval = settings.tapline_min_interval
        self._client, self._sleep, self._clock = client, sleep, clock
        self._last: float | None = None
        self._retries_used = 0
        self.host = base.hostname

    def _pace(self) -> None:
        if self._last is not None and self._interval > 0:
            wait = self._interval - (self._clock() - self._last)
            if wait > 0:
                self._sleep(wait)
        self._last = self._clock()

    def call(self, path: str, query: dict | None) -> TaplineResponse:
        url = self._base + "/" + path.lstrip("/")
        try:
            free = cost_of(path) == 0
        except PolicyViolation:
            free = False  # unknown endpoint: treat as paid
        attempt = 0
        while True:
            self._pace()
            try:
                resp = self._client.get(url, params=query or None, headers={self._header: self._value})
            except httpx.TransportError as exc:
                if free and attempt < 1 and self._take_retry():
                    self._sleep(2.0)
                    attempt += 1
                    continue
                raise TaplineError(f"Tapline network error for {path}: {type(exc).__name__}",
                                   status=0, code="transport") from None
            if resp.status_code == 429 and attempt < 2 and self._take_retry():
                self._sleep(_retry_after(resp, 5.0))
                attempt += 1
                continue
            if resp.status_code in (502, 503) and free and attempt < 1 and self._take_retry():
                self._sleep(2.0)
                attempt += 1
                continue
            break
        if resp.status_code >= 400:
            raise self._error(resp, path)
        try:
            body = resp.json()
        except ValueError:
            raise TaplineError(f"Tapline returned a non-JSON body for {path}", status=0,
                               code="bad_body") from None
        return TaplineResponse(resp.status_code, body, None)

    def _take_retry(self) -> bool:
        if self._retries_used >= self.MAX_TOTAL_RETRIES:
            return False
        self._retries_used += 1
        return True

    @staticmethod
    def _error(resp: httpx.Response, path: str) -> TaplineError:
        code = rid = msg = None
        try:
            body = resp.json()
            if isinstance(body, dict):
                code, rid, msg = (_short(body.get(k)) for k in ("code", "request_id", "message"))
        except ValueError:
            pass
        hints = {401: "API key missing, wrong or revoked", 402: "not enough credits",
                 403: "access denied", 404: "not found", 422: "request validation failed",
                 429: "rate limit still exceeded after retries"}
        text = hints.get(resp.status_code, "upstream error")
        detail = f" ({msg})" if msg else ""
        return TaplineError(f"Tapline HTTP {resp.status_code} for {path}: {text}{detail}",
                            status=resp.status_code, code=code, request_id=rid)


class McpTransport:
    """Calls Tapline's `call_endpoint` MCP tool through an already-authenticated session.

    `call_tool(name, arguments)` must return a dict shaped like
    {"status_code": int, "credits_charged": int, "body": ...}. Tapline's docs do not say how to
    send an API key to the MCP URL, so there is no `from_env`: inject your own session.
    """

    simulated = False

    def __init__(self, call_tool: Callable[[str, dict], dict]):
        self._call_tool = call_tool

    def call(self, path: str, query: dict | None) -> TaplineResponse:
        args: dict[str, Any] = {"path": path}
        if query:
            args["query"] = query
        result = self._call_tool("call_endpoint", args)
        status = int(result.get("status_code", 0))
        if status >= 400 or status == 0:
            raise TaplineError(f"Tapline MCP returned status {status} for {path}", status=status)
        credits = result.get("credits_charged")
        return TaplineResponse(status, result.get("body"), credits if isinstance(credits, int) else None)


class TaplineClient:
    """Order of operations for every call: policy, cache, budget, transport, ledger, cache write."""

    def __init__(self, transport: Transport, policy: CallPolicy, cache: Cache, guard: BudgetGuard):
        self.transport, self.policy, self.cache, self.guard = transport, policy, cache, guard
        self.credits_source_estimated = False

    def get(self, path: str, query: dict | None = None, *, priority: int = 1) -> Any:
        self.policy.check(path, query)
        hit = self.cache.get(path, query)
        if hit is not None:
            self.guard.record(path, hit[1], cache_hit=True, status="cache")
            return hit[0]
        cost = cost_of(path)
        self.guard.authorize(cost, priority)
        try:
            resp = self.transport.call(path, query)
        except TaplineError as exc:
            # 404 is documented as free. A 5xx or network error may still have been billed, so it
            # counts at the catalog cost (conservative); other failures count 0. Both are settled
            # by the balance reconciliation at the end of the run.
            if exc.ambiguous and cost > 0:
                self.guard.record(path, cost, cache_hit=False, status=f"error:{exc.status}:possible-charge")
            else:
                self.guard.record(path, 0, cache_hit=False, status=f"error:{exc.status}")
            raise
        if resp.credits_charged is None:
            self.credits_source_estimated = True  # the catalog cost stands in for the real one
        charged = cost if resp.credits_charged is None else resp.credits_charged
        self.guard.record(path, charged, cache_hit=False)
        self.cache.put(path, query, resp.body, charged)
        return resp.body

    def account_credits(self) -> int | None:
        """Free balance check. Returns total credits remaining, or None if unavailable."""
        self.policy.check("/v1/account/credits", {})
        try:
            resp = self.transport.call("/v1/account/credits", None)
        except TaplineError as exc:
            if exc.fatal:
                raise
            return None
        self.guard.record("/v1/account/credits", 0, cache_hit=False)
        body = resp.body if isinstance(resp.body, dict) else {}
        val = body.get("total_credits_remaining")
        return int(val) if isinstance(val, int) else None
