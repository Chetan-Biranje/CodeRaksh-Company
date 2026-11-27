"""Synthetic responses for a fictional organisation (Example Corp, example.com).

CVE ids use the 2099 year on purpose so they can never be mistaken for real vulnerabilities.
Response shapes for Tapline are guesses: no live Tapline response has been captured yet.
"""

from __future__ import annotations

import json
import re

import httpx

DOCS_OAUTH = (
    "Example Corp supports OAuth 2.0 with the authorization code flow. Register your redirect_uri "
    "in the dashboard. Access tokens are JWT signed with RS256 and also HS256 for legacy clients; "
    "keys are published at /.well-known/jwks.json. Refresh tokens rotate on every use. The "
    "implicit grant is deprecated but still available. OAuth scopes: orders.read, orders.write."
)
DOCS_API = (
    "API reference. GET /v2/orders/{orderId} returns an order. "
    "GET /v2/users/{userId}/invoices/{invoiceId} returns an invoice. "
    "POST /v2/admin/export starts a bulk export. DELETE /v2/projects removes projects. "
    "Example: GET /v1/accounts/48213/profile. Built on Django behind Kong Gateway with "
    "PostgreSQL. A GraphQL endpoint is available at /graphql."
)
CHANGELOG = (
    "Changelog. We migrated single sign-on to Keycloak and upgraded jsonwebtoken. "
    "Rate limits are now enforced per API key."
)

JOB_DESC = (
    "Senior Backend Engineer, API Platform. You will build REST APIs with Django and Kong, "
    "run PostgreSQL on AWS and Kubernetes, and own OAuth2 and JWT based authentication."
)


def _brave(query: str) -> dict:
    q = query.lower()
    results = []
    if "oauth" in q:
        results.append({"title": "OAuth guide", "url": "https://developers.example.com/docs/oauth",
                        "description": DOCS_OAUTH})
    if "api reference" in q:
        results.append({"title": "API reference", "url": "https://developers.example.com/docs/api",
                        "description": DOCS_API})
    if "jwt" in q:
        results.append({"title": "Tokens", "url": "https://developers.example.com/docs/oauth/",
                        "description": DOCS_OAUTH})
    if "changelog" in q:
        results.append({"title": "Changelog", "url": "https://developers.example.com/changelog",
                        "description": CHANGELOG})
    if "site:" not in q:
        results.append({"title": "Example Corp security update",
                        "url": "https://news.example.net/example-corp-security",
                        "description": "Example Corp says it moved identity to Okta and runs on AWS."})
    if "blog" in q:
        results.append({"title": "Engineering blog", "url": "https://blog.example.com/stack",
                        "description": "We use Redis and Cloudflare."})
    return {"web": {"results": results}}


def mock_tapline(path: str, query: dict) -> dict | None:
    q = query or {}
    if path == "/v1/account/credits":
        return {"total_credits_remaining": 100000, "plan_credits_remaining": 100000}
    if path in ("/v1/brave-search/search", "/v1/brave-search/news"):
        return _brave(str(q.get("query", "")))
    if path == "/v1/linkedin/company":
        return {"id": 123456, "name": "Example Corp", "url": "https://www.linkedin.com/company/example/",
                "description": "Payments platform for developers.", "headcount": 450}
    if path == "/v1/linkedin/company/posts":
        return {"posts": [{
            "url": "https://www.linkedin.com/posts/example_launching-api-v3-activity-1",
            "text": "We are launching public API v3 with OAuth 2.0 and PKCE support."}]}
    if path == "/v1/linkedin/jobs/search":
        return {"jobs": [
            {"title": "Senior Backend Engineer, API Platform",
             "url": "https://www.linkedin.com/jobs/view/1001/"},
            {"title": "Security Engineer", "url": "https://www.linkedin.com/jobs/view/1002/"},
            {"title": "Office Manager", "url": "https://www.linkedin.com/jobs/view/1003/"}]}
    if path == "/v1/linkedin/job":
        return {"title": "Senior Backend Engineer, API Platform", "url": q.get("url"),
                "description": JOB_DESC}
    if path == "/v1/twitter/profile":
        return {"handle": q.get("handle"), "bio": "Official Example Corp account.",
                "url": f"https://x.com/{q.get('handle')}"}
    if path == "/v1/twitter/user-tweets":
        h = q.get("handle")
        return {"tweets": [{"url": f"https://x.com/{h}/status/1",
                            "text": "We are rotating signing keys. Refresh your JWKS cache."}]}
    if path == "/v1/youtube/search":
        return {"results": [{"video_id": "abc123XYZ_0", "title": "Example Corp API security talk",
                             "url": "https://www.youtube.com/watch?v=abc123XYZ_0",
                             "description": "How we run GraphQL and REST APIs on Kubernetes."}]}
    if path.startswith("/v1/youtube/videos/") and path.endswith("/metadata"):
        return {"title": "Example Corp API security talk", "description": "Talk about OAuth2."}
    return None


NVD = {"vulnerabilities": [{"cve": {
    "id": "CVE-2099-0001", "descriptions": [{"lang": "en", "value": "Synthetic Keycloak issue."}],
    "metrics": {"cvssMetricV31": [{"cvssData": {"baseScore": 8.1, "baseSeverity": "HIGH"}}]},
    "references": [{"url": "https://nvd.nist.gov/vuln/detail/CVE-2099-0001"}]}}]}
KEV = {"vulnerabilities": [
    {"cveID": "CVE-2099-0001", "vendorProject": "Keycloak", "product": "Keycloak",
     "vulnerabilityName": "Synthetic KEV entry", "dueDate": "2099-01-01",
     "shortDescription": "Synthetic entry for tests."},
    {"cveID": "CVE-2099-0003", "vendorProject": "Kong", "product": "Kong Gateway",
     "vulnerabilityName": "Synthetic Kong entry", "dueDate": "2099-02-01",
     "shortDescription": "Synthetic entry for tests."}]}
EPSS = {"data": [{"cve": "CVE-2099-0001", "epss": "0.42", "percentile": "0.97"},
                 {"cve": "CVE-2099-0002", "epss": "0.01", "percentile": "0.40"}]}
OSV = {"vulns": [{"id": "GHSA-synt-hetic-0002", "aliases": ["CVE-2099-0002"],
                  "summary": "Synthetic Django issue.", "references": [{"url": "https://osv.dev/x"}]}]}
GHSA = [{"ghsa_id": "GHSA-synt-hetic-0004", "cve_id": None, "summary": "Synthetic advisory.",
         "severity": "medium", "html_url": "https://github.com/advisories/GHSA-synt-hetic-0004"}]


def mock_http_handler(request: httpx.Request) -> httpx.Response:
    host, path = request.url.host, request.url.path
    if host == "services.nvd.nist.gov":
        kw = request.url.params.get("keywordSearch", "")
        return httpx.Response(200, json=NVD if kw == "Keycloak" else {"vulnerabilities": []})
    if host == "www.cisa.gov":
        return httpx.Response(200, json=KEV)
    if host == "api.first.org":
        return httpx.Response(200, json=EPSS)
    if host == "api.osv.dev":
        body = json.loads(request.content or b"{}")
        name = body.get("package", {}).get("name", "")
        return httpx.Response(200, json=OSV if name == "django" else {})
    if host == "api.github.com" and re.match(r"^/advisories", path):
        aff = request.url.params.get("affects", "")
        return httpx.Response(200, json=GHSA if aff == "jsonwebtoken" else [])
    return httpx.Response(404, json={"error": "no mock for " + host})
