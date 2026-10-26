# ⚖️ CodeRaksh Company — Engineering Rules & Operational Standards

> **Applies to:** All Developers, Security Researchers, DevOps Engineers, and AI Agents contributing to CodeRaksh.

---

## 1. The Ponytail Engineering Principles (Zero-Bloat Standards)

1. **The Smallest Complete Change:**
   - Always solve the full problem with the minimum necessary new code.
   - Do NOT introduce unrequested abstractions, unnecessary wrappers, or complex design patterns where a simple function suffices.
   - Deletion of dead code beats addition of boilerplate.

2. **No Redundant Dependencies:**
   - Prefer standard library utilities (`urllib`, `ssl`, `json`, `os`) before adding external third-party dependencies.
   - If a package is strictly necessary (e.g. `fastapi`, `uvicorn`), explicitly document it in `requirements.txt`.

3. **High Readability & Self-Documenting Code:**
   - Code must be easily readable by a busy engineer in one pass.
   - Comment only the *why* that the code cannot express on its own.

---

## 2. DevSecOps & Security Enforcement

1. **Mandatory Secret Gating:**
   - Every contributor must run `python coderaksh.py pr-check` before submitting a commit.
   - Commits containing regex matches for AWS keys, OpenAI/Anthropic tokens, or database URIs will be blocked immediately.

2. **OWASP Top 10 Compliance:**
   - **SQL Injection:** Never concatenate strings into raw queries. Use prepared statements or ORM parameterization.
   - **XSS & Template Injection:** Sanitize, escape, and encode all user-supplied inputs before rendering.
   - **Broken Access Control (IDOR):** Verify tenant and user ownership on every database fetch.
   - **CORS & Headers:** Enforce strict CSP, HSTS, and X-Frame-Options headers on all web endpoints.

---

## 3. Git Commit Conventions (Conventional Commits)

All commit messages must adhere to the standard format: `<type>(<scope>): <short description>`

| Type | When to Use | Example |
|---|---|---|
| `feat` | New workflow, agent, CLI command, or portal feature | `feat: add 23_cyber_autonomous_bug_hunter workflow` |
| `fix` | Bug fix, error handling improvement, or vulnerability patch | `fix: handle Windows UTF-8 stdout encoding in CLI` |
| `docs` | Documentation, PRD, architecture, or legal updates | `docs: update TRACKER.md with v3.0 release milestones` |
| `refactor` | Code restructuring without behavioral changes | `refactor: simplify webhook simulator response routing` |
| `sec` | Explicit security hardening or secret revocation | `sec: enforce parameterized queries in database adapter` |

---

## 4. Communication & Tone Standards ("Full Human Touch")

- When responding to clients or the founder, communicate with genuine care, warmth, and high professionalism.
- Support **Marathi, Hinglish, and English** seamlessly.
- Celebrate milestones, maintain clarity on risks, and always provide clear, actionable next steps.
