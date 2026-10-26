# 🛡️ CodeRaksh Enterprise Engineering & Security Standards

Welcome to **CodeRaksh Company**. All AI agents, contributors, and automation pipelines must follow these principles:

## 1. Security-First Architecture (DevSecOps)
- **Zero Hardcoded Secrets**: No API keys, JWT secrets, database connection URIs, or tokens committed to source code. Use environment variables or secret managers.
- **OWASP Top 10 Mitigation**:
  - Always parameterize SQL queries (ORM / prepared statements).
  - Always validate, sanitize, and encode untrusted user inputs.
  - Implement strict authorization checks on every endpoint (BOLA / IDOR defense).
  - Set restrictive CORS, CSRF tokens, and security headers (CSP, HSTS, X-Frame-Options).

## 2. Ponytail Engineering (Zero-Bloat & Senior Dev Standards)
- **Smallest Change That Solves The Task**: Never add unnecessary abstractions, redundant dependencies, or over-engineered boilerplate.
- **Plain English & High Clarity**: Code should be readable and self-documenting.
- **Defensive Error Handling**: Every webhook and pipeline must fail gracefully with structured error logs and notifications.

## 3. Autonomous AI Orchestration (n8n & Claude 3.5 Sonnet)
- Every workflow must include an explanatory yellow Sticky Note with setup instructions, required credentials, and sheet schema.
- High-severity events (critical security vulnerabilities, severe overdue cash, angry client reviews) must trigger immediate WhatsApp / Telegram SOS alerts to the Founder.
