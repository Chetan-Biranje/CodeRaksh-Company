# CodeRaksh Bug Bounty Intelligence Engine

Passive, scope-enforced research for **authorized** bug bounty programs. It gathers public
information through [Tapline](https://tapline.sh) and free vulnerability sources, identifies
the technology stack, and writes a Markdown and JSON brief with ranked hypotheses for
OAuth, JWT, BOLA, IDOR, BFLA and mass-assignment testing.

It does not test, scan or contact any target.

## Status

| Piece | State |
|---|---|
| Mock mode (synthetic data, no network) | Built and tested |
| Tapline MCP URL `https://api.tapline.sh/mcp` | Verified from the public docs |
| Tapline REST base URL `https://api.tapline.sh` and header `X-API-Key` | Verified from Tapline's official `SKILL.md` and OpenAPI document (2026-11-27). Built in as defaults. |
| Tapline MCP API-key header | Not documented. Ask Tapline support; REST is the supported path here. |
| Tapline response shapes | **Not captured.** The extractor is tolerant and tested on synthetic data only. |
| NVD, CISA KEV, EPSS, OSV | Parsers checked against real responses on 2026-11-27; trimmed captures are in `tests/fixtures/live/` |
| GitHub Advisories | Verified live from GitHub Actions on 2026-11-27 (`live-sources-smoke` returned 5 advisories for npm `jsonwebtoken`). The build sandbox blocks the host, so the fixture `ghsa_reconstructed.json` is not a raw capture. |
| n8n workflows | Imported into n8n 2.35.7 with `n8n import:workflow`; both executed against the container in mock mode (see `docs/n8n.md`) |
| Docker image | Built from the digest-pinned base and run hardened (non-root, read-only filesystem, no capabilities); health, auth, mock run and live-mode refusal checked |
| GitHub Actions | Pinned to commit SHAs. See `docs/SECURITY-AUDIT.md` for the latest run results |

No paid Tapline call has ever been made by this project.

## Install and quick start (mock mode)

This engine lives in `engines/bug-bounty-intelligence/` of
[CodeRaksh-Company](https://github.com/Chetan-Biranje/CodeRaksh-Company). It is independent of
the other projects in that repository and has its own `pyproject.toml`, tests and Docker image.
Requires Python 3.11+.

```bash
git clone https://github.com/Chetan-Biranje/CodeRaksh-Company.git
cd CodeRaksh-Company/engines/bug-bounty-intelligence
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
coderaksh scope validate programs/example-pilot.yaml
coderaksh plan programs/example-pilot.yaml      # shows calls and credit cost, makes none
coderaksh run programs/example-pilot.yaml       # mock mode: synthetic data, no network
```

Reports land in `data/reports/<program>/<run>.md` and `.json`.

## Going live (only after you approve a pilot)

1. Copy `programs/example-pilot.yaml`, fill it from the program's **public** policy page.
2. Set `authorization.confirmed`, `confirmed_by`, `pilot.approved`, `approved_by` yourself.
3. Set `TAPLINE_API_KEY` in your environment. The base URL and header default to the verified
   values; the key is only ever sent to `api.tapline.sh`.
4. `coderaksh plan your.yaml`, then
   `coderaksh run your.yaml --mode live --approve-pilot <program-id>`.

The 500-credit pilot cap is lifetime per program in live mode, across all runs (80% for optional calls). Only one live run can hold the lock at a time. See `docs/scope-policy.md`.

## Interfaces

- CLI: `coderaksh --help`
- Python SDK: `from coderaksh import Engine, load_scope, Settings` (`docs/sdk.md`)
- FastAPI: `coderaksh serve` (needs `CODERAKSH_API_TOKEN`, at least 24 characters). Interactive docs are off unless `CODERAKSH_ENABLE_DOCS=1`.
- n8n: `n8n/workflows/*.json` (`docs/n8n.md`)
- Docker: `docker compose up` (mock mode by default, bound to localhost)

## Documentation

`docs/architecture.md`, `docs/tapline-integration.md`, `docs/scope-policy.md`,
`docs/sdk.md`, `docs/n8n.md`, `docs/SECURITY-AUDIT.md`, `docs/third-party-data.md`, `docs/RELEASE.md`, `SECURITY.md`.

## Development

```bash
pytest                      # unit and integration tests; real network access fails the test
ruff check .
bandit -r src -c pyproject.toml -ll
```

MIT licensed.
