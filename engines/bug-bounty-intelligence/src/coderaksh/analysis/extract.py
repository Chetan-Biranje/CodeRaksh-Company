"""Turn Tapline JSON bodies into SourceDoc objects and assign source tiers.

Tapline's response schemas have not been captured yet (no live call has been made), so the
walker is tolerant: it looks for URL-like and text-like keys anywhere in the JSON. Once a
pilot is approved, real samples should be used to tighten it.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from ..models import SourceDoc
from ..redact import redact
from ..scope import ScopePolicy

URL_KEYS = ("url", "link", "permalink", "href", "post_url", "job_url", "canonical_url")
TITLE_KEYS = ("title", "name", "headline", "job_title", "fulltitle")
TEXT_KEYS = ("description", "snippet", "text", "content", "body", "summary", "caption",
             "message", "about", "tagline", "specialties", "tags", "requirements")
TIER2_SUFFIXES = ("nvd.nist.gov", "cisa.gov", "osv.dev", "first.org", "github.com/advisories")
MAX_TEXT = 4000
_WS = re.compile(r"\s+")


def _flat(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(_flat(v) for v in value if isinstance(v, str | list))
    return ""


def clean(text: str) -> str:
    return redact(_WS.sub(" ", text).strip()[:MAX_TEXT])


def tier_for(url: str, scope: ScopePolicy) -> int:
    p = urlparse(url)
    host = (p.hostname or "").lower()
    if not host:
        return 3
    if scope.is_org_owned(host):
        return 1
    parts = [x for x in p.path.split("/") if x]
    if host.endswith("linkedin.com") and len(parts) >= 2 and parts[0] == "company":
        want = urlparse(scope.org.linkedin_company_url or "").path.strip("/").split("/")
        if len(want) >= 2 and want[1].lower() == parts[1].lower():
            return 1
    if host in ("x.com", "twitter.com", "www.x.com", "www.twitter.com") and parts:
        if parts[0].lower() in scope.org.twitter_handles:
            return 1
    url_l = url.lower()
    if any(s in host or s in url_l for s in TIER2_SUFFIXES):
        return 2
    return 3


def extract_docs(origin: str, body: Any, fallback_url: str, scope: ScopePolicy) -> list[SourceDoc]:
    docs: list[SourceDoc] = []

    def walk(node: Any, top: bool) -> None:
        if isinstance(node, list):
            for n in node:
                walk(n, False)
            return
        if not isinstance(node, dict):
            return
        url = next((node[k] for k in URL_KEYS
                    if isinstance(node.get(k), str) and node[k].startswith("http")), None)
        title = next((node[k] for k in TITLE_KEYS if isinstance(node.get(k), str)), "")
        text = clean(" ".join(_flat(node[k]) for k in TEXT_KEYS if k in node))
        if (url or top) and (title or text):
            u = url or fallback_url
            docs.append(SourceDoc(url=u, title=clean(title)[:200], text=text, origin=origin,
                                  tier=tier_for(u, scope)))
        for v in node.values():
            if isinstance(v, dict | list):
                walk(v, False)

    walk(body, True)
    if not docs and body:
        blob = clean(" ".join(_collect_strings(body)))
        if blob:
            docs.append(SourceDoc(url=fallback_url, text=blob, origin=origin,
                                  tier=tier_for(fallback_url, scope)))
    return docs


def _collect_strings(node: Any) -> list[str]:
    if isinstance(node, str):
        return [node]
    if isinstance(node, dict):
        return [s for v in node.values() for s in _collect_strings(v)]
    if isinstance(node, list):
        return [s for v in node for s in _collect_strings(v)]
    return []
