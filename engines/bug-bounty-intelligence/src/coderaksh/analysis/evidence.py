"""Evidence store, claim verification and de-duplication."""

from __future__ import annotations

import hashlib
import re
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from ..models import Evidence, SourceDoc
from ..redact import redact

_TRACKING = re.compile(r"^(utm_|fbclid|gclid|ref$|trk|trackingid)", re.IGNORECASE)


def canonical_url(url: str) -> str:
    p = urlparse(url.strip())
    q = [(k, v) for k, v in parse_qsl(p.query) if not _TRACKING.match(k)]
    path = p.path.rstrip("/") or "/"
    return urlunparse((p.scheme.lower(), p.netloc.lower(), path, "", urlencode(q), ""))


def dedupe_docs(docs: list[SourceDoc]) -> list[SourceDoc]:
    """One document per canonical URL; when duplicates differ, keep the one with more text."""
    best: dict[str, SourceDoc] = {}
    for d in docs:
        key = canonical_url(d.url)
        if key not in best or len(d.text) > len(best[key].text):
            best[key] = d
    return list(best.values())


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def snippet_around(text: str, start: int, end: int, width: int = 80) -> str:
    return text[max(0, start - width) : min(len(text), end + width)].strip()


class EvidenceStore:
    def __init__(self) -> None:
        self._items: dict[str, Evidence] = {}
        self._by_claim: dict[str, list[str]] = {}

    def add(self, claim: str, doc: SourceDoc, snippet: str = "") -> Evidence:
        eid = "ev-" + _sha(f"{claim}|{canonical_url(doc.url)}")[:10]
        if eid not in self._items:
            self._items[eid] = Evidence(
                id=eid, claim=claim, source_url=doc.url, origin=doc.origin, tier=doc.tier,
                fetched_at=doc.fetched_at, content_hash=_sha(doc.text)[:16],
                snippet=redact(snippet)[:240],
            )
            self._by_claim.setdefault(claim, []).append(eid)
        return self._items[eid]

    def for_claim(self, claim: str) -> list[Evidence]:
        return [self._items[i] for i in self._by_claim.get(claim, [])]

    def all(self) -> list[Evidence]:
        return list(self._items.values())

    def get(self, eid: str) -> Evidence | None:
        return self._items.get(eid)

    def verify(self, claim: str) -> tuple[str, list[str]]:
        """'confirmed' = one tier-1 source or two independent hosts; otherwise 'inferred'."""
        evs = self.for_claim(claim)
        hosts = sorted({urlparse(e.source_url).hostname or "" for e in evs} - {""})
        if any(e.tier == 1 for e in evs) or len(hosts) >= 2:
            return "confirmed", hosts
        return "inferred", hosts
