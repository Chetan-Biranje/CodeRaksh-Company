import httpx
import pytest

from coderaksh.analysis import api_authz, oauth_jwt, stack
from coderaksh.analysis.evidence import EvidenceStore, canonical_url, dedupe_docs
from coderaksh.analysis.extract import extract_docs, tier_for
from coderaksh.cache import Cache
from coderaksh.mock import mock_http_handler
from coderaksh.models import SourceDoc
from coderaksh.scope import load_scope
from coderaksh.sources.http import make_client
from coderaksh.sources.vulndb import (
    EpssClient,
    GhsaClient,
    KevClient,
    NvdClient,
    OsvClient,
)


@pytest.fixture
def scope(scope_path):
    return load_scope(scope_path)


def doc(url, text, tier=3):
    return SourceDoc(url=url, text=text, tier=tier, origin="t")


def test_tiers(scope):
    assert tier_for("https://developers.example.com/x", scope) == 1
    assert tier_for("https://www.linkedin.com/company/example/", scope) == 1
    assert tier_for("https://x.com/examplecorp/status/1", scope) == 1
    assert tier_for("https://blog.example.com/x", scope) == 3  # out of scope is not org-owned
    assert tier_for("https://nvd.nist.gov/vuln/detail/CVE-1", scope) == 2
    assert tier_for("https://random.test/", scope) == 3


def test_extract_is_tolerant(scope):
    body = {"web": {"results": [{"title": "T", "url": "https://a.test/p", "description": "hello"}]}}
    docs = extract_docs("o", body, "https://f.test", scope)
    assert [d.url for d in docs] == ["https://a.test/p"]
    flat = extract_docs("o", {"name": "Example Corp", "headcount": 3}, "https://f.test", scope)
    assert flat and flat[0].url == "https://f.test"
    assert extract_docs("o", {}, "https://f.test", scope) == []


def test_dedupe_and_canonical():
    assert canonical_url("HTTPS://A.test/p/?utm_source=x#frag") == "https://a.test/p"
    docs = [doc("https://a.test/p/", "short"), doc("https://a.test/p?utm_x=1", "much longer text")]
    out = dedupe_docs(docs)
    assert len(out) == 1 and out[0].text == "much longer text"


def test_claim_verification():
    st = EvidenceStore()
    st.add("tech:X", doc("https://a.test/1", "x"), "")
    assert st.verify("tech:X")[0] == "inferred"
    st.add("tech:X", doc("https://b.test/2", "x"), "")
    assert st.verify("tech:X")[0] == "confirmed"  # two independent hosts
    st.add("tech:Y", doc("https://dev.example.com/1", "y", tier=1), "")
    assert st.verify("tech:Y")[0] == "confirmed"  # one official source
    st.add("tech:X", doc("https://a.test/1", "x"), "")
    assert len(st.for_claim("tech:X")) == 2  # same claim+url is deduplicated


def test_stack_identify():
    st = EvidenceStore()
    sig = stack.identify([doc("https://a.test", "We run Django and Kong Gateway on AWS"),
                          doc("https://b.test", "our guardrails are strict; we use Okta")], st)
    names = {s.name: s.status for s in sig}
    assert {"Django", "Kong", "AWS", "Okta"} <= set(names)
    assert "Ruby on Rails" not in names  # 'guardrails' must not match the \brails\b pattern
    assert names["Okta"] == "inferred"


def test_oauth_jwt_hypotheses(scope):
    st = EvidenceStore()
    text = "OAuth 2.0 authorization code flow with redirect_uri. JWT RS256 and HS256. refresh_token."
    hyps = oauth_jwt.analyze([doc("https://developers.example.com/oauth", text, 1)], st, scope)
    titles = {h.title for h in hyps}
    assert "PKCE enforcement for public clients" in titles
    assert "Algorithm confusion between HS256 and RS256/ES256" in titles
    assert all(h.scope_status == "in_scope" and h.status == "hypothesis" for h in hyps)
    assert all("accounts and OAuth clients you own" in h.manual_test_notes for h in hyps)
    # PKCE mentioned: the gap hypothesis must disappear
    hyps2 = oauth_jwt.analyze([doc("https://developers.example.com/o", text + " PKCE", 1)],
                              EvidenceStore(), scope)
    assert "PKCE enforcement for public clients" not in {h.title for h in hyps2}


def test_api_text_and_openapi(scope, programs_dir):
    st = EvidenceStore()
    text = ("GET /v2/orders/{orderId} POST /v2/admin/export DELETE /v2/projects "
            "GET /v1/accounts/48213/profile")
    hyps = api_authz.analyze_text([doc("https://developers.example.com/api", text, 1)], scope, st)
    cats = {(h.category, h.title.split(":")[0]) for h in hyps}
    assert ("BOLA", "GET /v2/orders/{orderId}") in cats
    assert ("BFLA", "POST /v2/admin/export") in cats
    assert ("BFLA", "DELETE /v2/projects") in cats
    assert any(h.category == "IDOR" for h in hyps)

    import json
    spec = json.loads((programs_dir / "example-openapi.json").read_text())
    spec_hyps = api_authz.analyze_openapi(spec, scope, doc("file://spec", "{}", 1), st)
    assert any(h.category == "BOPLA" for h in spec_hyps)
    assert any("no authentication" in h.rationale for h in spec_hyps)
    assert all(h.scope_status == "in_scope" for h in spec_hyps)
    ranked = api_authz.rank(hyps + spec_hyps, limit=5)
    assert len(ranked) == 5


def test_out_of_scope_hosts_flagged(scope):
    h = api_authz.analyze_text([doc("https://blog.example.com/a", "GET /v1/users/{userId}")],
                               scope, EvidenceStore())
    assert h and h[0].scope_status == "out_of_scope" and "do not test" in h[0].manual_test_notes


def test_normalize_path():
    assert api_authz.normalize_path("/v1/users/123/orders/{oid}/") == "/v1/users/{id}/orders/{id}"
    assert api_authz.normalize_path("/a/:id/b/<uuid>") == "/a/{id}/b/{id}"


@pytest.fixture
def free(tmp_path):
    http = make_client(transport=httpx.MockTransport(mock_http_handler))
    return http, Cache(tmp_path / "f.db")


def test_free_sources_parse(free):
    http, cache = free
    nvd = NvdClient(http, cache, api_key="k", sleep=lambda s: None)
    r = nvd.search("Keycloak", "Keycloak")
    assert r[0].cve_id == "CVE-2099-0001" and r[0].cvss == 8.1 and r[0].severity == "HIGH"
    assert nvd.search("Nothing") == []
    assert "CVE-2099-0001" in KevClient(http, cache).catalog()
    assert [e["product"] for e in KevClient(http, cache).match_keywords(["kong"])] == ["Kong Gateway"]
    assert EpssClient(http, cache).scores(["CVE-2099-0001", "bad"]) == {
        "CVE-2099-0001": (0.42, 0.97), "CVE-2099-0002": (0.01, 0.40)}
    o = OsvClient(http, cache).query("PyPI", "django", "Django")
    assert o[0].cve_id == "CVE-2099-0002"
    g = GhsaClient(http, cache, token="t").advisories("npm", "jsonwebtoken")
    assert g[0].cve_id == "GHSA-synt-hetic-0004"


def test_free_sources_cache_and_throttle(tmp_path):
    hits, sleeps = [], []

    def h(req):
        hits.append(1)
        return httpx.Response(200, json={"vulnerabilities": []})

    http = make_client(transport=httpx.MockTransport(h))
    nvd = NvdClient(http, Cache(tmp_path / "c.db"), sleep=sleeps.append)  # no key: 6.5 s interval
    nvd.search("a")
    nvd.search("b")
    nvd.search("a")  # cached
    assert len(hits) == 2 and sleeps and sleeps[0] > 5
