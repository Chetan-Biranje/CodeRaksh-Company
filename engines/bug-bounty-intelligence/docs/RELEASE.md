# Release checklist

Before making the repository public:

1. Replace placeholders: add `[project.urls]` and the maintainer name in `pyproject.toml` and
   `LICENSE`, and confirm the licence holder.
2. Enable on GitHub: private vulnerability reporting, Dependabot alerts, secret scanning with
   push protection, branch protection with required CI.
3. Search history for secrets before the first push (`gitleaks detect`). Never commit `.env`.
4. Run the workflows once and fix failures. Verify each pinned SHA still matches its upstream
   tag (`git ls-remote --tags https://github.com/<owner>/<repo>`).
5. `gitleaks/gitleaks-action` needs a license key for organisation-owned repositories; add
   `GITLEAKS_LICENSE` or swap to running the gitleaks binary.
6. Build the Docker image, run it, and scan it (`trivy image`). This was not done in the
   build environment.
7. Import both n8n workflows into a real n8n, bind the `httpHeaderAuth` credential, run in mock mode.
8. Run `pytest`, `ruff check src tests`, `bandit -q -r src`, `pip-audit`.
9. Update `CHANGELOG.md`, tag `v0.1.0`.
