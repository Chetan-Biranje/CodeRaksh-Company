# 🧠 CodeRaksh Company — Persistent AI Agent Memory & Context

> **Repository State:** Production-Ready Autonomous Enterprise (3.0.0)  
> **Primary Maintainer:** Chetan Biranje  
> **Last Updated:** 27 October 2026  

---

## 1. Core Invariants (Rules That Must NEVER Be Broken)

1. **Zero Secret Leaks:** Never commit raw API keys (OpenAI, Anthropic, AWS, Stripe) or JWT secrets to code. Always use environment variables or `.env`.
2. **Windows UTF-8 Encoding:** All Python CLI scripts, file reads, and subprocesses must specify `encoding="utf-8"` with `sys.stdout.reconfigure(encoding="utf-8")` to avoid Windows `cp1252` encoding crashes.
3. **Preserve n8n Canvas Integrity:** Every workflow JSON must have valid UUIDs, unique node names, and verified connection mappings.
4. **"Full Human Touch" Mandate:** In all client-facing or founder-facing messages, speak warmly, respectfully, and authentically in Marathi, Hinglish, or English. Never sound robotic or generic.

---

## 2. Key Architecture Knowledge

### The 26 Autonomous Workflows
- **01–04 (Sales):** Lead Finder, WhatsApp Replier, Lead Qualifier, Repeat Order Bot.
- **05–08 (Support):** AI Receptionist, Missed-Call Rescuer, Inbox Sorter, FAQ Bot.
- **09–12 (Marketing):** SEO Page Team, 1 Video → 5 Posts, Review Replier, Review Asker.
- **13–16 (Finance):** Bill Reader, Invoice Chaser, Statement AI, GST Clerk.
- **17–20 (Ops):** HR Screener, No-Show Stopper, Deadline Bot, Doc Chaser.
- **21 (Executive CEO):** Morning Radar (9 AM), Boardroom Audit & Health Score (9 PM), `/ceo-command` Webhook, 24/7 Watchdog.
- **22 (DevSecOps Sentinel):** Automated PR security audit, secret scanner, and review comments.
- **23 (Bug Hunter):** Nuclei/Burp ingest, false-positive filtering, CVSS 4.0 scoring, auto-patches.
- **24 (DevOps Doctor):** CI/CD build crash log diagnosis and exact git diff generation.
- **25 (Tech Lead SOW):** Client brief to fullstack architecture, DB schema, and sprint quotation.
- **26 (Treasury Scanner):** Pre-market stock momentum and SEC EDGAR 10-K/8-K reader.
- **00 (Master Mega Canvas):** All 26 agents connected across 7 visual zones (`00_MASTER_CODERAKSH_ALL_26_AGENTS_CONNECTED.json`).

---

## 3. Tooling & Service Paths

- **Executive Cyber Dashboard:** `dashboard/index.html` (Local / GitHub Pages)
- **Client Agency Portal:** `portal/index.html` (Public-facing teaser scanner & quote form)
- **Enterprise CLI:** `coderaksh.py` (`health`, `scan <url>`, `pr-check`, `sow`)
- **Credential Injector:** `setup.py` (Replaces `YOUR_...` placeholders into `configured_workflows/`)
- **Docker Compose:** `docker-compose.yml` (n8n on port `5678`, PostgreSQL 16 on port `5432`)
- **Mobile Chatbot Server:** `bot/server.py` (FastAPI WhatsApp & Telegram listener on port `8000`)
- **Google Sheets Templates:** `sheets_template/` (15 CSV files with human sample data)
- **Legal Contracts:** `legal_contracts/` (VAPT RoE, NDA, MSA)

---

## 4. Continuous Decision Log

| Date | Decision | Rationale |
|---|---|---|
| **2026-10-27** | Created Workflow 21 (AI CEO Command Center) | Needed a central orchestrator uniting all 20 agents with morning/nightly routines and on-demand webhooks. |
| **2026-10-27** | Expanded Department 7 (Workflows 22–26) | CodeRaksh is a cyber security and software agency; required DevSecOps, Bug Bounty, and SOW capabilities. |
| **2026-10-27** | Built `coderaksh.py` CLI & Pre-commit Sentinel | Enables developers and founders to run instant audits and secret leak scans from terminal. |
| **2026-10-27** | Installed Universal `coderaksh` Master Skill | Globally registered in `~/.claude/skills`, `~/.gemini/config/skills`, and `.agents/` so all AI tools discover it. |
