import pytest

from coderaksh.errors import ApprovalRequired, PolicyViolation, ScopeError
from coderaksh.policy import CATALOG, CallPolicy, cost_of
from coderaksh.scope import load_scope
from tests.conftest import approved_yaml


def test_load_and_classify(scope_path):
    s = load_scope(scope_path)
    assert s.classify_host("api.example.com") == "in_scope"
    assert s.classify_host("x.example.com") == "in_scope"
    assert s.classify_host("example.com") == "unlisted"  # wildcard does not match the apex
    assert s.classify_host("blog.example.com") == "out_of_scope"  # out-of-scope wins
    assert s.classify_host("evil.com") == "unlisted"
    assert len(s.source_sha256) == 64


@pytest.mark.parametrize("bad", ["10.0.0.1", "http://x.com", "localhost", "a_b.com"])
def test_invalid_scope_hosts_rejected(tmp_path, scope_path, bad):
    p = tmp_path / "bad.yaml"
    p.write_text(scope_path.read_text().replace("- api.example.com", f"- {bad}"))
    with pytest.raises(ScopeError):
        load_scope(p)


def test_policy_url_must_be_https(tmp_path, scope_path):
    p = tmp_path / "bad.yaml"
    p.write_text(scope_path.read_text().replace("https://hackerone.com", "http://hackerone.com"))
    with pytest.raises(ScopeError):
        load_scope(p)


def test_pilot_cap_clamped(tmp_path, scope_path):
    p = tmp_path / "big.yaml"
    p.write_text(scope_path.read_text().replace("max_credits: 500", "max_credits: 99999"))
    assert load_scope(p).pilot.max_credits == 500


def test_live_gate(scope_path):
    s = load_scope(scope_path)
    with pytest.raises(ApprovalRequired):
        s.assert_live_allowed("example-pilot")  # example file is not approved
    ok = load_scope(approved_yaml(scope_path))
    with pytest.raises(ApprovalRequired):
        ok.assert_live_allowed(None)
    with pytest.raises(ApprovalRequired):
        ok.assert_live_allowed("wrong")
    ok.assert_live_allowed("example-approved")


@pytest.fixture
def pol(scope_path):
    return CallPolicy(load_scope(scope_path))


@pytest.mark.parametrize("path", [
    "/v1/indeed/jobs/search", "/v1/indeed/companies/abc/jobs", "/v1/linkedin/profile",
    "/v1/linkedin/profile/", "/v1/instagram/profile", "/v1/brave-search/ai-answer",
    "/v1/linkedin/../indeed/x", "/v1/unknown",
])
def test_excluded_and_unknown_endpoints_denied(pol, path):
    with pytest.raises(PolicyViolation):
        pol.check(path, {"query": "Example Corp"})


def test_brave_site_rules(pol):
    pol.check("/v1/brave-search/search", {"query": "site:developers.example.com oauth"})
    pol.check("/v1/brave-search/search", {"query": "site:api.example.com jwt"})
    pol.check("/v1/brave-search/search", {"query": '"Example Corp" breach'})
    for q in ["site:blog.example.com x", "site:evil.com x", "oauth bugs", "site:example.com x", ""]:
        with pytest.raises(PolicyViolation):
            pol.check("/v1/brave-search/search", {"query": q})


def test_linkedin_and_twitter_rules(pol):
    pol.check("/v1/linkedin/company", {"url": "https://www.linkedin.com/company/example/"})
    with pytest.raises(PolicyViolation):
        pol.check("/v1/linkedin/company", {"url": "https://www.linkedin.com/company/other/"})
    with pytest.raises(PolicyViolation):
        pol.check("/v1/linkedin/job", {"url": "https://www.linkedin.com/jobs/view/1/"})
    pol.register_job_url("https://www.linkedin.com/jobs/view/1/")
    pol.check("/v1/linkedin/job", {"url": "https://www.linkedin.com/jobs/view/1/"})
    pol.check("/v1/twitter/user-tweets", {"handle": "@ExampleCorp"})
    with pytest.raises(PolicyViolation):
        pol.check("/v1/twitter/user-tweets", {"handle": "someone"})
    with pytest.raises(PolicyViolation):
        pol.check("/v1/twitter/tweet", {"url": "https://x.com/someone/status/1"})


def test_youtube_rules(pol):
    with pytest.raises(PolicyViolation):
        pol.check("/v1/youtube/videos/abc/metadata", {})
    pol.register_video_id("abc")
    pol.check("/v1/youtube/videos/abc/metadata", {})
    with pytest.raises(PolicyViolation):
        pol.check("/v1/youtube/search", {"query": "random topic"})


def test_catalog_costs_and_no_excluded_entries():
    assert cost_of("/v1/brave-search/search") == 5
    assert cost_of("/v1/youtube/videos/xyz/subtitles") == 2
    assert not any(p.startswith(("/v1/indeed", "/v1/linkedin/profile")) for p in CATALOG)
