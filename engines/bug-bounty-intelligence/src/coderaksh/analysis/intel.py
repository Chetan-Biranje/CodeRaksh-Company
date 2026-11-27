"""Vulnerability intelligence for identified technologies (NVD, KEV, EPSS, OSV, GHSA).

Results are leads for a watchlist. Versions are almost never public, so a CVE match here does
not mean the target is vulnerable.
"""

from __future__ import annotations

import httpx

from ..errors import SourceRateLimited
from ..models import TechSignal, VulnIntel
from ..sources.vulndb import EpssClient, GhsaClient, KevClient, NvdClient, OsvClient
from .stack import signature_by_name

MAX_SIGNALS = 8
MAX_RESULTS = 30


def _merge(items: list[VulnIntel]) -> list[VulnIntel]:
    merged: dict[str, VulnIntel] = {}
    for v in items:
        cur = merged.get(v.cve_id)
        if not cur:
            merged[v.cve_id] = v.model_copy()
            continue
        cur.source = ",".join(sorted(set(cur.source.split(",")) | {v.source}))
        cur.cvss = max(filter(None, [cur.cvss, v.cvss]), default=None)
        cur.severity = cur.severity or v.severity
        cur.summary = cur.summary or v.summary
        cur.references = list(dict.fromkeys(cur.references + v.references))[:6]
        if v.matched_signal and v.matched_signal not in cur.matched_signal:
            cur.matched_signal = ", ".join(filter(None, [cur.matched_signal, v.matched_signal]))
    return list(merged.values())


def gather_intel(
    signals: list[TechSignal],
    *,
    nvd: NvdClient,
    kev: KevClient,
    epss: EpssClient,
    osv: OsvClient,
    ghsa: GhsaClient,
    warnings: list[str],
) -> list[VulnIntel]:
    ordered = sorted(signals, key=lambda s: (s.status != "confirmed", s.name))[:MAX_SIGNALS]
    found: list[VulnIntel] = []
    kev_entries: list[dict] = []
    for sig in ordered:
        spec = signature_by_name(sig.name)
        if not spec:
            continue
        lookups = []
        if spec.nvd:
            lookups.append(("nvd", lambda s=spec, n=sig.name: nvd.search(s.nvd, n)))
        if spec.osv:
            lookups.append(("osv", lambda s=spec, n=sig.name: osv.query(*s.osv, signal=n)))
        if spec.ghsa:
            lookups.append(("ghsa", lambda s=spec, n=sig.name: ghsa.advisories(*s.ghsa, signal=n)))
        for label, fn in lookups:
            try:
                found.extend(fn())
                if label == "osv" and osv.last_truncated:
                    warnings.append(f"osv results for {sig.name} truncated to the first page")
            except (httpx.HTTPError, ValueError, SourceRateLimited) as exc:
                warnings.append(f"{label} lookup for {sig.name} failed: {type(exc).__name__}")
        if spec.kev:
            try:
                for e in kev.match_keywords(list(spec.kev))[:5]:
                    kev_entries.append({**e, "_signal": sig.name})
            except (httpx.HTTPError, ValueError, SourceRateLimited) as exc:
                warnings.append(f"kev lookup failed: {type(exc).__name__}")

    for e in kev_entries:
        found.append(VulnIntel(
            cve_id=e["cveID"], source="kev",
            summary=(e.get("shortDescription") or e.get("vulnerabilityName", ""))[:400],
            matched_signal=e["_signal"],
        ))
    merged = _merge(found)

    try:
        catalog = kev.catalog()
        for v in merged:
            entry = catalog.get(v.cve_id)
            if entry:
                v.kev, v.kev_due_date = True, entry.get("dueDate")
    except (httpx.HTTPError, ValueError, SourceRateLimited) as exc:
        warnings.append(f"kev catalog failed: {type(exc).__name__}")
    try:
        scores = epss.scores([v.cve_id for v in merged])
        for v in merged:
            if v.cve_id in scores:
                v.epss, v.epss_percentile = scores[v.cve_id]
    except (httpx.HTTPError, ValueError, SourceRateLimited) as exc:
        warnings.append(f"epss lookup failed: {type(exc).__name__}")

    merged.sort(key=lambda v: (not v.kev, -(v.epss or 0.0), -(v.cvss or 0.0), v.cve_id))
    return merged[:MAX_RESULTS]
