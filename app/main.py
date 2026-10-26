from pathlib import Path
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINTS = ROOT / "MAP2_20_agents"
app = FastAPI(title="CodeRaksh Automation Hub", version="0.1.0")

class BlueprintSummary(BaseModel):
    name: str
    domain: str
    path: str

class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)


def load_blueprints() -> list[dict]:
    result = []
    for path in sorted(BLUEPRINTS.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            result.append({"name": path.stem, "domain": path.stem.split("_", 2)[1] if "_" in path.stem else "general", "path": str(path.relative_to(ROOT)), "data": data})
        except (OSError, json.JSONDecodeError):
            continue
    return result

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "blueprints": len(load_blueprints())}

@app.get("/api/blueprints", response_model=list[BlueprintSummary])
def blueprints() -> list[dict]:
    return [{k: item[k] for k in ("name", "domain", "path")} for item in load_blueprints()]

@app.get("/api/blueprints/{name}")
def blueprint(name: str) -> dict:
    match = next((item for item in load_blueprints() if item["name"] == name), None)
    if not match:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return match

@app.post("/api/validate", response_model=ValidationResult)
def validate_blueprints() -> ValidationResult:
    errors: list[str] = []
    files = list(BLUEPRINTS.glob("*.json"))
    if not files:
        errors.append("No blueprint files found")
    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                errors.append(f"{path.name}: root must be an object")
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{path.name}: {exc}")
    return ValidationResult(valid=not errors, errors=errors)
