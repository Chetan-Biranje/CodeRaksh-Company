import httpx
import pytest

from coderaksh.cache import Cache, cache_key
from coderaksh.config import PILOT_HARD_CAP, Settings
from coderaksh.errors import (
    BudgetExceeded,
    CircuitOpen,
    ConfigError,
    EgressDenied,
    PolicyViolation,
)
from coderaksh.ledger import BudgetGuard, Ledger
from coderaksh.mock import mock_tapline
from coderaksh.policy import CallPolicy
from coderaksh.scope import load_scope
from coderaksh.sources.http import make_client
from coderaksh.sources.tapline import (
    McpTransport,
    MockTransport,
    RestTransport,
    TaplineClient,
    TaplineError,
)


def test_settings_cap_and_secrets_hidden():
    s = Settings.from_env({"CODERAKSH_RUN_BUDGET": "99999", "TAPLINE_API_KEY": "sk-secret"})
    assert s.run_budget == PILOT_HARD_CAP
    assert "sk-secret" not in repr(s)
    with pytest.raises(ConfigError):
        Settings.from_env({"CODERAKSH_MODE": "yolo"})


def test_cache_ttl(tmp_path):
    now = [1000.0]
    c = Cache(tmp_path / "c.db", clock=lambda: now[0])
    c.put("/v1/brave-search/news", {"query": "a"}, {"x": 1}, 5)
    assert c.get("/v1/brave-search/news", {"query": "a"}) == ({"x": 1}, 5)
    now[0] += 2 * 86400  # news TTL is 1 day
    assert c.get("/v1/brave-search/news", {"query": "a"}) is None
    assert c.purge_expired() == 1
    assert cache_key("/a", {"b": 1, "a": 2}) == cache_key("/a", {"a": 2, "b": 1})


def test_budget_guard(tmp_path):
    led = Ledger(tmp_path / "l.db")
    g = BudgetGuard(led, run_id="r1", program="p", mode="mock", cap=100)
    g.authorize(5)
    g.record("/x", 70, cache_hit=False)
    with pytest.raises(CircuitOpen):  # 75 is fine, 85 > 80% for optional calls
        g.authorize(15, priority=1)
    g.authorize(15, priority=0)  # essential calls still pass
    with pytest.raises(BudgetExceeded):
        g.authorize(31, priority=0)
    g.record("/x", 50, cache_hit=True)  # cache hits never count
    assert g.spent == 70 and led.saved(run_id="r1") == 50
    assert BudgetGuard(led, run_id="r", program="p", mode="mock", cap=10_000).cap == 500


def _client(scope_path, tmp_path, cap=500, fixtures=mock_tapline):
    scope = load_scope(scope_path)
    led = Ledger(tmp_path / "l.db")
    guard = BudgetGuard(led, run_id="r", program="p", mode="mock", cap=cap)
    t = MockTransport(fixtures)
    return TaplineClient(t, CallPolicy(scope), Cache(tmp_path / "c.db"), guard), t, guard


def test_client_caches_and_charges_once(scope_path, tmp_path):
    c, t, g = _client(scope_path, tmp_path)
    q = {"query": "site:developers.example.com oauth"}
    c.get("/v1/brave-search/search", q)
    c.get("/v1/brave-search/search", q)
    assert len(t.calls) == 1 and g.spent == 5


def test_client_policy_runs_before_transport(scope_path, tmp_path):
    c, t, _ = _client(scope_path, tmp_path)
    with pytest.raises(PolicyViolation):
        c.get("/v1/indeed/jobs/search", {"query": "Example Corp"})
    assert t.calls == []


def test_client_budget_blocks_before_transport(scope_path, tmp_path):
    c, t, _ = _client(scope_path, tmp_path, cap=4)
    with pytest.raises(BudgetExceeded):
        c.get("/v1/brave-search/search", {"query": "site:developers.example.com oauth"})
    assert t.calls == []


def test_client_error_is_recorded_not_charged(scope_path, tmp_path):
    c, _, g = _client(scope_path, tmp_path, fixtures=lambda p, q: None)
    with pytest.raises(TaplineError):
        c.get("/v1/linkedin/company", {"url": "https://www.linkedin.com/company/example/"})
    assert g.spent == 0


def test_rest_transport_needs_key_and_official_host():
    with pytest.raises(ConfigError, match="TAPLINE_API_KEY"):
        RestTransport(Settings(), make_client())
    with pytest.raises(ConfigError, match="refusing to send"):
        RestTransport(Settings(tapline_api_key="k", tapline_base_url="https://evil.test"), make_client())
    with pytest.raises(ConfigError, match="https"):
        RestTransport(Settings(tapline_api_key="k", tapline_base_url="http://api.tapline.sh"),
                      make_client())
    RestTransport(Settings(tapline_api_key="k"), make_client())  # verified defaults are enough


def test_verified_tapline_defaults():
    s = Settings()
    assert s.tapline_base_url == "https://api.tapline.sh"
    assert s.tapline_auth_header == "X-API-Key" and s.tapline_auth_prefix == ""


def _rest(handler, **kw):
    sleeps = []
    s = Settings(tapline_api_key="k123", tapline_min_interval=kw.pop("interval", 0.0))
    t = RestTransport(s, make_client(transport=httpx.MockTransport(handler)),
                      sleep=sleeps.append, clock=kw.pop("clock", None) or (lambda: 0.0))
    return t, sleeps


def test_rest_sends_bare_key_in_x_api_key():
    seen = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["url"], seen["key"] = str(req.url), req.headers.get("X-API-Key")
        seen["auth"] = req.headers.get("Authorization")
        return httpx.Response(200, json={"ok": 1})

    t, _ = _rest(handler)
    r = t.call("/v1/twitter/profile", {"handle": "examplecorp"})
    assert seen["url"] == "https://api.tapline.sh/v1/twitter/profile?handle=examplecorp"
    assert seen["key"] == "k123" and seen["auth"] is None and r.credits_charged is None


def test_rest_retries_429_with_retry_after_then_gives_up():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        return httpx.Response(429, headers={"Retry-After": "7"}, json={"code": "rate_limited"})

    t, sleeps = _rest(handler)
    with pytest.raises(TaplineError) as e:
        t.call("/v1/x", None)
    assert n["c"] == 3 and sleeps == [7.0, 7.0] and e.value.status == 429 and not e.value.fatal


def test_rest_retry_after_is_capped():
    codes = iter([429, 200])

    def handler(req):
        c = next(codes)
        return httpx.Response(c, headers={"Retry-After": "9999"}, json={})

    t, sleeps = _rest(handler)
    t.call("/v1/x", None)
    assert sleeps == [30.0]


def test_rest_retries_502_once_on_free_endpoint():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        return httpx.Response(502, json={"code": "upstream"})

    t, sleeps = _rest(handler)
    with pytest.raises(TaplineError):
        t.call("/v1/account/credits", None)
    assert n["c"] == 2 and sleeps == [2.0]


def test_rest_error_mapping_and_no_key_leak():
    def handler(req):
        return httpx.Response(401, json={"code": "unauthenticated", "message": "bad key",
                                         "request_id": "req_9"})

    t, _ = _rest(handler)
    with pytest.raises(TaplineError) as e:
        t.call("/v1/x", None)
    assert e.value.fatal and e.value.code == "unauthenticated" and e.value.request_id == "req_9"
    assert "k123" not in str(e.value)
    t2, _ = _rest(lambda r: httpx.Response(402, json={}))
    with pytest.raises(TaplineError) as e2:
        t2.call("/v1/x", None)
    assert e2.value.fatal
    t3, _ = _rest(lambda r: httpx.Response(404, json={}))
    with pytest.raises(TaplineError) as e3:
        t3.call("/v1/x", None)
    assert not e3.value.fatal


def test_rest_paces_requests():
    now = [100.0]
    t, sleeps = _rest(lambda r: httpx.Response(200, json={}), interval=1.0, clock=lambda: now[0])
    t.call("/v1/a", None)
    now[0] += 0.25
    t.call("/v1/b", None)
    assert sleeps == [0.75]


def test_rest_custom_host_needs_opt_in():
    s = Settings(tapline_api_key="k", tapline_base_url="https://tapline.test",
                 allow_custom_tapline_host=True)
    RestTransport(s, make_client(["tapline.test"]))


def test_mcp_transport_uses_call_endpoint_tool():
    calls = []

    def fake(name, args):
        calls.append((name, args))
        return {"status_code": 200, "credits_charged": 5, "body": {"a": 1}}

    r = McpTransport(fake).call("/v1/brave-search/search", {"query": "x"})
    assert calls == [("call_endpoint", {"path": "/v1/brave-search/search", "query": {"query": "x"}})]
    assert r.credits_charged == 5
    with pytest.raises(TaplineError):
        McpTransport(lambda n, a: {"status_code": 500}).call("/x", None)


def test_egress_allowlist():
    ok = make_client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})))
    ok.get("https://api.osv.dev/v1/query")
    for url in ["https://api.example.com/", "http://api.osv.dev/", "https://evil.test/"]:
        with pytest.raises(EgressDenied):
            ok.get(url)


def test_paid_endpoint_5xx_is_never_retried():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        return httpx.Response(503, json={"code": "unavailable"})

    t, sleeps = _rest(handler)
    with pytest.raises(TaplineError) as e:
        t.call("/v1/brave-search/search", {"query": "x"})
    assert n["c"] == 1 and sleeps == [] and e.value.ambiguous


def test_paid_endpoint_network_error_not_retried_and_wrapped():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        raise httpx.ReadTimeout("slow")

    t, _ = _rest(handler)
    with pytest.raises(TaplineError) as e:
        t.call("/v1/brave-search/search", {"query": "x"})
    assert n["c"] == 1 and e.value.status == 0 and e.value.ambiguous and "k123" not in str(e.value)


def test_free_endpoint_network_error_retried_once():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        raise httpx.ConnectError("down")

    t, _ = _rest(handler)
    with pytest.raises(TaplineError):
        t.call("/v1/account/credits", None)
    assert n["c"] == 2


def test_total_retry_budget_is_bounded():
    n = {"c": 0}

    def handler(req):
        n["c"] += 1
        return httpx.Response(429, json={})

    t, _ = _rest(handler)
    for _i in range(5):
        with pytest.raises(TaplineError):
            t.call("/v1/twitter/profile", {"handle": "x"})
    assert n["c"] <= 5 + RestTransport.MAX_TOTAL_RETRIES


def test_ambiguous_failure_booked_at_catalog_cost(tmp_path, scope_path):
    from coderaksh.cache import Cache
    from coderaksh.ledger import BudgetGuard, Ledger
    from coderaksh.policy import CallPolicy
    from coderaksh.scope import load_scope
    from coderaksh.sources.tapline import TaplineClient

    class Boom:
        simulated = False

        def call(self, path, query):
            raise TaplineError("x", status=503)

    led = Ledger(tmp_path / "l.db")
    g = BudgetGuard(led, run_id="r", program="p", mode="live", cap=500, program_cap=500)
    c = TaplineClient(Boom(), CallPolicy(load_scope(scope_path)), Cache(tmp_path / "c.db"), g)
    with pytest.raises(TaplineError):
        c.get("/v1/brave-search/search", {"query": '"Example Corp" breach'})
    assert g.spent == 5 and g.program_spent == 5
