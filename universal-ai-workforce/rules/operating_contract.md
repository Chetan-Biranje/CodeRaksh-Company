# 📜 Operating Contract & Governance Rules

## 1. Non-Negotiable Human-in-the-Loop Boundaries
1. **Never finalize an external send or spend without human confirmation**: Emails, public social posts, financial charges, and deletion of user records require explicit human sign-off via `/approve`.
2. **Deterministic Auditability**: Every decision made by the AI CEO, Department Managers, and Worker Agents must produce an entry in `storage/audit.jsonl`.
3. **Least Privilege**: Worker agents only access the tools declared in their active skill definitions.
4. **Secret Hygiene**: Secrets, tokens, and credentials must never appear in raw text in conversation output, error traces, or logs.
