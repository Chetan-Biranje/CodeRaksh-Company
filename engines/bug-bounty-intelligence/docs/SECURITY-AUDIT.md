# Security audit: production-readiness review (v0.1.0)

> Updated 2026-11-27 (second pass): Docker and n8n runtime tests added, retry/credit review,
> repository integration. See "Second pass" at the end.

Date: 2026-11-27. Scope: this repository, reviewed by its author's assistant. This is a
self-review, not an independent audit. No Tapline credits were spent and no target was contacted.

## Result in one paragraph

No open critical or high findings in the code that was tested. Eleven issues found during the
review are fixed. The live pilot is **not approved**: no authorized program has been supplied.
Several things could not be verified in the build environment (listed under "Not verified") and
must be checked before the first live run.

## Method

- Read every module that enforces scope, budget, approval, egress, secrets or errors.
- Tried bypasses against the policy layer (quoted, negated and wildcard `site:` queries,
  encoded or dotted paths, relative paths, forged company ids).
- Verified the Tapline REST base URL and auth header from Tapline's official `SKILL.md` and
  OpenAPI document.
- Fetched real responses from NVD, CISA KEV, EPSS and OSV and checked the parsers against them.
- Resolved every GitHub Action tag and the Docker base tag to commit SHAs and a digest.
- Ran: pytest (99 tests, 94% line coverage), ruff, bandit (0 issues), pip-audit on the runtime
  dependency tree (clean after the fix below), `docker compose config`.

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | High | The 500-credit pilot cap applied per run, so repeated runs could exceed it. | Fixed: lifetime cap per program in live mode, checked before each call. |
| 2 | High | Two concurrent live runs could race the budget check. | Fixed: `fcntl` run lock plus thread lock; the second run fails with 409. |
| 3 | High | Policy bypass: quoted or negated `site:` operators, and wildcard queries that also cover out-of-scope hosts. | Fixed: strict operator parsing and overlap check; tests added. |
| 4 | High | The API key could be sent to any host set in `TAPLINE_BASE_URL`. | Fixed: https only and `api.tapline.sh` only unless `TAPLINE_ALLOW_CUSTOM_HOST=1`. |
| 5 | Medium | `linkedin/jobs/search` `company_ids` were not tied to the organisation. | Fixed: ids must come from the org page fetch. |
| 6 | Medium | A path without a leading slash was normalised for the check but joined raw to the base URL. | Fixed: such paths are denied. |
| 7 | Medium | Credential-like strings in public pages could be copied into reports. | Fixed: redaction on ingest and in evidence snippets. |
| 8 | Medium | No retry, pacing or rate-limit handling; no balance preflight. | Fixed: 1 req/s pacing, bounded retries, preflight against balance. |
| 9 | Medium | API errors could leak upstream detail; docs exposed; short API tokens accepted. | Fixed: mapped errors, docs off by default, token at least 24 characters, security headers. |
| 10 | Low | Unpinned Actions, `trivy-action@master`, unpinned Docker base. | Fixed: all pinned to SHA/digest. A test fails if a floating ref returns. |
| 11 | Low | `opentelemetry-api` 1.45.0 (via fastapi) had two advisories. | Fixed: floor `>=1.45.2`. |
| 12 | Low | An `assert` used as control flow (bandit B101); string-built SQL (B608). | Fixed. |

## Controls reviewed

- **Scope enforcement.** Out-of-scope wins over in-scope; wildcards do not match the apex;
  hostnames only (no IPs, URLs, localhost); every Tapline call passes the allowlist and argument
  checks before the cache, budget or network. The tool never contacts the target.
- **Approval gate.** Live mode needs confirmed authorization, approved pilot, named approvers
  and a typed token equal to the program id. The example file is unapproved.
- **Secrets.** Environment variables only, excluded from `repr()`, never echoed in errors;
  hygiene test scans for hard-coded secrets; `.env` is git-ignored.
- **Egress.** One http client factory; https only; static host allowlist; no redirects.
- **Credit accounting.** Ledger per run and per program; 80% circuit breaker for optional calls;
  cache hits cost 0; errors recorded at 0. Tapline responses do not report credits charged, so
  the ledger uses catalog costs and the run is reconciled against `/v1/account/credits`.
- **Rate limits and retries.** Tapline: 1 request/second default, 429 retried twice with
  `Retry-After` (capped 30 s), 502/503 once, 401/402 stop the run. Free sources: 2 retries and a
  clear `SourceRateLimited` error.
- **n8n.** Tests check unique names, valid connections, reachability from a trigger, known node
  types and credentials by reference only. `cve-watch` was fixed so the CVE list is built in the
  request body.
- **Docker.** Non-root user, read-only filesystem, all capabilities dropped, no-new-privileges,
  localhost-only port, memory and pids limits, digest-pinned base, healthcheck.

## Public data sources (tested 2026-11-27)

| Source | Result |
|---|---|
| NVD 2.0 | Live response parsed. Keyless limit is about 5 requests per 30 s; the client waits 6.5 s between requests. |
| CISA KEV | Official URL works from the sandbox; the cisagov GitHub mirror is the fallback. |
| EPSS | Live response parsed. |
| OSV | Live response parsed. Only the first result page is read; the report warns when truncated. |
| GitHub Advisories | **Not run live.** The sandbox blocked `api.github.com`. The parser was written from the public docs and a fixture rebuilt from fields seen through a web fetch (`ghsa_reconstructed.json`, not a raw capture). |

## Residual risks

- A retried Tapline request may be billed twice. Mitigated by balance reconciliation, not prevented.
- Tapline response bodies are uncaptured; the extractor is tolerant but untested on real data.
- Trivy and gitleaks actions are third-party code. Pinning fixes the version, not its trustworthiness; review before upgrading.
- Passive research can still surface text that is sensitive. Redaction is pattern-based and will miss some secrets.
- Scope files are only as accurate as the person who writes them.

## Not verified

- Tapline MCP API-key header (undocumented). Ask Tapline support.
- Docker image build and run; n8n import; GitHub Actions runs on GitHub; GitHub Advisories live.
- Contact with "Robert" for technical assistance: no way to reach him from this environment, and the REST details no longer depend on him. Suggested message: "Which header does `https://api.tapline.sh/mcp` expect for API-key auth outside an interactive sign-in?"

## Before the pilot

1. Provide an authorized program and its public policy URL.
2. Fill and approve the scope file yourself; review `coderaksh plan` output (about 55 credits).
3. Approve the pilot explicitly. Maximum 500 credits, lifetime for that program.

## Second pass (2026-11-27)

- **Docker.** Built from the digest-pinned base and run with `--read-only`, `--cap-drop ALL`,
  `no-new-privileges`, pids and memory limits. Confirmed: uid 10001, `/health` 200, no token 401,
  `/docs` 404, mock run works, live mode refused (403, missing approvals), no Tapline key in the
  container environment, health check healthy. The sandbox has no bridge networking, so
  `docker compose up` was not run; `docker compose config` validates.
- **n8n.** Real import found a defect (workflows had no `id`, so import failed): fixed. After the
  fix both import into n8n 2.35.7 and execute in mock mode (details in `docs/n8n.md`).
- **Retry and credit review.** Found that a retried 5xx or timeout on a paid call could be billed
  twice while the ledger counted once, and that a timeout left no ledger entry. Fixed: no
  automatic retry of 5xx or network errors on paid endpoints, bounded 429 retries, ambiguous
  failures booked at the catalog cost, network errors wrapped so they are always recorded.
- **Editable-install check.** An earlier test run in this review imported a stale copy of the
  package from a different directory; tests were re-run after reinstalling from the repository.
- **GitHub Advisories.** Live field names confirmed through a web fetch (array of objects with
  `ghsa_id`, `cve_id`, `summary`, `severity`, `html_url`, `cvss.score`). The client could not be
  run from the sandbox (policy blocks `api.github.com`; not worked around). It is exercised by
  the `live-sources-smoke` CI job.
