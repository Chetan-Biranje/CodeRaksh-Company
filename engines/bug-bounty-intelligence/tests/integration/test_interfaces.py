import json

import httpx
import pytest
from fastapi.testclient import TestClient
from typer.testing import CliRunner

from coderaksh.api import create_app
from coderaksh.cli import app as cli
from tests.conftest import approved_yaml

AUTH = {"Authorization": "Bearer test-token-0123456789-abcdefgh"}


@pytest.fixture
def env(monkeypatch, tmp_path, programs_dir):
    monkeypatch.setenv("CODERAKSH_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("CODERAKSH_PROGRAMS_DIR", str(programs_dir))
    monkeypatch.delenv("TAPLINE_API_KEY", raising=False)
    return tmp_path


def test_cli_basics(env, scope_path):
    r = CliRunner()
    assert r.invoke(cli, ["version"]).stdout.strip() == "0.1.0"
    out = r.invoke(cli, ["scope", "validate", str(scope_path)])
    assert out.exit_code == 0 and json.loads(out.stdout)["program_id"] == "example-pilot"
    out = r.invoke(cli, ["plan", str(scope_path)])
    assert out.exit_code == 0 and "planned cost:" in out.stdout and "indeed" not in out.stdout
    out = r.invoke(cli, ["run", str(scope_path)])
    assert out.exit_code == 0 and "(simulated)" in out.stdout
    assert r.invoke(cli, ["credits"]).exit_code == 0
    assert r.invoke(cli, ["cve", "CVE-2099-0001"]).exit_code == 0
    assert json.loads(r.invoke(cli, ["ledger"]).stdout)


def test_cli_live_refused_without_approval(env, scope_path):
    r = CliRunner()
    out = r.invoke(cli, ["run", str(scope_path), "--mode", "live", "--approve-pilot", "example-pilot"])
    assert out.exit_code == 3
    ok = approved_yaml(scope_path)
    out = r.invoke(cli, ["run", str(ok), "--mode", "live", "--approve-pilot", "example-approved"])
    assert out.exit_code == 1 and "TAPLINE_API_KEY" in out.stderr


def test_cli_bad_scope_file(env, tmp_path):
    bad = tmp_path / "bad.yaml"
    bad.write_text("program: {}")
    assert CliRunner().invoke(cli, ["scope", "validate", str(bad)]).exit_code == 1


@pytest.fixture
def api(settings):
    return TestClient(create_app(settings))


def test_api_auth(api, settings):
    assert api.get("/health").status_code == 200
    assert api.get("/v1/programs").status_code == 401
    assert api.get("/v1/programs", headers={"Authorization": "Bearer nope"}).status_code == 401
    from dataclasses import replace
    locked = TestClient(create_app(replace(settings, api_token=None)))
    assert locked.get("/v1/programs", headers=AUTH).status_code == 503


def test_api_flow(api):
    assert api.get("/v1/programs", headers=AUTH).json()[0]["program_id"] == "example-pilot"
    plan = api.post("/v1/plan", headers=AUTH, json={"program_id": "example-pilot"}).json()
    assert plan["planned_cost"] <= plan["cap"] == 500
    run = api.post("/v1/runs", headers=AUTH, json={"program_id": "example-pilot"}).json()
    assert run["credits_simulated"] and run["hypotheses"] > 0
    md = api.get(f"/v1/runs/example-pilot/{run['run_id']}/report.md", headers=AUTH)
    assert md.status_code == 200 and "Research brief" in md.text
    assert api.get(f"/v1/runs/example-pilot/{run['run_id']}", headers=AUTH).json()["run_id"]
    assert api.get("/v1/ledger", headers=AUTH).json()
    assert api.get("/v1/credits", headers=AUTH).json()["simulated"] is True
    cves = api.post("/v1/intel/cve", headers=AUTH, json={"cves": ["CVE-2099-0001", "nope"]}).json()
    assert cves == [{"cve_id": "CVE-2099-0001", "kev": True, "kev_due_date": "2099-01-01",
                     "epss": 0.42, "epss_percentile": 0.97}]


def test_api_live_refused_and_ids_validated(api):
    r = api.post("/v1/runs", headers=AUTH, json={"program_id": "example-pilot", "mode": "live",
                                                 "approval": "example-pilot"})
    assert r.status_code == 403
    assert api.post("/v1/plan", headers=AUTH, json={"program_id": "../etc/passwd"}).status_code == 422
    assert api.get("/v1/runs/example-pilot/..%2f..%2fx", headers=AUTH).status_code in (404, 422)
    assert api.post("/v1/plan", headers=AUTH, json={"program_id": "missing"}).status_code == 404


def test_api_docs_off_and_security_headers(api):
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert api.get(path).status_code == 404
    h = api.get("/health").headers
    assert h["x-content-type-options"] == "nosniff" and h["cache-control"] == "no-store"
    assert h["referrer-policy"] == "no-referrer"


def test_api_rejects_short_token_and_bad_ids(settings):
    from dataclasses import replace
    weak = TestClient(create_app(replace(settings, api_token="short")))
    assert weak.get("/v1/programs", headers={"Authorization": "Bearer short"}).status_code == 503
    ok = TestClient(create_app(settings))
    r = ok.post("/v1/plan", headers=AUTH, json={"program_id": "../../etc/passwd"})
    assert r.status_code == 422


def test_api_error_mapping(settings, monkeypatch):
    import coderaksh.api as api_mod
    from coderaksh.errors import RunInProgress
    from coderaksh.sources.tapline import TaplineError
    c = TestClient(create_app(settings), raise_server_exceptions=False)
    for exc, code in [(RunInProgress("busy"), 409), (TaplineError("x", 402, "no_credits", None), 402),
                      (TaplineError("x", 503, "down", None), 502), (httpx.ConnectError("secret-host"), 502)]:
        def boom(*a, _e=exc, **k):
            raise _e
        monkeypatch.setattr(api_mod.Engine, "run", boom)
        r = c.post("/v1/runs", headers=AUTH, json={"program_id": "example-pilot"})
        assert r.status_code == code, (exc, r.status_code, r.text)
        assert "secret-host" not in r.text
