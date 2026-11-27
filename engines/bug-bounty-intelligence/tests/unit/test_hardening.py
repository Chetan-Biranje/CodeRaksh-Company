import json
from pathlib import Path

import httpx
import pytest

from coderaksh.errors import BudgetExceeded, CircuitOpen, PolicyViolation, RunInProgress, SourceRateLimited
from coderaksh.ledger import BudgetGuard, Ledger
from coderaksh.policy import CallPolicy
from coderaksh.redact import redact
from coderaksh.runlock import exclusive_run
from coderaksh.scope import load_scope
from coderaksh.sources.http import FreeSource, make_client
from coderaksh.sources.vulndb import (
    KEV_MIRROR_URL,
    KEV_URL,
    EpssClient,
    GhsaClient,
    KevClient,
    OsvClient,
    parse_nvd,
)

FIX = Path(__file__).resolve().parents[1] / "fixtures" / "live"


@pytest.fixture
def pol(scope_path):
    return CallPolicy(load_scope(scope_path))


# ---- policy bypass attempts
@pytest.mark.parametrize("q", [
    '"site:blog.example.com" x',          # quoted site: operator
    "-site:api.example.com site:blog.example.com",
    "site:*.example.com oauth",           # wildcard also covers out-of-scope blog.example.com
    "site:api.example.com OR site:evil.com",
])
def test_site_operator_bypasses_denied(pol, q):
    with pytest.raises(PolicyViolation):
        pol.check("/v1/brave-search/search", {"query": q})


@pytest.mark.parametrize("path", [
    "/v1/brave-search/search%2e%2e/x", "/v1/linkedin//profile", "/v1/linkedin/company/../profile",
    "/v1/twitter/profile?x=1", "/v1/twitter/profile#frag", "v1/twitter/profile",
])
def test_odd_paths_denied(pol, path):
    with pytest.raises(PolicyViolation):
        pol.check(path, {"handle": "ExampleCorp"})


def test_company_ids_must_come_from_org_page(pol):
    q = {"company_ids": "12345", "keywords": "security"}
    with pytest.raises(PolicyViolation):
        pol.check("/v1/linkedin/jobs/search", q)
    pol.register_company_id("12345")
    pol.check("/v1/linkedin/jobs/search", q)


# ---- budget: lifetime pilot cap, circuit breaker
def test_lifetime_pilot_cap_across_runs(tmp_path):
    led = Ledger(tmp_path / "l.db")
    for run in ("r1", "r2"):
        g = BudgetGuard(led, run_id=run, program="p", mode="live", cap=500, program_cap=500)
        g.authorize(240, priority=0)
        g.record("/v1/x", 240, cache_hit=False)
    g3 = BudgetGuard(led, run_id="r3", program="p", mode="live", cap=500, program_cap=500)
    assert g3.program_spent == 480 and g3.remaining == 20
    with pytest.raises(BudgetExceeded):
        g3.authorize(21, priority=0)
    g3.authorize(20, priority=0)


def test_circuit_breaker_blocks_optional_calls_at_80_percent(tmp_path):
    g = BudgetGuard(Ledger(tmp_path / "l.db"), run_id="r", program="p", mode="live", cap=100)
    g.record("/v1/x", 79, cache_hit=False)
    with pytest.raises(CircuitOpen):
        g.authorize(5, priority=1)
    g.authorize(5, priority=0)  # essential calls may use the last 20%


def test_cap_never_exceeds_500(tmp_path):
    g = BudgetGuard(Ledger(tmp_path / "l.db"), run_id="r", program="p", mode="live", cap=9999,
                    program_cap=9999)
    assert g.cap == 500 and g.program_cap == 500


def test_run_lock_blocks_second_run(tmp_path):
    with exclusive_run(tmp_path), pytest.raises(RunInProgress), exclusive_run(tmp_path):
        pass
    with exclusive_run(tmp_path):  # released afterwards
        pass


# ---- redaction
def test_redact_credentials_in_public_text():
    fake_gh = "ghp_" + "a1B2" * 9
    text = f"token {fake_gh} and Bearer abcdefghijklmnopqrstuvwxyz0123 and api_key=ZZZZZZZZZZZZZZZZZZ"
    out = redact(text)
    assert fake_gh not in out and "abcdefghijklmnopqrstuvwxyz0123" not in out
    assert "ZZZZZZZZZZZZZZ" not in out and "[REDACTED" in out
    assert redact("plain sentence about OAuth redirect_uri") == "plain sentence about OAuth redirect_uri"


# ---- free source retry, rate limit, KEV fallback
def _src(handler, sleeps):
    class S(FreeSource):
        name = "t"
    return S(make_client(["services.nvd.nist.gov"], transport=httpx.MockTransport(handler)),
             sleep=sleeps.append)


def test_free_source_retries_then_succeeds():
    codes = iter([503, 429, 200])
    sleeps = []
    s = _src(lambda r: httpx.Response(next(codes), json={"ok": 1}, headers={"Retry-After": "2"}), sleeps)
    assert s._request("GET", "https://services.nvd.nist.gov/x", key={"a": 1}) == {"ok": 1}
    assert sleeps[-2:] == [2.0, 2.0]


def test_free_source_rate_limited_raises():
    s = _src(lambda r: httpx.Response(429, json={}), [])
    with pytest.raises(SourceRateLimited):
        s._request("GET", "https://services.nvd.nist.gov/x", key={})
    s2 = _src(lambda r: httpx.Response(403, headers={"x-ratelimit-remaining": "0"}, json={}), [])
    with pytest.raises(SourceRateLimited):
        s2._request("GET", "https://services.nvd.nist.gov/x", key={})


def _client(handler, hosts):
    return make_client(hosts, transport=httpx.MockTransport(handler))


def test_kev_falls_back_to_mirror():
    kev = json.loads((FIX / "kev_first5.json").read_text())
    seen = []

    def handler(req):
        seen.append(str(req.url))
        if str(req.url) == KEV_URL:
            raise httpx.ConnectError("down")
        return httpx.Response(200, json=kev)

    k = KevClient(_client(handler, ["www.cisa.gov", "raw.githubusercontent.com"]), sleep=lambda s: None)
    cat = k.catalog()
    assert seen == [KEV_URL, KEV_MIRROR_URL] and len(cat) == 5


# ---- real-data regression fixtures
def test_parse_real_nvd_capture():
    out = parse_nvd(json.loads((FIX / "nvd_keycloak_1.json").read_text()), "keycloak")
    assert len(out) == 1 and out[0].cve_id.startswith("CVE-") and out[0].summary


def test_real_epss_capture():
    data = json.loads((FIX / "epss_log4shell.json").read_text())
    client = _client(lambda r: httpx.Response(200, json=data), ["api.first.org"])
    got = EpssClient(client, sleep=lambda s: None).scores(["CVE-2021-44228"])
    epss, pct = got["CVE-2021-44228"]
    assert 0 <= epss <= 1 and 0 <= pct <= 1


def test_real_osv_capture_and_truncation_flag():
    data = json.loads((FIX / "osv_jsonwebtoken_first3.json").read_text())
    client = _client(lambda r: httpx.Response(200, json=data), ["api.osv.dev"])
    osv = OsvClient(client, sleep=lambda s: None)
    out = osv.query("npm", "jsonwebtoken")
    assert out and all(v.cve_id for v in out)
    data["next_page_token"] = "more"
    osv2 = OsvClient(_client(lambda r: httpx.Response(200, json=data), ["api.osv.dev"]), sleep=lambda s: None)
    osv2.query("npm", "jsonwebtoken")
    assert osv2.last_truncated is True


def test_osv_uses_id_when_no_cve_alias():
    data = {"vulns": [{"id": "GHSA-xxxx-yyyy-zzzz", "aliases": [], "summary": "s"}]}
    c = OsvClient(_client(lambda r: httpx.Response(200, json=data), ["api.osv.dev"]), sleep=lambda s: None)
    assert c.query("npm", "x")[0].cve_id == "GHSA-xxxx-yyyy-zzzz"


def test_ghsa_reconstructed_shape():
    data = json.loads((FIX / "ghsa_reconstructed.json").read_text())
    c = GhsaClient(_client(lambda r: httpx.Response(200, json=data), ["api.github.com"]),
                   sleep=lambda s: None)
    out = c.advisories("npm", "jsonwebtoken")
    assert out[0].cve_id == "CVE-2022-23541" and out[0].cvss == 5.0
