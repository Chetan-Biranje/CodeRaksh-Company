"""Markdown and JSON rendering of a RunReport."""

from __future__ import annotations

from .models import RunReport

STATUS_NOTE = {
    "in_scope": "in scope",
    "out_of_scope": "OUT OF SCOPE",
    "unlisted": "not listed (do not test)",
    "n/a": "n/a",
}


def render_json(report: RunReport) -> str:
    return report.model_dump_json(indent=2)


def _cell(text: object) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ")


def render_markdown(r: RunReport) -> str:
    sim = "simulated: mock mode, no real credits spent" if r.credits_simulated else "real"
    lines = [
        f"# Research brief: {r.program_name}",
        "",
        f"Run `{r.run_id}` | mode `{r.mode}` | started {r.started_at:%Y-%m-%d %H:%M} UTC",
        "",
        "This brief is built from public information only. Items marked hypothesis are leads for "
        "manual testing within the program's rules, not findings.",
        "",
        "## Scope",
        f"- Policy: {r.scope_summary.get('policy_url', '')}",
        f"- In scope: {', '.join(r.scope_summary.get('in_scope', []))}",
        f"- Out of scope: {', '.join(r.scope_summary.get('out_of_scope', [])) or 'none listed'}",
        f"- Authorization confirmed: {r.scope_summary.get('authorization_confirmed')} | "
        f"pilot approved: {r.scope_summary.get('pilot_approved')}",
        f"- Scope file SHA-256: `{r.scope_summary.get('scope_file_sha256', '')[:16]}`",
        "",
        "## Credits",
        f"- Spent: {r.credits_spent} of {r.credits_budget} ({sim})",
        f"- Saved by cache: {r.credits_cache_saved}",
        f"- Pilot budget used so far (live, all runs): {r.pilot_credits_used}"
        if r.pilot_credits_used is not None else "- Pilot budget: not applicable in mock mode",
        f"- Account balance before / after: {r.balance_before} / {r.balance_after}",
        "",
        "## Technology stack",
    ]
    if r.tech_signals:
        lines += ["| Technology | Category | Status | Sources |", "|---|---|---|---|"]
        for s in r.tech_signals:
            lines.append(f"| {_cell(s.name)} | {s.category} | {s.status} | "
                         f"{_cell(', '.join(s.source_domains))} |")
    else:
        lines.append("No technologies identified.")
    lines.append("")
    lines.append("`confirmed` means one official source or two independent hosts; "
                 "`inferred` means a single third-party mention.")

    for title, cats in (("OAuth and JWT", ("OAUTH", "JWT")),
                        ("API authorization (BOLA, IDOR, BFLA, BOPLA)",
                         ("BOLA", "IDOR", "BFLA", "BOPLA"))):
        items = [h for h in r.hypotheses if h.category in cats]
        lines += ["", f"## {title}"]
        if not items:
            lines.append("No hypotheses.")
        for h in items:
            lines += [
                f"### {h.title}",
                f"- Category: {h.category} | Host: `{h.asset or 'unknown'}` | "
                f"Scope: {STATUS_NOTE[h.scope_status]}",
                f"- Why: {h.rationale}",
                f"- Evidence: {', '.join(h.evidence_ids)}",
                f"- Manual check: {h.manual_test_notes}",
            ]

    lines += ["", "## Vulnerability watchlist",
              "Version numbers are rarely public, so these are leads, not confirmed exposure."]
    if r.intel:
        lines += ["", "| CVE / ID | Technology | CVSS | KEV | EPSS | Source |", "|---|---|---|---|---|---|"]
        for v in r.intel:
            epss = f"{v.epss:.2f}" if v.epss is not None else ""
            lines.append(f"| {v.cve_id} | {_cell(v.matched_signal)} | {v.cvss or ''} | "
                         f"{'yes' if v.kev else ''} | {epss} | {v.source} |")
    else:
        lines.append("\nNo entries.")

    lines += ["", "## Evidence", "", "| ID | Tier | Claim | Source | Fetched | Hash |",
              "|---|---|---|---|---|---|"]
    for e in r.evidence:
        lines.append(f"| {e.id} | {e.tier} | {_cell(e.claim)} | {_cell(e.source_url)} | "
                     f"{e.fetched_at:%Y-%m-%d} | `{e.content_hash}` |")

    if r.skipped_calls or r.warnings:
        lines += ["", "## Skipped calls and warnings"]
        lines += [f"- skipped: {_cell(s)}" for s in r.skipped_calls]
        lines += [f"- warning: {_cell(w)}" for w in r.warnings]
    return "\n".join(lines) + "\n"
