"""Orchestration: plan, collect, verify, analyse, enrich, report."""

from __future__ import annotations

import json
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse

import httpx

from .analysis import api_authz, oauth_jwt, stack
from .analysis.evidence import EvidenceStore, dedupe_docs
from .analysis.extract import extract_docs
from .analysis.intel import gather_intel
from .cache import Cache
from .config import PILOT_HARD_CAP, Settings
from .errors import BudgetExceeded, CodeRakshError
from .ledger import BudgetGuard, Ledger
from .mock import mock_http_handler, mock_tapline
from .models import PlannedCall, RunReport, SourceDoc, utcnow
from .policy import CallPolicy, cost_of
from .report import render_json, render_markdown
from .runlock import exclusive_run
from .scope import ScopePolicy
from .sources.http import make_client
from .sources.tapline import (
    MockTransport,
    RestTransport,
    TaplineClient,
    TaplineError,
    Transport,
)
from .sources.vulndb import EpssClient, GhsaClient, KevClient, NvdClient, OsvClient

SITE_TOPICS = ("oauth", '"api reference"', "jwt", "changelog")
JOB_TITLE_HINT = re.compile(r"api|auth|security|backend|platform|identity|infrastructure", re.I)
_VIDEO_RE = re.compile(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})")


def plan_calls(scope: ScopePolicy) -> list[PlannedCall]:
    """Static plan plus the follow-up calls the run is expected to make. No network."""
    r, calls = scope.research, []

    def add(path, query, purpose, priority=1):
        calls.append(PlannedCall(path=path, query=query, cost=cost_of(path),
                                 purpose=purpose, priority=priority))

    if scope.org.linkedin_company_url:
        add("/v1/linkedin/company", {"url": scope.org.linkedin_company_url},
            "Company page: headcount and numeric company id", 0)
        add("/v1/linkedin/company/posts", {"url": scope.org.linkedin_company_url, "page": 1},
            "Latest company posts")
        add("/v1/linkedin/jobs/search", {"keywords": scope.org.keywords[0], "company_ids": "<id>"},
            "Open roles at the organisation (stack signals)")
        for i in range(r.max_job_details):
            add("/v1/linkedin/job", {"url": f"<job url {i + 1}>"}, "Job detail for stack signals")
    domains = list(dict.fromkeys(
        scope.scope.reference_domains + [d for d in scope.scope.in_scope if not d.startswith("*.")]))
    for d in domains:
        for topic in SITE_TOPICS[: r.max_site_queries_per_domain]:
            add("/v1/brave-search/search", {"query": f"site:{d} {topic}", "freshness": "any"},
                f"Public documentation on {d}: {topic}", 0 if topic == "oauth" else 1)
    if r.include_news:
        add("/v1/brave-search/news", {"query": f'"{scope.org.keywords[0]}" security'},
            "Recent security-related news")
    for h in scope.org.twitter_handles:
        add("/v1/twitter/profile", {"handle": h}, "Official account profile")
        add("/v1/twitter/user-tweets", {"handle": h}, "Latest official posts")
    if r.include_youtube:
        for _ in range(r.youtube_queries):
            add("/v1/youtube/search", {"query": f'"{scope.org.keywords[0]}" api security'},
                "Conference talks and demos")
    return calls


def plan_cost(calls: list[PlannedCall]) -> int:
    return sum(c.cost for c in calls)


class Engine:
    def __init__(
        self,
        settings: Settings,
        scope: ScopePolicy,
        *,
        scope_path: Path | None = None,
        mode: str | None = None,
        approval: str | None = None,
        tapline_transport: Transport | None = None,
        http_transport: httpx.BaseTransport | None = None,
    ):
        self.settings, self.scope = settings, scope
        self.scope_dir = scope_path.parent if scope_path else Path(".")
        self.mode = mode or settings.mode
        self.approval = approval
        self._tapline_transport = tapline_transport
        self._http_transport = http_transport

    # ------------------------------------------------------------------ run
    def run(self) -> RunReport:
        if self.mode == "live":
            self.scope.assert_live_allowed(self.approval)
            self.settings.ensure_dirs()
            with exclusive_run(self.settings.data_dir):  # one live run at a time
                return self._run()
        return self._run()

    def _run(self) -> RunReport:
        self.settings.ensure_dirs()
        run_id = uuid.uuid4().hex[:12]
        program_cap = min(self.scope.pilot.max_credits, PILOT_HARD_CAP)
        cap = min(self.settings.run_budget, program_cap)
        ledger = Ledger(self.settings.db_path)
        cache = Cache(self.settings.data_dir / f"cache-{self.mode}.db")
        guard = BudgetGuard(ledger, run_id=run_id, program=self.scope.program.id,
                            mode=self.mode, cap=cap,
                            program_cap=program_cap if self.mode == "live" else None)
        policy = CallPolicy(self.scope)
        report = RunReport(
            run_id=run_id, program_id=self.scope.program.id, program_name=self.scope.program.name,
            mode=self.mode, started_at=utcnow(), scope_summary=self.scope.summary(),
            credits_simulated=self.mode != "live", credits_budget=cap,
        )
        http = None
        try:
            if self.mode == "live":
                host = urlparse(self.settings.tapline_base_url).hostname
                http = make_client(extra_hosts=[host] if host else [],
                                   transport=self._http_transport)
                transport = self._tapline_transport or RestTransport(self.settings, http)
            else:
                http = make_client(transport=self._http_transport
                                   or httpx.MockTransport(mock_http_handler))
                transport = self._tapline_transport or MockTransport(mock_tapline)
            client = TaplineClient(transport, policy, cache, guard)
            store = EvidenceStore()

            report.planned_calls = plan_calls(self.scope)
            if plan_cost(report.planned_calls) > cap:
                report.warnings.append(
                    f"Planned cost {plan_cost(report.planned_calls)} exceeds the cap {cap}; "
                    "optional calls will be skipped."
                )
            report.balance_before = client.account_credits()
            if self.mode == "live" and report.balance_before is not None:
                need = min(plan_cost(report.planned_calls), guard.remaining)
                if report.balance_before < need:
                    raise BudgetExceeded(
                        f"account balance {report.balance_before} is below the planned cost {need}"
                    )
            docs = self._collect(client, policy, report)
            docs = dedupe_docs(docs)
            specs = self._openapi_docs()  # local files you supplied; never fetched

            signals = stack.identify(docs, store)
            hyps = oauth_jwt.analyze(docs, store, self.scope)
            hyps += api_authz.analyze_text(docs, self.scope, store)
            for d in specs:
                hyps += api_authz.analyze_openapi(json.loads(d.text), self.scope, d, store)
            report.hypotheses = api_authz.rank(hyps)
            report.tech_signals = signals

            # Public rate limits apply to the real services only; mock mode must not sleep.
            nap = {"sleep": (lambda _s: None)} if self.mode != "live" else {}
            report.intel = gather_intel(
                signals,
                nvd=NvdClient(http, cache, api_key=self.settings.nvd_api_key, **nap),
                kev=KevClient(http, cache, **nap), epss=EpssClient(http, cache, **nap),
                osv=OsvClient(http, cache, **nap),
                ghsa=GhsaClient(http, cache, token=self.settings.github_token, **nap),
                warnings=report.warnings,
            )
            report.evidence = store.all()
            report.balance_after = client.account_credits()
            report.credits_spent = ledger.spent(run_id=run_id)
            if self.mode == "live":
                report.pilot_credits_used = guard.program_spent
            report.credits_cache_saved = ledger.saved(run_id=run_id)
            if client.credits_source_estimated:
                report.warnings.append("Transport did not report credits; catalog costs were used.")
            b, a = report.balance_before, report.balance_after
            if self.mode == "live" and b is not None and a is not None and b - a != report.credits_spent:
                report.warnings.append(
                    f"Balance drift: balance fell by {b - a} but the ledger recorded "
                    f"{report.credits_spent}. Check the Tapline dashboard."
                )
            report.finished_at = utcnow()
            self._write(report)
            return report
        finally:
            if http:
                http.close()
            cache.close()
            ledger.close()

    # -------------------------------------------------------------- collect
    def _collect(self, client: TaplineClient, policy: CallPolicy, report: RunReport) -> list[SourceDoc]:
        docs: list[SourceDoc] = []

        def call(path: str, query: dict, fallback_url: str, priority: int = 1):
            try:
                body = client.get(path, query, priority=priority)
            except BudgetExceeded as exc:
                report.skipped_calls.append(f"{path} {json.dumps(query)[:80]}: {exc}")
                return None
            except TaplineError as exc:
                if exc.fatal:  # bad key or no credits: every later call would fail too
                    raise
                report.warnings.append(f"{path} failed: {exc}")
                return None
            docs.extend(extract_docs(path, body, fallback_url, self.scope))
            return body

        # Calls are replayed from the plan so the plan and the run can never drift apart.
        company_id = None
        job_urls: list[str] = []
        for p in report.planned_calls:
            path, q = p.path, dict(p.query)
            if path == "/v1/linkedin/company":
                body = call(path, q, q["url"], p.priority)
                if isinstance(body, dict) and isinstance(body.get("id"), int | str):
                    company_id = str(body["id"])
                    policy.register_company_id(company_id)
            elif path == "/v1/linkedin/jobs/search":
                if not company_id:
                    report.skipped_calls.append("linkedin jobs: no company id returned")
                    continue
                q["company_ids"] = company_id
                body = call(path, q, self.scope.org.linkedin_company_url or "", p.priority)
                for j in (body or {}).get("jobs", []) if isinstance(body, dict) else []:
                    if isinstance(j, dict) and j.get("url"):
                        policy.register_job_url(j["url"])
                        if JOB_TITLE_HINT.search(str(j.get("title", ""))):
                            job_urls.append(j["url"])
            elif path == "/v1/linkedin/job":
                if not job_urls:
                    continue
                url = job_urls.pop(0)
                call(path, {"url": url}, url, p.priority)
            elif path == "/v1/youtube/search":
                body = call(path, q, "https://www.youtube.com/results", p.priority)
                for m in _VIDEO_RE.finditer(json.dumps(body or {})):
                    policy.register_video_id(m.group(1))
            else:
                call(path, q, q.get("url") or f"https://search.invalid/{path.strip('/')}", p.priority)
        return docs

    def _openapi_docs(self) -> list[SourceDoc]:
        out = []
        for rel in self.scope.research.openapi_files:
            path = (self.scope_dir / rel).resolve()
            if not path.is_file() or self.scope_dir.resolve() not in path.parents:
                raise CodeRakshError(f"openapi file must be inside the scope directory: {rel}")
            text = path.read_text(encoding="utf-8")
            json.loads(text)  # must be JSON; YAML specs should be converted first
            out.append(SourceDoc(url=f"file://{path.name}", title=path.name, text=text,
                                 origin="openapi", tier=1))
        return out

    # ---------------------------------------------------------------- write
    def _write(self, report: RunReport) -> None:
        d = self.settings.reports_dir / report.program_id
        d.mkdir(parents=True, exist_ok=True)
        (d / f"{report.run_id}.json").write_text(render_json(report), encoding="utf-8")
        (d / f"{report.run_id}.md").write_text(render_markdown(report), encoding="utf-8")


# ---------------------------------------------------------------------------- helpers
def _transport_and_http(settings: Settings, mode: str):
    if mode == "live":
        http = make_client(extra_hosts=[urlparse(settings.tapline_base_url).hostname or ""])
        return RestTransport(settings, http), http
    http = make_client(transport=httpx.MockTransport(mock_http_handler))
    return MockTransport(mock_tapline), http


def get_balance(settings: Settings, mode: str | None = None) -> dict:
    """Free balance check (`/v1/account/credits`)."""
    mode = mode or settings.mode
    transport, http = _transport_and_http(settings, mode)
    try:
        body = transport.call("/v1/account/credits", None).body
    finally:
        http.close()
    return {"mode": mode, "simulated": mode != "live", "balance": body}


def cve_lookup(settings: Settings, cves: list[str], mode: str | None = None) -> list[dict]:
    """KEV membership and EPSS for CVE ids. Free public sources, no Tapline credits."""
    mode = mode or settings.mode
    settings.ensure_dirs()
    http = make_client(transport=None if mode == "live" else httpx.MockTransport(mock_http_handler))
    cache = Cache(settings.data_dir / f"cache-{mode}.db")
    try:
        ids = sorted({c.upper() for c in cves if re.fullmatch(r"CVE-\d{4}-\d{4,7}", c.upper())})
        nap = {"sleep": (lambda _s: None)} if mode != "live" else {}
        kev = KevClient(http, cache, **nap).catalog()
        scores = EpssClient(http, cache, **nap).scores(ids)
        return [{"cve_id": c, "kev": c in kev,
                 "kev_due_date": kev.get(c, {}).get("dueDate"),
                 "epss": scores.get(c, (None, None))[0],
                 "epss_percentile": scores.get(c, (None, None))[1]} for c in ids]
    finally:
        http.close()
        cache.close()
