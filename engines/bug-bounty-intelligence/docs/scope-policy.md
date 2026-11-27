# Scope file and approval gate

A scope file is YAML with these sections: `program`, `authorization`, `pilot`, `scope`, `org`,
`research`. See `programs/example-pilot.yaml`.

- `scope.in_scope` and `out_of_scope` take hostnames or `*.domain` wildcards. IPs, URLs and
  `localhost` are rejected. A wildcard does not match the apex domain. Out of scope always wins.
- `scope.reference_domains` are public documentation hosts allowed in `site:` searches.
- `org.keywords`, `linkedin_company_url`, `twitter_handles` tie every collection call to the
  organisation. A call about anything else is denied.
- `research.openapi_files` are public specs you downloaded yourself (JSON, inside the scope
  folder). They are never fetched by the engine.

## Live mode needs all of these

1. `authorization.confirmed: true` and `confirmed_by` set.
2. `pilot.approved: true` and `approved_by` set.
3. `--approve-pilot <program-id>` on the CLI (or `approval` in the API request).
4. Tapline REST settings present (or an injected transport).

The engine never edits these fields. The scope file's SHA-256 is printed in every report.
