from __future__ import annotations

import hashlib
import hmac
import json
import os
import sqlite3
import time
from collections import defaultdict, deque
from pathlib import Path
from threading import Lock
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINTS = ROOT / "MAP2_20_agents"
AUDIT_DB = Path(os.getenv("AUDIT_DB_PATH", "/tmp/coderaksh-audit.sqlite3"))
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
RATE_LIMIT = max(10, int(os.getenv("RATE_LIMIT_PER_MINUTE", "120")))

app = FastAPI(
    title="CodeRaksh Automation Hub",
    version="2.0.0",
    description="Secure catalog, validator, and operations API for n8n automation blueprints.",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.mount("/dashboard", StaticFiles(directory=ROOT / "app" / "dashboard", html=True), name="dashboard")

_rate_hits: dict[str, deque[float]] = defaultdict(deque)
_rate_lock = Lock()


class BlueprintSummary(BaseModel):
    name: str
    domain: str
    path: str
    node_count: int
    has_placeholders: bool


class ValidationIssue(BaseModel):
    file: str
    code: str
    message: str
    severity: str = "error"


class ValidationResult(BaseModel):
    valid: bool
    checked_files: int = 0
    errors: list[str] = Field(default_factory=list)
    issues: list[ValidationIssue] = Field(default_factory=list)
    score: int = 0


class PaginatedBlueprints(BaseModel):
    items: list[BlueprintSummary]
    total: int
    limit: int
    offset: int


class StatsResponse(BaseModel):
    total: int
    by_domain: dict[str, int]
    total_nodes: int
    with_placeholders: int
    validation: ValidationResult


def _domain(name: str) -> str:
    parts = name.split("_", 2)
    return parts[1] if len(parts) > 1 else "general"


def _read_blueprint(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _contains_placeholder(value: Any) -> bool:
    if isinstance(value, str):
        return "YOUR_" in value or "REPLACE_" in value
    if isinstance(value, dict):
        return any(_contains_placeholder(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_placeholder(item) for item in value)
    return False


def load_blueprints() -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for path in sorted(BLUEPRINTS.glob("*.json")):
        data = _read_blueprint(path)
        if data is None:
            continue
        nodes = data.get("nodes", [])
        result.append(
            {
                "name": path.stem,
                "domain": _domain(path.stem),
                "path": path.relative_to(ROOT).as_posix(),
                "data": data,
                "node_count": len(nodes) if isinstance(nodes, list) else 0,
                "has_placeholders": _contains_placeholder(data),
            }
        )
    return result


def validate_files() -> ValidationResult:
    issues: list[ValidationIssue] = []
    files = sorted(BLUEPRINTS.glob("*.json"))
    if not files:
        return ValidationResult(valid=False, errors=["No blueprint files found"], score=0)

    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            issues.append(ValidationIssue(file=path.name, code="invalid_json", message=str(exc)))
            continue
        if not isinstance(data, dict):
            issues.append(ValidationIssue(file=path.name, code="root_type", message="Root must be an object"))
            continue
        nodes = data.get("nodes")
        if not isinstance(nodes, list):
            issues.append(ValidationIssue(file=path.name, code="nodes_type", message="nodes must be an array"))
            continue
        ids: list[str] = []
        for index, node in enumerate(nodes):
            if not isinstance(node, dict):
                issues.append(ValidationIssue(file=path.name, code="node_type", message=f"Node {index} must be an object"))
                continue
            node_id = node.get("id")
            if isinstance(node_id, str):
                ids.append(node_id)
            if not node.get("name"):
                issues.append(ValidationIssue(file=path.name, code="node_name", message=f"Node {index} has no name", severity="warning"))
        duplicates = sorted({node_id for node_id in ids if ids.count(node_id) > 1})
        if duplicates:
            issues.append(ValidationIssue(file=path.name, code="duplicate_node_ids", message=f"Duplicate IDs: {', '.join(duplicates)}"))
        if "connections" in data and not isinstance(data["connections"], dict):
            issues.append(ValidationIssue(file=path.name, code="connections_type", message="connections must be an object"))
        if _contains_placeholder(data):
            issues.append(ValidationIssue(file=path.name, code="placeholder", message="Contains setup placeholders", severity="warning"))

    errors = [issue.message for issue in issues if issue.severity == "error"]
    score = max(0, round(100 - (len(errors) * 10) - (len(issues) - len(errors) > 0) * 2))
    return ValidationResult(valid=not errors, checked_files=len(files), errors=errors, issues=issues, score=score)


def _audit(action: str, detail: str) -> None:
    try:
        AUDIT_DB.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(AUDIT_DB) as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY, action TEXT, detail TEXT, created_at REAL)")
            connection.execute("INSERT INTO audit_log(action, detail, created_at) VALUES (?, ?, ?)", (action, detail[:500], time.time()))
            connection.commit()
    except sqlite3.Error:
        pass


def require_admin(x_api_key: str | None = Header(default=None)) -> None:
    if ADMIN_API_KEY and not x_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin API key required")
    if ADMIN_API_KEY and not hmac.compare_digest(x_api_key or "", ADMIN_API_KEY):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin API key")


@app.middleware("http")
async def security_and_rate_limit(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _rate_lock:
        hits = _rate_hits[client]
        while hits and hits[0] <= now - 60:
            hits.popleft()
        if len(hits) >= RATE_LIMIT:
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        hits.append(now)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
    return response


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health() -> dict[str, Any]:
    validation = validate_files()
    return {"status": "ok" if validation.valid else "degraded", "blueprints": validation.checked_files, "valid": validation.valid, "version": app.version}


@app.get("/ready")
def ready() -> dict[str, str]:
    if not BLUEPRINTS.exists():
        raise HTTPException(status_code=503, detail="Blueprint store unavailable")
    return {"status": "ready"}


@app.get("/api/v1/blueprints", response_model=PaginatedBlueprints)
@app.get("/api/blueprints", response_model=PaginatedBlueprints, include_in_schema=False)
def blueprints(
    domain: str | None = Query(default=None, min_length=1, max_length=50),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    sort: str = Query(default="name", pattern="^(name|domain|node_count)$"),
    descending: bool = False,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PaginatedBlueprints:
    items = load_blueprints()
    if domain:
        items = [item for item in items if item["domain"].lower() == domain.lower()]
    if search:
        term = search.lower()
        items = [item for item in items if term in item["name"].lower() or term in item["domain"].lower()]
    items.sort(key=lambda item: item[sort], reverse=descending)
    page = items[offset : offset + limit]
    return PaginatedBlueprints(items=[BlueprintSummary(**{key: item[key] for key in ("name", "domain", "path", "node_count", "has_placeholders")}) for item in page], total=len(items), limit=limit, offset=offset)


@app.get("/api/v1/blueprints/{name}")
@app.get("/api/blueprints/{name}", include_in_schema=False)
def blueprint(name: str) -> dict[str, Any]:
    match = next((item for item in load_blueprints() if item["name"] == name), None)
    if not match:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return match


@app.get("/api/v1/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    items = load_blueprints()
    by_domain: dict[str, int] = defaultdict(int)
    for item in items:
        by_domain[item["domain"]] += 1
    return StatsResponse(total=len(items), by_domain=dict(sorted(by_domain.items())), total_nodes=sum(item["node_count"] for item in items), with_placeholders=sum(item["has_placeholders"] for item in items), validation=validate_files())


@app.post("/api/v1/validate", response_model=ValidationResult, dependencies=[Depends(require_admin)])
@app.post("/api/validate", response_model=ValidationResult, include_in_schema=False, dependencies=[Depends(require_admin)])
def validate_blueprints() -> ValidationResult:
    result = validate_files()
    _audit("validate", json.dumps({"valid": result.valid, "score": result.score}))
    return result


@app.get("/api/v1/audit", dependencies=[Depends(require_admin)])
def audit(limit: int = Query(default=50, ge=1, le=200)) -> list[dict[str, Any]]:
    if not AUDIT_DB.exists():
        return []
    with sqlite3.connect(AUDIT_DB) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute("SELECT id, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(row) for row in rows]
