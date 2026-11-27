import json

import httpx
import pytest

from coderaksh.errors import ApprovalRequired, ConfigError
from coderaksh.ledger import Ledger
from coderaksh.mock import mock_http_handler, mock_tapline
from coderaksh.pipeline import Engine, plan_calls, plan_cost
from coderaksh.scope import load_scope
from coderaksh.sources.tapline import MockTransport
from tests.conftest import approved_yaml


def run(settings, path, **kw):
    return Engine(settings, load_scope(path), scope_path=path, **kw).run()


def test_mock_run_end_to_end(settings, scope_path):
    r = run(settings, scope_path)
    assert r.mode == "mock" and r.credits_simulated
    assert 0 < r.credits_spent <= 500
    assert r.credits_spent <= plan_cost(r.planned_calls)
    names = {s.name: s.status for s in r.tech_signals}
    assert names["Keycloak"] == "confirmed" and names["Okta"] == "inferred"
    cats = {h.category for h in r.hypotheses}
    assert {"BOLA", "BFLA", "JWT", "OAUTH"} <= cats
    assert any(i.kev and i.cve_id == "CVE-2099-0001" and i.epss == 0.42 for i in r.intel)
    assert all(e.content_hash and e.source_url for e in r.evidence)
    md = (settings.reports_dir / r.program_id / f"{r.run_id}.md").read_text()
    assert "## Technology stack" in md and "Version numbers are rarely public" in md
    data = json.loads((settings.reports_dir / r.program_id / f"{r.run_id}.json").read_text())
    assert data["run_id"] == r.run_id


def test_run_never_uses_excluded_endpoints(settings, scope_path):
    run(settings, scope_path)
    led = Ledger(settings.db_path)
    paths = {row["path"] for row in led.summary()}
    assert paths and not any(p.startswith(("/v1/indeed", "/v1/linkedin/profile")) for p in paths)


def test_second_run_is_served_from_cache(settings, scope_path):
    first = run(settings, scope_path)
    second = run(settings, scope_path)
    assert first.credits_spent > 0
    assert second.credits_spent == 0 and second.credits_cache_saved == first.credits_spent


def test_circuit_breaker_skips_optional_calls(settings, scope_path):
    from dataclasses import replace
    r = run(replace(settings, run_budget=10), scope_path)
    assert r.credits_spent <= 10
    assert r.skipped_calls  # optional calls were dropped instead of overspending


def test_plan_is_static_and_within_cap(scope_path):
    calls = plan_calls(load_scope(scope_path))
    assert 0 < plan_cost(calls) <= 500
    assert all(c.cost == 0 or c.path.startswith("/v1/") for c in calls)


def test_openapi_file_must_live_beside_scope(settings, scope_path):
    scope_path.write_text(scope_path.read_text().replace("example-openapi.json", "../../etc/passwd"))
    from coderaksh.errors import CodeRakshError
    with pytest.raises(CodeRakshError):
        run(settings, scope_path)


def test_live_blocked_without_approval(settings, scope_path):
    with pytest.raises(ApprovalRequired):
        run(settings, scope_path, mode="live", approval="example-pilot")


def test_live_blocked_without_token(settings, scope_path):
    ok = approved_yaml(scope_path)
    with pytest.raises(ApprovalRequired):
        run(settings, ok, mode="live", approval=None)


def test_live_needs_api_key(settings, scope_path):
    ok = approved_yaml(scope_path)
    with pytest.raises(ConfigError, match="TAPLINE_API_KEY"):
        run(settings, ok, mode="live", approval="example-approved")


def test_live_path_with_injected_transports(settings, scope_path):
    """Approved live run, with both transports faked so nothing touches the network."""
    from dataclasses import replace
    s = replace(settings, tapline_api_key="test-key-not-real")
    ok = approved_yaml(scope_path)
    r = run(s, ok, mode="live", approval="example-approved",
            tapline_transport=MockTransport(mock_tapline),
            http_transport=httpx.MockTransport(mock_http_handler))
    assert r.mode == "live" and not r.credits_simulated and r.credits_spent <= 500
    assert r.balance_before == 100000
