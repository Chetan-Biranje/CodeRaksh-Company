"""Settings, read only from environment variables. Secrets are never given defaults."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

from .errors import ConfigError

PILOT_HARD_CAP = 500  # credits. Settings can lower this, never raise it.
CIRCUIT_BREAKER_RATIO = 0.8
VALID_MODES = ("mock", "live")

# Verified 2026-11-27 from Tapline's quickstart (https://tapline.sh/SKILL.md) and the OpenAPI file
# https://tapline.sh/openapi.airbnb.json: servers[0].url and securitySchemes.APIKeyHeader.
TAPLINE_BASE_URL = "https://api.tapline.sh"
TAPLINE_AUTH_HEADER = "X-API-Key"  # the key is sent bare, with no "Bearer" prefix
# The same quickstart says free accounts allow 1 request per second, 5 with a credit pack.
TAPLINE_MIN_INTERVAL = 1.0


def _float(env: Mapping[str, str], key: str, default: float) -> float:
    try:
        return max(0.0, float(env.get(key, default)))
    except ValueError as exc:
        raise ConfigError(f"{key} must be a number") from exc


@dataclass(frozen=True)
class Settings:
    mode: str = "mock"
    data_dir: Path = Path("./data")
    programs_dir: Path = Path("./programs")
    run_budget: int = PILOT_HARD_CAP
    tapline_base_url: str = TAPLINE_BASE_URL
    tapline_auth_header: str = TAPLINE_AUTH_HEADER
    tapline_auth_prefix: str = ""
    tapline_min_interval: float = TAPLINE_MIN_INTERVAL
    # Sending the API key to any host other than api.tapline.sh needs this explicit opt-in.
    allow_custom_tapline_host: bool = False
    tapline_api_key: str | None = field(default=None, repr=False)
    nvd_api_key: str | None = field(default=None, repr=False)
    github_token: str | None = field(default=None, repr=False)
    api_token: str | None = field(default=None, repr=False)

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> Settings:
        e = os.environ if env is None else env
        mode = e.get("CODERAKSH_MODE", "mock").lower()
        if mode not in VALID_MODES:
            raise ConfigError(f"CODERAKSH_MODE must be one of {VALID_MODES}, got {mode!r}")
        try:
            budget = int(e.get("CODERAKSH_RUN_BUDGET", str(PILOT_HARD_CAP)))
        except ValueError as exc:
            raise ConfigError("CODERAKSH_RUN_BUDGET must be an integer") from exc
        budget = max(0, min(budget, PILOT_HARD_CAP))
        return cls(
            mode=mode,
            data_dir=Path(e.get("CODERAKSH_DATA_DIR", "./data")),
            programs_dir=Path(e.get("CODERAKSH_PROGRAMS_DIR", "./programs")),
            run_budget=budget,
            tapline_base_url=e.get("TAPLINE_BASE_URL") or TAPLINE_BASE_URL,
            tapline_auth_header=e.get("TAPLINE_AUTH_HEADER") or TAPLINE_AUTH_HEADER,
            tapline_auth_prefix=e.get("TAPLINE_AUTH_PREFIX", ""),
            tapline_min_interval=_float(e, "TAPLINE_MIN_INTERVAL", TAPLINE_MIN_INTERVAL),
            allow_custom_tapline_host=e.get("TAPLINE_ALLOW_CUSTOM_HOST") == "1",
            tapline_api_key=e.get("TAPLINE_API_KEY") or None,
            nvd_api_key=e.get("NVD_API_KEY") or None,
            github_token=e.get("GITHUB_TOKEN") or None,
            api_token=e.get("CODERAKSH_API_TOKEN") or None,
        )

    @property
    def db_path(self) -> Path:
        return self.data_dir / "state.db"

    @property
    def reports_dir(self) -> Path:
        return self.data_dir / "reports"

    def ensure_dirs(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
