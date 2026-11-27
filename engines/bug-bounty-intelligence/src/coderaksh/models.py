"""Data models shared across the engine."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(UTC)


class SourceDoc(BaseModel):
    """A piece of public text collected from one source."""

    url: str
    title: str = ""
    text: str = ""
    origin: str = ""  # Tapline path or free-source name
    tier: int = 3  # 1 = official/org-owned, 2 = advisory/government, 3 = third party
    fetched_at: datetime = Field(default_factory=utcnow)


class Evidence(BaseModel):
    id: str
    claim: str
    source_url: str
    origin: str
    tier: int
    fetched_at: datetime
    content_hash: str
    snippet: str = ""


class TechSignal(BaseModel):
    name: str
    category: str
    status: Literal["confirmed", "inferred"] = "inferred"
    evidence_ids: list[str] = Field(default_factory=list)
    source_domains: list[str] = Field(default_factory=list)


class Hypothesis(BaseModel):
    id: str
    category: str  # BOLA, IDOR, BFLA, BOPLA, OAUTH, JWT
    title: str
    asset: str = ""
    scope_status: Literal["in_scope", "out_of_scope", "unlisted", "n/a"] = "n/a"
    rationale: str
    evidence_ids: list[str] = Field(default_factory=list)
    manual_test_notes: str = ""
    status: Literal["hypothesis"] = "hypothesis"


class VulnIntel(BaseModel):
    cve_id: str
    source: str
    summary: str = ""
    cvss: float | None = None
    severity: str | None = None
    kev: bool = False
    kev_due_date: str | None = None
    epss: float | None = None
    epss_percentile: float | None = None
    matched_signal: str = ""
    references: list[str] = Field(default_factory=list)


class PlannedCall(BaseModel):
    path: str
    query: dict = Field(default_factory=dict)
    cost: int
    purpose: str
    priority: int = 1  # 0 = essential, 1 = optional (dropped by the circuit breaker)


class RunReport(BaseModel):
    run_id: str
    program_id: str
    program_name: str
    mode: str
    started_at: datetime
    finished_at: datetime | None = None
    scope_summary: dict = Field(default_factory=dict)
    credits_simulated: bool = True
    credits_spent: int = 0
    credits_cache_saved: int = 0
    credits_budget: int = 0
    pilot_credits_used: int | None = None  # lifetime live spend on this program
    balance_before: int | None = None
    balance_after: int | None = None
    planned_calls: list[PlannedCall] = Field(default_factory=list)
    skipped_calls: list[str] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    tech_signals: list[TechSignal] = Field(default_factory=list)
    intel: list[VulnIntel] = Field(default_factory=list)
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
