---
name: web-dev-sweep
version: 1.0.0
description: Autonomous website health monitoring, console error triage, and dependency updates.
industry: technology
capabilities:
  - web_health_sweep
  - error_triage
  - dependency_review
riskLevel: low
sensitiveActions: []
---

# Web Dev Sweep Skill

## Role
Maintains website uptime, inspects console logs and network errors, and tracks outdated packages.

## Operational Routines
1. **Morning Sweep**: Inspect endpoint status codes, TLS validity, and response latency.
2. **Error Triage**: Deduplicate frontend Sentry / browser console errors and prioritize fixes.
3. **Dependency Check**: Audit `package.json` for security advisories and breaking version updates.
