"""Call policy: which Tapline endpoints may be used and with which arguments.

Deny by default. Indeed and personal LinkedIn profiles are excluded on purpose.
"""

from __future__ import annotations

import re
from urllib.parse import unquote, urlparse

from .errors import PolicyViolation
from .scope import ScopePolicy

# endpoint path -> credits, taken from `search_endpoints`/`get_endpoint` on 2026-11-27.
CATALOG: dict[str, int] = {
    "/v1/account/credits": 0,
    "/v1/brave-search/search": 5,
    "/v1/brave-search/news": 5,
    "/v1/linkedin/company": 1,
    "/v1/linkedin/company/posts": 1,
    "/v1/linkedin/jobs/search": 1,
    "/v1/linkedin/job": 1,
    "/v1/linkedin/post": 1,
    "/v1/twitter/profile": 1,
    "/v1/twitter/user-tweets": 1,
    "/v1/twitter/tweet": 1,
    "/v1/youtube/search": 3,
    "/v1/youtube/channels/{channel_id}/videos": 3,
    "/v1/youtube/videos/{video_id}/metadata": 3,
    "/v1/youtube/videos/{video_id}/subtitles": 2,
}

EXCLUDED_PREFIXES = ("/v1/indeed", "/v1/linkedin/profile")

_TEMPLATE_RULES = [
    (re.compile(r"^/v1/youtube/channels/[^/]+/videos$"), "/v1/youtube/channels/{channel_id}/videos"),
    (re.compile(r"^/v1/youtube/videos/[^/]+/metadata$"), "/v1/youtube/videos/{video_id}/metadata"),
    (re.compile(r"^/v1/youtube/videos/[^/]+/subtitles$"), "/v1/youtube/videos/{video_id}/subtitles"),
]
_PATH_RE = re.compile(r"^/[A-Za-z0-9_\-./@]+$")
_SITE_RE = re.compile(r"(?<![\w-])site:([^\s\"')(]+)", re.IGNORECASE)
_SITE_ANY = re.compile(r"site:", re.IGNORECASE)


def template_for(path: str) -> str:
    """Map a concrete path to its catalog template."""
    clean = "/" + path.strip().strip("/")
    for rx, tpl in _TEMPLATE_RULES:
        if rx.match(clean):
            return tpl
    return clean


def cost_of(path: str) -> int:
    tpl = template_for(path)
    if tpl not in CATALOG:
        raise PolicyViolation(f"endpoint {path!r} is not in the cost catalog")
    return CATALOG[tpl]


def _slug(url: str) -> str:
    parts = [p for p in urlparse(url if "//" in url else "https://" + url).path.split("/") if p]
    return parts[1].lower() if len(parts) >= 2 else ""


class CallPolicy:
    def __init__(self, scope: ScopePolicy):
        self.scope = scope
        self._seen_job_urls: set[str] = set()
        self._seen_video_ids: set[str] = set()
        self._company_ids: set[str] = set()

    # Values the pipeline discovered through org-scoped calls may be used in follow-up calls.
    def register_job_url(self, url: str) -> None:
        self._seen_job_urls.add(url)

    def register_video_id(self, video_id: str) -> None:
        self._seen_video_ids.add(video_id)

    def register_company_id(self, company_id: str) -> None:
        self._company_ids.add(str(company_id))

    def _has_org_keyword(self, text: str) -> bool:
        low = text.lower()
        return any(k.lower() in low for k in self.scope.org.keywords)

    def _overlaps_out_of_scope(self, domain: str) -> bool:
        """True if an out-of-scope entry is this domain or sits underneath it."""
        for p in self.scope.scope.out_of_scope:
            base = p[2:] if p.startswith("*.") else p
            if base == domain or base.endswith("." + domain):
                return True
        return False

    def _check_query_text(self, q: str, endpoint: str) -> None:
        if not q or len(q) > 400:
            raise PolicyViolation(f"{endpoint}: query is required and must be <= 400 characters")
        sites = _SITE_RE.findall(q)
        if len(_SITE_ANY.findall(q)) != len(sites):
            raise PolicyViolation(f"{endpoint}: unsupported site: syntax (quotes, negation)")
        if not sites:
            if not self._has_org_keyword(q):
                raise PolicyViolation(
                    f"{endpoint}: query must use site:<in-scope domain> or contain an organisation keyword"
                )
            return
        for raw in sites:
            host = raw.lower().split("/")[0].rstrip(".")
            wildcard = host.startswith("*.")
            domain = host[2:] if wildcard else host
            probe = "wildcard-probe." + domain if wildcard else host
            if self.scope.classify_host(probe) == "out_of_scope":
                raise PolicyViolation(f"{endpoint}: site:{host} is out of scope")
            if not self.scope.is_org_owned(probe):
                raise PolicyViolation(f"{endpoint}: site:{host} is not an in-scope or reference domain")
            if self._overlaps_out_of_scope(domain):
                raise PolicyViolation(f"{endpoint}: site:{host} would also cover an out-of-scope host")

    def check(self, path: str, query: dict | None = None) -> str:
        """Raise PolicyViolation unless the call is allowed. Returns the catalog template."""
        query = query or {}
        if not path.startswith("/"):
            raise PolicyViolation(f"suspicious path {path!r}")  # the transport joins it to the base URL
        clean = "/" + path.strip().strip("/")
        bad = clean != path.rstrip("/") or unquote(clean) != clean or not _PATH_RE.match(clean)
        if bad or ".." in clean or "//" in clean:
            raise PolicyViolation(f"suspicious path {path!r}")
        if any(clean.lower().startswith(p) for p in EXCLUDED_PREFIXES):
            raise PolicyViolation(f"{clean} is excluded by policy (Indeed and personal profiles)")
        tpl = template_for(clean)
        if tpl not in CATALOG:
            raise PolicyViolation(f"{clean} is not on the endpoint allowlist")

        if tpl in ("/v1/brave-search/search", "/v1/brave-search/news"):
            self._check_query_text(str(query.get("query", "")), tpl)
        elif tpl in ("/v1/linkedin/company", "/v1/linkedin/company/posts"):
            want = self.scope.org.linkedin_company_url
            url = str(query.get("url", ""))
            if not want or _slug(url) != _slug(want) or "/company/" not in url.lower():
                raise PolicyViolation(f"{tpl}: url must be the organisation's company page")
        elif tpl == "/v1/linkedin/jobs/search":
            ids = {i for i in str(query.get("company_ids", "")).split(",") if i}
            if ids:
                if not ids <= self._company_ids:
                    raise PolicyViolation(f"{tpl}: company_ids must come from the organisation's page")
            elif not self._has_org_keyword(str(query.get("keywords", ""))):
                raise PolicyViolation(f"{tpl}: needs company_ids or an organisation keyword")
        elif tpl == "/v1/linkedin/job":
            if str(query.get("url", "")) not in self._seen_job_urls:
                raise PolicyViolation(f"{tpl}: url was not returned by an org-scoped job search")
        elif tpl == "/v1/linkedin/post":
            slug = _slug(self.scope.org.linkedin_company_url or "")
            if not slug or f"linkedin.com/posts/{slug}_" not in str(query.get("url", "")).lower():
                raise PolicyViolation(f"{tpl}: post must belong to the organisation's page")
        elif tpl in ("/v1/twitter/profile", "/v1/twitter/user-tweets"):
            handle = str(query.get("handle", "")).lstrip("@").lower()
            if handle not in self.scope.org.twitter_handles:
                raise PolicyViolation(f"{tpl}: handle is not an official organisation handle")
        elif tpl == "/v1/twitter/tweet":
            m = re.search(r"(?:x|twitter)\.com/([A-Za-z0-9_]+)/status/", str(query.get("url", "")))
            if not m or m.group(1).lower() not in self.scope.org.twitter_handles:
                raise PolicyViolation(f"{tpl}: tweet is not from an official organisation handle")
        elif tpl == "/v1/youtube/search":
            if not self._has_org_keyword(str(query.get("query", ""))):
                raise PolicyViolation(f"{tpl}: query must contain an organisation keyword")
        elif tpl == "/v1/youtube/channels/{channel_id}/videos":
            ch = clean.split("/")[4].lstrip("@").lower()
            if ch not in {c.lstrip("@").lower() for c in self.scope.org.youtube_channels}:
                raise PolicyViolation(f"{tpl}: channel is not an official organisation channel")
        elif tpl.startswith("/v1/youtube/videos/"):
            vid = clean.split("/")[4]
            if vid not in self._seen_video_ids:
                raise PolicyViolation(f"{tpl}: video was not returned by an org-scoped search")
        return tpl
