# Architecture

```
scope.yaml ──► ScopePolicy ──► CallPolicy ─┐
                                           ▼
 plan_calls ─► Engine ─► TaplineClient ─► Cache ─► BudgetGuard ─► Transport (mock | REST | MCP)
                 │                                   │
                 │                                 Ledger (SQLite)
                 ▼
 extract_docs ─► dedupe ─► EvidenceStore ─► stack / oauth_jwt / api_authz ─► intel
                                                                              │
                                              NVD · KEV · EPSS · OSV · GHSA ◄─┘
                 ▼
          RunReport ─► report.md + report.json
```

## Order of checks for every Tapline call

1. **Policy**: endpoint allowlist, Indeed and personal profiles denied, arguments tied to the program.
2. **Cache**: a hit costs nothing and is logged as a cache hit.
3. **Budget**: hard cap (max 500) and a circuit breaker at 80% that drops optional calls.
4. **Transport**: mock, REST or MCP.
5. **Ledger and cache write**.

Cache files are separate per mode, so mock data can never be served in a live run.

## Evidence and verification

Each claim stores the source URL, tier, fetch time and a hash of the text. Tiers: 1 official
or organisation-owned, 2 advisory or government, 3 third party. A claim is `confirmed` with one
tier-1 source or two independent hosts, otherwise `inferred`. Documents are de-duplicated by
canonical URL (tracking parameters and fragments removed).

## Credit monitoring

Balance is read before and after a run (free endpoint). In live mode a mismatch between the
balance change and the ledger total is reported as a warning. If a transport cannot report the
charged credits, catalog costs stand in and the report says so.

## Hypotheses

`oauth_jwt.py` and `api_authz.py` turn public text or a local OpenAPI file into ranked manual
test suggestions. In-scope hosts rank first. Hosts that are out of scope or not listed carry a
"do not test" note.
