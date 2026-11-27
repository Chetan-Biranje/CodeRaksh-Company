# Contributing

Thanks for helping. This tool does passive research for authorized programs only, so a few rules
are stricter than usual.

## Ground rules

- Do not add code that sends traffic to a target, fuzzes, scans or exploits anything.
- Do not add endpoints to the allowlist in `policy.py` without a use case, a credit cost taken
  from Tapline's docs, and a test that shows how it stays inside scope.
- Indeed and personal LinkedIn profiles stay excluded.
- No real secrets, tokens, private program details or confidential vulnerability data in code,
  tests, issues or pull requests. Use synthetic data (`example.com`, `CVE-2099-*`).
- Tests must not touch the network. `tests/conftest.py` fails any test that tries.

## Setup

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
pytest
ruff check src tests
bandit -q -r src
```

## Pull requests

1. Keep changes small and explain the why.
2. Add or update tests. Behaviour that enforces scope, budget or approval needs a test for the
   denied case, not only the allowed one.
3. Pin any new GitHub Action to a full commit SHA with the version in a comment.
4. Update `CHANGELOG.md` and the relevant page in `docs/`.

Report security problems privately (see `SECURITY.md`), not in a pull request.
