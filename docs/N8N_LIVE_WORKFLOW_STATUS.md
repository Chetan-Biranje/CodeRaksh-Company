# n8n live workflow status: CODERAKSH ENTERPRISE

Last updated: 2026-11-28
n8n cloud workflow ID: `gP6GImSN8VerxgiK` (73 nodes)

## What was wrong

Execution 13 (manual run, 2026-11-27 23:00 IST) failed at `Morning - Claude Flight Plan` with a `credential_inaccessible` error.

Two causes:

1. 31 nodes pointed at credentials that no longer exist in the account:
   - 9 Anthropic model nodes used `Anthropic account 2`
   - 22 Google Sheets nodes used `Google Sheets account 2`
2. All 8 WhatsApp send nodes had no credential attached.

## What was changed

- Anthropic model nodes now use `Anthropic account`.
- Google Sheets nodes now use `Google Sheets account`.
- WhatsApp send nodes now use `WhatsApp account`.
- Workflow published on 2026-11-28, so the schedule triggers and production webhooks are active.

No node logic, prompts or connections were changed.

## Still open

- `Save to Proposals Sheet` (Freelance Lead chain) is disabled. The proposal is sent to WhatsApp but not logged to the sheet.
- `Post GitHub Review Comment` still has the placeholder `Bearer YOUR_...` header. Put a real GitHub token in an n8n credential before relying on PR review comments.
- The Gmail nodes use `Gmail account`; the owner email in the Gmail nodes is still the placeholder `YOUR_OWNER_EMAIL@example.com` in some nodes.
- After publishing, nothing has been test-fired in production mode. Send one test request to each webhook below.

## Production webhooks (POST)

| Chain | Path |
|---|---|
| Watchdog | `/webhook/emergency-escalation` |
| GitHub PR review | `/webhook/github-pr-webhook` |
| Vulnerability ingest | `/webhook/vulnerability-ingest` |
| CI failure | `/webhook/ci-build-failure` |
| Freelance lead | `/webhook/freelance-lead` |
| CEO command | `/webhook/ceo-command` |

Schedules: Morning 9 AM kickoff, Daily pre-market trigger, Nightly 9 PM audit.
