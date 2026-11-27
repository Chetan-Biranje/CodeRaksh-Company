# Security policy

## What this project is for

CodeRaksh collects **public** information about organisations that run bug bounty or
vulnerability disclosure programs, and turns it into research leads. It is built for
**authorized programs only**.

## Hard rules enforced in code

| Rule | Where it is enforced |
|---|---|
| The engine never sends traffic to a target. Outbound HTTP is limited to an allowlist of Tapline and public vulnerability data hosts. | `sources/http.py` (egress guard) |
| Live mode needs `authorization.confirmed`, `pilot.approved`, named approvers in the scope file, and a typed approval token equal to the program id. | `scope.py` |
| Indeed endpoints and personal LinkedIn profiles are blocked. Every other Tapline endpoint not on the allowlist is denied. | `policy.py` |
| Search queries must use `site:` on an in-scope or reference domain, or name the organisation. Out-of-scope hosts always lose. | `policy.py`, `scope.py` |
| Pilot budget is capped at 500 credits, lifetime per program in live mode as well as per run. Settings can lower it, never raise it. Circuit breaker at 80% for optional calls. | `config.py`, `ledger.py`, `pipeline.py` |
| Only one live run at a time; a second one fails instead of racing the budget check. | `runlock.py` |
| The Tapline key is sent only to `api.tapline.sh`. | `sources/tapline.py`, `sources/http.py` |
| Credential-like strings in public text are redacted before they reach evidence or reports. | `redact.py` |
| Secrets come only from environment variables and are excluded from `repr()`. | `config.py` |

Hypotheses in reports are manual-test suggestions. They say to use accounts you own and to
stay inside the program's rules. The tool does not test, exploit or fuzz anything.

## Reporting a vulnerability in CodeRaksh

Use GitHub's **Report a vulnerability** button on the repository's Security tab (private
vulnerability reporting). Please do not open public issues for vulnerabilities. Do not include credentials, tokens or private target data in a report.

Expect an acknowledgement within 7 days. This is a volunteer project and has no bounty.

## Your responsibilities

- Read the program policy yourself. The scope file is your record, not a legal guarantee.
- Keep `.env`, API keys and scope files for private programs out of public repositories.
- Do not submit confidential vulnerability details to any third-party service through this tool.
- Actions and the Docker base image are pinned by digest. Keep them current with Dependabot and re-verify each new SHA against the upstream tag before merging.
