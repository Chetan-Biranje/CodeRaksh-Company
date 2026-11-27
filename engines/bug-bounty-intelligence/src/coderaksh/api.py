"""FastAPI backend. Every route except /health needs `Authorization: Bearer $CODERAKSH_API_TOKEN`."""

from __future__ import annotations

import hmac
import os
import re
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from . import __version__
from .config import PILOT_HARD_CAP, Settings
from .errors import (
    ApprovalRequired,
    BudgetExceeded,
    CodeRakshError,
    ConfigError,
    PolicyViolation,
    RunInProgress,
    ScopeError,
    SourceRateLimited,
)
from .ledger import Ledger
from .pipeline import Engine, cve_lookup, get_balance, plan_calls, plan_cost
from .scope import ScopePolicy, load_scope
from .sources.tapline import TaplineError

_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
_RUN = re.compile(r"^[0-9a-f]{12}$")


ID_PATTERN = r"^[a-z0-9][a-z0-9_-]{0,63}$"
MIN_TOKEN_LENGTH = 24


class PlanRequest(BaseModel):
    program_id: str = Field(pattern=ID_PATTERN)


class RunRequest(BaseModel):
    program_id: str = Field(pattern=ID_PATTERN)
    mode: str = Field(default="mock", pattern="^(mock|live)$")
    approval: str | None = None


class CveRequest(BaseModel):
    cves: list[str] = Field(max_length=200)


def create_app(settings: Settings | None = None) -> FastAPI:
    cfg = settings or Settings.from_env()
    docs = os.environ.get("CODERAKSH_ENABLE_DOCS") == "1"  # interactive docs are off by default
    app = FastAPI(
        title="CodeRaksh Bug Bounty Intelligence Engine", version=__version__,
        docs_url="/docs" if docs else None, redoc_url=None,
        openapi_url="/openapi.json" if docs else None,
    )

    @app.middleware("http")
    async def _headers(request, call_next):  # noqa: ANN001
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    def auth(authorization: str | None = Header(default=None)) -> None:
        if not cfg.api_token or len(cfg.api_token) < MIN_TOKEN_LENGTH:
            raise HTTPException(
                503, f"CODERAKSH_API_TOKEN must be set and at least {MIN_TOKEN_LENGTH} characters"
            )
        supplied = (authorization or "").removeprefix("Bearer ").strip()
        if not hmac.compare_digest(supplied.encode(), cfg.api_token.encode()):
            raise HTTPException(401, "invalid or missing bearer token")

    def program_path(program_id: str) -> Path:
        if not _ID.match(program_id):
            raise HTTPException(422, "invalid program id")
        p = cfg.programs_dir / f"{program_id}.yaml"
        if not p.is_file():
            raise HTTPException(404, "unknown program")
        return p

    def load(program_id: str) -> tuple[ScopePolicy, Path]:
        p = program_path(program_id)
        try:
            return load_scope(p), p
        except ScopeError as exc:
            raise HTTPException(422, str(exc)) from exc

    from fastapi.responses import JSONResponse

    @app.exception_handler(CodeRakshError)
    async def _handle(_, exc: CodeRakshError):  # noqa: ANN001
        code, msg = 500, str(exc)
        if isinstance(exc, ApprovalRequired | PolicyViolation):
            code = 403
        elif isinstance(exc, RunInProgress):
            code = 409
        elif isinstance(exc, ConfigError):
            code = 503
        elif isinstance(exc, BudgetExceeded | SourceRateLimited):
            code = 429
        elif isinstance(exc, TaplineError):
            code = 402 if exc.status == 402 else 502
        return JSONResponse({"error": msg}, status_code=code)

    @app.exception_handler(httpx.HTTPError)
    async def _upstream(_, exc: httpx.HTTPError):  # noqa: ANN001
        return JSONResponse({"error": "upstream request failed"}, status_code=502)

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "version": __version__, "mode": cfg.mode}

    @app.get("/v1/programs", dependencies=[Depends(auth)])
    def programs() -> list[dict]:
        out = []
        for f in sorted(cfg.programs_dir.glob("*.yaml")):
            try:
                s = load_scope(f).summary()
                out.append({k: s[k] for k in ("program_id", "authorization_confirmed",
                                              "pilot_approved", "pilot_max_credits")})
            except ScopeError:
                out.append({"program_id": f.stem, "error": "invalid scope file"})
        return out

    @app.get("/v1/programs/{program_id}/scope", dependencies=[Depends(auth)])
    def scope(program_id: str) -> dict:
        return load(program_id)[0].summary()

    @app.post("/v1/plan", dependencies=[Depends(auth)])
    def plan(req: PlanRequest) -> dict:
        s, _ = load(req.program_id)
        calls = plan_calls(s)
        cap = min(cfg.run_budget, s.pilot.max_credits, PILOT_HARD_CAP)
        return {"program_id": req.program_id, "cap": cap, "planned_cost": plan_cost(calls),
                "calls": [c.model_dump() for c in calls]}

    @app.post("/v1/runs", dependencies=[Depends(auth)])
    def start_run(req: RunRequest) -> dict:  # sync route: runs in a worker thread
        s, p = load(req.program_id)
        r = Engine(cfg, s, scope_path=p, mode=req.mode, approval=req.approval).run()
        return {"run_id": r.run_id, "program_id": r.program_id, "mode": r.mode,
                "credits_spent": r.credits_spent, "credits_simulated": r.credits_simulated,
                "technologies": len(r.tech_signals), "hypotheses": len(r.hypotheses),
                "watchlist": len(r.intel), "warnings": r.warnings}

    def report_file(program_id: str, run_id: str, ext: str) -> Path:
        if not _ID.match(program_id) or not _RUN.match(run_id):
            raise HTTPException(422, "invalid id")
        f = cfg.reports_dir / program_id / f"{run_id}.{ext}"
        if not f.is_file():
            raise HTTPException(404, "unknown run")
        return f

    @app.get("/v1/runs/{program_id}/{run_id}", dependencies=[Depends(auth)])
    def run_json(program_id: str, run_id: str):
        return PlainTextResponse(report_file(program_id, run_id, "json").read_text(),
                                 media_type="application/json")

    @app.get("/v1/runs/{program_id}/{run_id}/report.md", dependencies=[Depends(auth)])
    def run_md(program_id: str, run_id: str):
        return PlainTextResponse(report_file(program_id, run_id, "md").read_text(),
                                 media_type="text/markdown")

    @app.get("/v1/credits", dependencies=[Depends(auth)])
    def credits(mode: str | None = None) -> dict:
        if mode not in (None, "mock", "live"):
            raise HTTPException(422, "mode must be mock or live")
        return get_balance(cfg, mode)

    @app.get("/v1/ledger", dependencies=[Depends(auth)])
    def ledger(program_id: str | None = None) -> list[dict]:
        cfg.ensure_dirs()
        led = Ledger(cfg.db_path)
        try:
            return led.summary(program=program_id)
        finally:
            led.close()

    @app.post("/v1/intel/cve", dependencies=[Depends(auth)])
    def cve(req: CveRequest, mode: str | None = None) -> list[dict]:
        return cve_lookup(cfg, req.cves, mode)

    return app
