"""Scope file loading, host classification and the live-mode approval gate."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, ValidationError, field_validator

from .config import PILOT_HARD_CAP
from .errors import ApprovalRequired, ScopeError

_HOST_RE = re.compile(r"^(\*\.)?([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$")
_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")

HostStatus = Literal["in_scope", "out_of_scope", "unlisted"]


def _check_hosts(values: list[str]) -> list[str]:
    out = []
    for v in values:
        v = v.strip().lower()
        if not _HOST_RE.match(v):
            raise ValueError(f"not a valid hostname or wildcard: {v!r} (IPs and URLs are rejected)")
        out.append(v)
    return out


class ProgramInfo(BaseModel):
    id: str
    name: str
    platform: str = ""
    policy_url: str

    @field_validator("id")
    @classmethod
    def _id(cls, v: str) -> str:
        if not _ID_RE.match(v):
            raise ValueError("program id must match ^[a-z0-9][a-z0-9_-]{0,63}$")
        return v

    @field_validator("policy_url")
    @classmethod
    def _url(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("policy_url must be an https URL")
        return v


class Authorization(BaseModel):
    confirmed: bool = False
    confirmed_by: str = ""
    confirmed_on: str = ""


class Pilot(BaseModel):
    approved: bool = False
    approved_by: str = ""
    approved_on: str = ""
    max_credits: int = PILOT_HARD_CAP

    @field_validator("max_credits")
    @classmethod
    def _cap(cls, v: int) -> int:
        if v < 0:
            raise ValueError("max_credits must be >= 0")
        return min(v, PILOT_HARD_CAP)


class ScopeRules(BaseModel):
    in_scope: list[str]
    out_of_scope: list[str] = Field(default_factory=list)
    reference_domains: list[str] = Field(default_factory=list)

    @field_validator("in_scope", "out_of_scope", "reference_domains")
    @classmethod
    def _hosts(cls, v: list[str]) -> list[str]:
        return _check_hosts(v)

    @field_validator("in_scope")
    @classmethod
    def _non_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("scope.in_scope must list at least one asset")
        return v


class OrgInfo(BaseModel):
    keywords: list[str]
    linkedin_company_url: str | None = None
    twitter_handles: list[str] = Field(default_factory=list)
    youtube_channels: list[str] = Field(default_factory=list)

    @field_validator("keywords")
    @classmethod
    def _kw(cls, v: list[str]) -> list[str]:
        v = [k.strip() for k in v if k.strip()]
        if not v:
            raise ValueError("org.keywords needs at least one organisation name")
        if any(len(k) < 3 for k in v):
            raise ValueError("org.keywords entries must be at least 3 characters")
        return v

    @field_validator("twitter_handles")
    @classmethod
    def _tw(cls, v: list[str]) -> list[str]:
        return [h.lstrip("@").lower() for h in v]


class ResearchOptions(BaseModel):
    max_site_queries_per_domain: int = 4
    max_job_details: int = 5
    include_news: bool = True
    include_youtube: bool = True
    youtube_queries: int = 1
    # Public OpenAPI files you downloaded yourself, relative to the scope file. Never fetched.
    openapi_files: list[str] = Field(default_factory=list)


class ScopePolicy(BaseModel):
    program: ProgramInfo
    authorization: Authorization = Field(default_factory=Authorization)
    pilot: Pilot = Field(default_factory=Pilot)
    scope: ScopeRules
    org: OrgInfo
    research: ResearchOptions = Field(default_factory=ResearchOptions)
    source_sha256: str = ""

    # ---- host classification -------------------------------------------------
    @staticmethod
    def _match(pattern: str, host: str) -> bool:
        if pattern.startswith("*."):
            return host.endswith(pattern[1:]) and host != pattern[2:]
        return host == pattern

    def classify_host(self, host: str) -> HostStatus:
        host = host.strip().lower().rstrip(".")
        if any(self._match(p, host) for p in self.scope.out_of_scope):
            return "out_of_scope"  # out-of-scope always wins
        if any(self._match(p, host) for p in self.scope.in_scope):
            return "in_scope"
        return "unlisted"

    def is_reference_domain(self, host: str) -> bool:
        host = host.strip().lower().rstrip(".")
        if self.classify_host(host) == "out_of_scope":
            return False
        return any(host == d or host.endswith("." + d) for d in self.scope.reference_domains)

    def is_org_owned(self, host: str) -> bool:
        """Hosts the organisation controls: in-scope or reference domains."""
        return self.classify_host(host) == "in_scope" or self.is_reference_domain(host)

    # ---- approval gate ---------------------------------------------------------
    def assert_live_allowed(self, approval_token: str | None) -> None:
        """Live mode needs a confirmed authorization, a pilot approval and a typed token."""
        problems = []
        if not (self.authorization.confirmed and self.authorization.confirmed_by.strip()):
            problems.append("authorization.confirmed and confirmed_by must be set in the scope file")
        if not (self.pilot.approved and self.pilot.approved_by.strip()):
            problems.append("pilot.approved and approved_by must be set in the scope file")
        if approval_token != self.program.id:
            problems.append(f"approval token must equal the program id ({self.program.id!r})")
        if problems:
            raise ApprovalRequired("Live mode blocked: " + "; ".join(problems))

    def summary(self) -> dict:
        return {
            "program_id": self.program.id,
            "policy_url": self.program.policy_url,
            "in_scope": self.scope.in_scope,
            "out_of_scope": self.scope.out_of_scope,
            "reference_domains": self.scope.reference_domains,
            "authorization_confirmed": self.authorization.confirmed,
            "pilot_approved": self.pilot.approved,
            "pilot_max_credits": self.pilot.max_credits,
            "scope_file_sha256": self.source_sha256,
        }


def load_scope(path: str | Path) -> ScopePolicy:
    p = Path(path)
    try:
        raw = p.read_bytes()
    except OSError as exc:
        raise ScopeError(f"cannot read scope file {p}: {exc}") from exc
    try:
        data = yaml.safe_load(raw)
        if not isinstance(data, dict):
            raise ScopeError("scope file must be a YAML mapping")
        policy = ScopePolicy.model_validate(data)
    except yaml.YAMLError as exc:
        raise ScopeError(f"invalid YAML in {p}: {exc}") from exc
    except ValidationError as exc:
        raise ScopeError(f"invalid scope file {p}:\n{exc}") from exc
    policy.source_sha256 = hashlib.sha256(raw).hexdigest()
    return policy
