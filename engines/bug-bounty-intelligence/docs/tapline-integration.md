# Tapline integration

## Verified (Tapline official docs, 2026-11-27)

Sources: `https://tapline.sh/SKILL.md` and `https://tapline.sh/openapi.airbnb.json`
(`securitySchemes.APIKeyHeader`, per-operation `x-tapline-credit-cost`).

- REST base URL: `https://api.tapline.sh`. Auth: header `X-API-Key` with the bare key, no prefix.
- Errors carry a code, message and request id. 401 bad key, 402 no credits, 403, 404 (free),
  422, 429 (with `Retry-After`), 502/503.
- Rate limit: 1 request per second on the free tier, 5 per second with a credit pack.
- Responses do not report credits charged. The catalog costs here are estimates; the run is
  reconciled against `/v1/account/credits` (free, no rate limit).
- MCP server: `https://api.tapline.sh/mcp` (Streamable HTTP). Its `call_endpoint` tool returns
  `status_code`, `credits_charged` and `body`.

## Behaviour in this project

- The API key is sent only to `api.tapline.sh` unless `TAPLINE_ALLOW_CUSTOM_HOST=1`.
- Requests are paced at `TAPLINE_MIN_INTERVAL` (default 1 s). 401 and 402 stop the run.
- **Retries are built so they cannot double-bill.** 429 (refused for rate limiting) is retried up
  to twice honouring `Retry-After` (capped at 30 s), at most 6 retries per run in total. A 5xx
  or network error on a **paid** endpoint is never retried, because Tapline may have processed
  and billed it; the ledger books the catalog cost as a possible charge so the cap stays
  conservative. Free endpoints (`/v1/account/credits`) are retried once.
- Tapline does not document whether a 429 is billed. The assumption is that it is not; the
  balance check before and after a run would show otherwise.

## Not verified

- How to send an API key to the MCP URL. Not documented; `McpTransport` takes an authenticated
  `call_tool` callable that you supply. Ask Tapline support if you need MCP outside a client
  that handles sign-in for you.
- Whether 5xx responses are billed (assumed possible, so booked as a charge).
- Response bodies. `analysis/extract.py` walks any JSON for URL and text keys. Capture one
  real response per endpoint during the approved pilot, redact it, and tighten the parser.

## Endpoints used (allowlist)

| Endpoint | Credits | Use |
|---|---|---|
| `/v1/brave-search/search` | 5 | `site:` searches of in-scope and documentation hosts |
| `/v1/brave-search/news` | 5 | news about the organisation |
| `/v1/linkedin/company` | 1 | company page, numeric id |
| `/v1/linkedin/company/posts` | 1 | company announcements |
| `/v1/linkedin/jobs/search` | 1 | open roles (stack signals) |
| `/v1/linkedin/job` | 1 | one role found by that search |
| `/v1/twitter/profile`, `/user-tweets` | 1 | official accounts |
| `/v1/twitter/tweet` | 1 | one official post |
| `/v1/youtube/search` | 3 | talks and demos |
| `/v1/youtube/videos/{id}/metadata` | 3 | found videos only |
| `/v1/youtube/videos/{id}/subtitles` | 2 | found videos only |
| `/v1/account/credits` | 0 | balance |

Excluded on purpose: all Indeed endpoints, `/v1/linkedin/profile` (people), and everything
else not listed.

## Default plan cost

The example program plans about 55 credits (see `coderaksh plan`). The cap is 500.
