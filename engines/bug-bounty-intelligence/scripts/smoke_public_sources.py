"""Live check of the free public sources. Makes a few GET/POST requests to public APIs only.

No Tapline call, no target contact, no credits. Exits non-zero if a source fails to parse.
Run from CI (`live-sources-smoke`) or by hand: `python scripts/smoke_public_sources.py`.
"""

from __future__ import annotations

import os
import sys

from coderaksh.sources.http import make_client
from coderaksh.sources.vulndb import (
    EpssClient,
    GhsaClient,
    KevClient,
    NvdClient,
    OsvClient,
)

HOSTS = ["services.nvd.nist.gov", "www.cisa.gov", "api.first.org", "api.osv.dev", "api.github.com",
         "raw.githubusercontent.com"]


def main() -> int:
    client = make_client(HOSTS)
    results: dict[str, str] = {}

    def check(name, fn):
        try:
            results[name] = fn()
        except Exception as exc:  # noqa: BLE001 - report every failure, then exit non-zero
            results[name] = f"FAIL {type(exc).__name__}: {str(exc)[:120]}"

    check("kev", lambda: f"ok {len(KevClient(client).catalog())} entries")
    check("epss", lambda: f"ok {EpssClient(client).scores(['CVE-2021-44228'])}")
    check("osv", lambda: f"ok {len(OsvClient(client).query('npm', 'jsonwebtoken'))} vulns")
    ghsa = GhsaClient(client, token=os.environ.get("GITHUB_TOKEN"))
    check("ghsa", lambda: f"ok {len(ghsa.advisories('npm', 'jsonwebtoken'))} advisories")
    check("nvd", lambda: f"ok {len(NvdClient(client).search('keycloak', limit=1))} vulns")
    bad = {k: v for k, v in results.items() if not v.startswith("ok")}
    for k, v in results.items():
        print(f"{k:5} {v}")
    empty = [k for k, v in results.items() if v.startswith("ok 0 ")]
    if empty:
        print("empty results (unexpected):", empty)
    return 1 if bad or empty else 0


if __name__ == "__main__":
    sys.exit(main())
