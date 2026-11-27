# Changelog

## 0.1.0 (2026-11-27)

First release. Lives in `engines/bug-bounty-intelligence/` of CodeRaksh-Company.

- Scope-enforced pipeline with mock and live modes, lifetime 500-credit pilot cap per program,
  80% circuit breaker, balance preflight, single live run lock.
- Tapline REST client with the verified base URL and `X-API-Key` header, request pacing,
  retries for 429/502/503, key restricted to `api.tapline.sh`.
- Endpoint allowlist; Indeed and personal LinkedIn profiles excluded.
- NVD, CISA KEV (with CISA mirror fallback), EPSS, OSV and GitHub Advisories clients with retries
  and rate-limit handling. Parsers checked against real responses except GitHub Advisories.
- Redaction of credential-like strings found in public text.
- CLI, Python SDK, FastAPI backend (docs off by default, security headers), n8n workflows, Docker.
- GitHub Actions and the Docker base image pinned by SHA/digest.
- Credit-safe retries: 429 retried at most twice (6 per run); 5xx and network errors are never
  retried on paid endpoints and are booked at the catalog cost as a possible charge.
- n8n workflows now carry ids so `n8n import:workflow` works; `cve-watch` builds its CVE list in
  the request body. Both verified in n8n 2.35.7.
- Docker image built and run with the hardened settings; compose limits memory and pids.
- CI: `bounty-engine-ci.yml` and `bounty-engine-security.yml` (SHA-pinned), including a free
  public-sources smoke job that exercises GitHub Advisories.
