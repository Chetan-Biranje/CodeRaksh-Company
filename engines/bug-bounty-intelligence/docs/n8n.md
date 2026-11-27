# n8n integration

Import the files in `n8n/workflows/` (UI: Workflows > Import from file; CLI:
`n8n import:workflow --input=n8n/workflows/cve-watch.json`).

Tested on 2026-11-27 with n8n 2.35.7: both workflows import, and with the credential bound they
run against the CodeRaksh container in mock mode. The CLI cannot start a schedule-triggered
workflow, so the test used copies with a manual trigger (and, for `plan-approve-run`, the Wait
node replaced by a NoOp for the post-approval path). The real Wait node was run up to its
waiting state. Resume-URL behaviour and the real schedule were not exercised.

1. Create an **HTTP Header Auth** credential named `CodeRaksh API token`: header `Authorization`,
   value `Bearer <your CODERAKSH_API_TOKEN>`. Never paste the token into a node.
2. Edit the `Config` node: `baseUrl` (the CodeRaksh server) and `programId`.
3. `plan-approve-run`: weekly plan, stops if the cost is above the cap, waits for a human to
   open the resume URL, then runs in **mock** mode. Switching it to live is a deliberate edit
   to the run node and needs the approval fields in the scope file.
4. `cve-watch`: daily KEV and EPSS lookup for a list of CVE ids (free sources).

Replace the `NoOp` delivery nodes with email, Slack or a file node.
