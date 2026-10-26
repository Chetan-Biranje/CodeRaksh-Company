from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINTS = ROOT / "MAP2_20_agents"

app = FastAPI(
    title="CodeRaksh Automation Hub",
    version="1.0.0",
    description="Secure catalog and validator for n8n automation blueprints.",
    docs_url="/docs",
    redoc_url="/redoc",
)


class BlueprintSummary(BaseModel):
    name: str
    domain: str
    path: str
    node_count: int


class ValidationResult(BaseModel):
    valid: bool
    checked_files: int = 0
    errors: list[str] = Field(default_factory=list)


class PaginatedBlueprints(BaseModel):
    items: list[BlueprintSummary]
    total: int
    limit: int
    offset: int


def _domain(name: str) -> str:
    parts = name.split("_", 2)
    return parts[1] if len(parts) > 1 else "general"


def _read_blueprint(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def load_blueprints() -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for path in sorted(BLUEPRINTS.glob("*.json")):
        data = _read_blueprint(path)
        if data is None:
            continue
        result.append(
            {
                "name": path.stem,
                "domain": _domain(path.stem),
                "path": path.relative_to(ROOT).as_posix(),
                "data": data,
                "node_count": len(data.get("nodes", [])) if isinstance(data.get("nodes", []), list) else 0,
            }
        )
    return result


def validate_files() -> ValidationResult:
    errors: list[str] = []
    files = sorted(BLUEPRINTS.glob("*.json"))
    if not files:
        return ValidationResult(valid=False, errors=["No blueprint files found"])

    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                errors.append(f"{path.name}: root must be an object")
                continue
            if not isinstance(data.get("nodes"), list):
                errors.append(f"{path.name}: nodes must be an array")
            if "connections" in data and not isinstance(data["connections"], dict):
                errors.append(f"{path.name}: connections must be an object")
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            errors.append(f"{path.name}: {exc}")

    return ValidationResult(valid=not errors, checked_files=len(files), errors=errors)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health() -> dict[str, Any]:
    validation = validate_files()
    return {
        "status": "ok" if validation.valid else "degraded",
        "blueprints": validation.checked_files,
        "valid": validation.valid,
    }


@app.get("/api/blueprints", response_model=PaginatedBlueprints)
def blueprints(
    domain: str | None = Query(default=None, min_length=1, max_length=50),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PaginatedBlueprints:
    items = load_blueprints()
    if domain:
        items = [item for item in items if item["domain"].lower() == domain.lower()]
    total = len(items)
    page = items[offset : offset + limit]
    return PaginatedBlueprints(
        items=[BlueprintSummary(**{key: item[key] for key in ("name", "domain", "path", "node_count")}) for item in page],
        total=total,
        limit=limit,
        offset=offset,
    )


@app.get("/api/blueprints/{name}")
def blueprint(name: str) -> dict[str, Any]:
    match = next((item for item in load_blueprints() if item["name"] == name), None)
    if not match:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return match


@app.post("/api/validate", response_model=ValidationResult)
def validate_blueprints() -> ValidationResult:
    return validate_files()
