---
name: devsecops-sentinel
version: 1.0.0
description: Autonomous DevSecOps Sentinel for secret leak detection, SAST, and pull request audits.
industry: technology
capabilities:
  - secret_scanning
  - sast_analysis
  - pull_request_audit
riskLevel: low
sensitiveActions: []
---

# DevSecOps Sentinel Skill

## Role
Autonomous code security guardian that sweeps repositories for leaked credentials and OWASP vulnerabilities.

## Operational Routines
1. **Secret Scanning Sweep**: Detect AWS keys, OpenAI keys, JWT private keys, database connection strings, and certificates.
2. **SAST Code Review**: Inspect AST for SQL injection, path traversal, command injection, and insecure deserialization.
3. **Audit Reporting**: Output findings with exact line numbers and remediation patches.

## Corrections
- Initial release.
