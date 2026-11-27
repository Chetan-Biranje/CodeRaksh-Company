"""HTTP plumbing with an egress allowlist.

The engine can only talk to Tapline and the public vulnerability data sources. A scope
target is never on this list, so passive-only behaviour is enforced in code, not by habit.
"""

from __future__ import annotations

import time
from collections.abc import Callable, Iterable
from typing import Any
from urllib.parse import urlparse

import httpx

from ..cache import Cache
from ..errors import EgressDenied, SourceRateLimited

STATIC_ALLOWED_HOSTS = frozenset(
    {
        "api.tapline.sh",
        "services.nvd.nist.gov",
        "www.cisa.gov",
        "api.first.org",
        "api.osv.dev",
        "api.github.com",
        "raw.githubusercontent.com",  # fallback copy of the KEV catalog (github.com/cisagov/kev-data)
    }
)
USER_AGENT = "coderaksh/0.1 (+passive-research; authorized programs only)"


def make_client(
    extra_hosts: Iterable[str] = (),
    transport: httpx.BaseTransport | None = None,
    timeout: float = 20.0,
) -> httpx.Client:
    allowed = STATIC_ALLOWED_HOSTS | {h.lower() for h in extra_hosts}

    def _guard(request: httpx.Request) -> None:
        host = (request.url.host or "").lower()
        if request.url.scheme != "https":
            raise EgressDenied(f"only https is allowed, got {request.url.scheme}://{host}")
        if host not in allowed:
            raise EgressDenied(f"egress to {host!r} is not allowlisted")

    return httpx.Client(
        transport=transport,
        timeout=timeout,
        headers={"User-Agent": USER_AGENT},
        event_hooks={"request": [_guard]},
        follow_redirects=False,  # a redirect to a non-allowlisted host must fail, not follow
    )


def host_of(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


class FreeSource:
    """Base class for the free public data sources (NVD, KEV, EPSS, OSV, GHSA)."""

    name = "free"
    min_interval = 0.0
    max_retries = 2
    timeout = 30.0

    def __init__(
        self,
        client: httpx.Client,
        cache: Cache | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ):
        self.client, self.cache, self._sleep = client, cache, sleep
        self._last = 0.0

    def _throttle(self) -> None:
        wait = self.min_interval - (time.monotonic() - self._last)
        if wait > 0:
            self._sleep(wait)
        self._last = time.monotonic()

    def _request(self, method: str, url: str, *, key: dict, **kw: Any) -> Any:
        cache_path = f"free/{self.name}"
        if self.cache:
            hit = self.cache.get(cache_path, key)
            if hit is not None:
                return hit[0]
        resp = None
        for attempt in range(self.max_retries + 1):
            self._throttle()
            resp = self.client.request(method, url, timeout=self.timeout, **kw)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < self.max_retries:
                self._sleep(_delay(resp, attempt))
                continue
            break
        if resp is None:  # unreachable: the loop body always runs once
            raise RuntimeError("no response")
        limited = resp.status_code == 429 or (
            resp.status_code == 403 and resp.headers.get("x-ratelimit-remaining") == "0"
        )
        if limited:
            raise SourceRateLimited(f"{self.name}: rate limit exhausted (HTTP {resp.status_code}); "
                                    "wait, or set the optional API token for this source")
        resp.raise_for_status()
        data = resp.json()
        if self.cache:
            self.cache.put(cache_path, key, data, 0)
        return data


def _delay(resp: httpx.Response, attempt: int) -> float:
    try:
        return min(float(resp.headers["Retry-After"]), 30.0)
    except (KeyError, ValueError):
        return min(1.5 * (2**attempt), 30.0)
