"""Free public vulnerability sources: NVD, CISA KEV, EPSS, OSV and GitHub Advisories.

Response parsing follows each service's public documentation. Tests use synthetic fixtures;
nothing here has been checked against live responses yet.
"""

from __future__ import annotations

import httpx

from ..models import VulnIntel
from .http import FreeSource

NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
# Same catalog, published by CISA in its GitHub organisation. Used only if the primary URL fails.
KEV_MIRROR_URL = "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json"
EPSS_URL = "https://api.first.org/data/v1/epss"
OSV_URL = "https://api.osv.dev/v1/query"
GHSA_URL = "https://api.github.com/advisories"


class NvdClient(FreeSource):
    name = "nvd"

    def __init__(self, *a, api_key: str | None = None, **kw):
        super().__init__(*a, **kw)
        self.api_key = api_key
        self.min_interval = 0.7 if api_key else 6.5  # public limit: 5 requests / 30 s keyless

    def search(self, keyword: str, signal: str = "", limit: int = 10) -> list[VulnIntel]:
        params = {"keywordSearch": keyword, "resultsPerPage": limit}
        headers = {"apiKey": self.api_key} if self.api_key else {}
        data = self._request("GET", NVD_URL, key=params, params=params, headers=headers)
        return parse_nvd(data, signal)


def parse_nvd(data: dict, signal: str = "") -> list[VulnIntel]:
    out = []
    for item in data.get("vulnerabilities", []):
        cve = item.get("cve", {})
        desc = next((d["value"] for d in cve.get("descriptions", []) if d.get("lang") == "en"), "")
        score = sev = None
        metrics = cve.get("metrics", {})
        for k in ("cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
            if metrics.get(k):
                m = metrics[k][0]
                cd = m.get("cvssData", {})
                score = cd.get("baseScore")
                sev = cd.get("baseSeverity") or m.get("baseSeverity")
                break
        out.append(
            VulnIntel(
                cve_id=cve.get("id", ""),
                source="nvd",
                summary=desc[:400],
                cvss=score,
                severity=sev,
                matched_signal=signal,
                references=[r["url"] for r in cve.get("references", [])[:5] if "url" in r],
            )
        )
    return [v for v in out if v.cve_id]


class KevClient(FreeSource):
    name = "kev"

    timeout = 90.0  # the catalog is about 2 MB

    def catalog(self) -> dict[str, dict]:
        try:
            data = self._request("GET", KEV_URL, key={"all": 1})
        except httpx.HTTPError:
            data = self._request("GET", KEV_MIRROR_URL, key={"all": 1})
        return {v["cveID"]: v for v in data.get("vulnerabilities", []) if "cveID" in v}

    def match_keywords(self, keywords: list[str]) -> list[dict]:
        kws = [k.lower() for k in keywords if k]
        return [
            e for e in self.catalog().values()
            if any(k in f"{e.get('vendorProject', '')} {e.get('product', '')}".lower() for k in kws)
        ]


class EpssClient(FreeSource):
    name = "epss"

    def scores(self, cves: list[str]) -> dict[str, tuple[float, float]]:
        out: dict[str, tuple[float, float]] = {}
        ids = sorted({c for c in cves if c.upper().startswith("CVE-")})
        for i in range(0, len(ids), 50):
            chunk = ids[i : i + 50]
            data = self._request("GET", EPSS_URL, key={"cve": chunk}, params={"cve": ",".join(chunk)})
            for row in data.get("data", []):
                out[row["cve"]] = (float(row["epss"]), float(row["percentile"]))
        return out


class OsvClient(FreeSource):
    name = "osv"
    last_truncated = False  # True when OSV had more pages than the first one we read

    def query(self, ecosystem: str, package: str, signal: str = "") -> list[VulnIntel]:
        body = {"package": {"name": package, "ecosystem": ecosystem}}
        data = self._request("POST", OSV_URL, key=body, json=body)
        self.last_truncated = bool(data.get("next_page_token"))
        out = []
        for v in data.get("vulns", [])[:25]:
            cves = [a for a in v.get("aliases", []) if a.startswith("CVE-")]
            out.append(
                VulnIntel(
                    cve_id=cves[0] if cves else v.get("id", ""),
                    source="osv",
                    summary=(v.get("summary") or "")[:400],
                    matched_signal=signal,
                    references=[r["url"] for r in v.get("references", [])[:5] if "url" in r],
                )
            )
        return [v for v in out if v.cve_id]


class GhsaClient(FreeSource):
    name = "ghsa"

    def __init__(self, *a, token: str | None = None, **kw):
        super().__init__(*a, **kw)
        self.token = token

    def advisories(self, ecosystem: str, package: str, signal: str = "") -> list[VulnIntel]:
        params = {"ecosystem": ecosystem, "affects": package, "per_page": 20}
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        data = self._request("GET", GHSA_URL, key=params, params=params, headers=headers)
        out = []
        for a in data if isinstance(data, list) else []:
            cvss = (a.get("cvss") or {}).get("score")
            out.append(
                VulnIntel(
                    cve_id=a.get("cve_id") or a.get("ghsa_id", ""),
                    source="ghsa",
                    summary=(a.get("summary") or "")[:400],
                    severity=a.get("severity"),
                    cvss=cvss,
                    matched_signal=signal,
                    references=[a["html_url"]] if a.get("html_url") else [],
                )
            )
        return [v for v in out if v.cve_id]
