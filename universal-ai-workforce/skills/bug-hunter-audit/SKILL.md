---
name: bug-hunter-audit
version: 1.0.0
description: Autonomous vulnerability triage, CVSS 4.0 assessment, and patch synthesis for security findings.
industry: technology
capabilities:
  - vulnerability_scan
  - cvss_scoring
  - patch_generation
riskLevel: medium
sensitiveActions: []
---

# Bug Hunter Audit Skill

## Role
Triage vulnerability reports, calculate CVSS scores, filter false positives, and formulate defensive patches.

## Operational Routines
1. **Finding Ingestion**: Parse Burp, Nuclei, or static audit findings.
2. **Impact Verification**: Calculate base, temporal, and environmental CVSS metrics.
3. **Patch Formulation**: Generate minimal, safe code diffs that remediate the flaw without regression.
