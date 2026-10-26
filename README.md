# 🛡️ CodeRaksh Company — Autonomous AI Enterprise & Cyber Defense OS

[![GitHub Repository](https://img.shields.io/badge/GitHub-Chetan--Biranje%2FCodeRaksh--Company-blue?logo=github)](https://github.com/Chetan-Biranje/CodeRaksh-Company)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Workflows](https://img.shields.io/badge/Workflows-26%20Agents-cyan.svg)](00_MASTER_CODERAKSH_ALL_26_AGENTS_CONNECTED.json)
[![Health Score](https://img.shields.io/badge/Health%20Score-88%2F100-brightgreen.svg)](dashboard/index.html)

> 🔗 **Official GitHub Repository:** [https://github.com/Chetan-Biranje/CodeRaksh-Company.git](https://github.com/Chetan-Biranje/CodeRaksh-Company.git)  
> 🚀 **Quick Clone:** `git clone https://github.com/Chetan-Biranje/CodeRaksh-Company.git`

26 ready-to-import n8n workflows, organised into 7 departments + Master Mega Canvas + Executive Cyber Dashboard + CLI + Client Portal.
Each workflow uses Claude 3.5 Sonnet (Anthropic) as its brain, backed by human-in-the-loop safeguards.


## Sales

| # | Agent | What it does |
|---|-------|--------------|
| 01 | **Lead Finder** | Searches Google Maps for businesses in your niche and city each morning, opens each website, and Claude writes a personal first line for your cold email. Saved to Google Sheets. |
| 02 | **WhatsApp Replier** | Replies to new WhatsApp leads within seconds and asks one qualifying question. Lead saved to Sheets. |
| 03 | **Lead Qualifier** | Leads from your form or ads come in by webhook. Claude labels them hot, warm or cold; hot leads send you a WhatsApp alert. |
| 04 | **Repeat-Order Bot** | Reads your Orders sheet and WhatsApps each customer a few days before their product runs out, so they re-order. |

## Support

| # | Agent | What it does |
|---|-------|--------------|
| 05 | **AI Receptionist** | Checks your Google Calendar and books a free slot from a WhatsApp message, then sends a reminder one day before. |
| 06 | **Missed-Call Rescuer** | When you miss a call, a friendly WhatsApp text-back goes out within seconds. Caller logged as a lead. |
| 07 | **Inbox Sorter** | Claude reads every new Gmail message: needs-reply gets a ready draft, the rest is labelled FYI. Nothing is sent automatically. |
| 08 | **FAQ Bot** | Answers common customer questions on WhatsApp from your own FAQ text; anything it is unsure about is passed to you. |

## Marketing

| # | Agent | What it does |
|---|-------|--------------|
| 09 | **SEO Page Team** | Five agents research competitors, find missing pages, write and edit them, and save WordPress drafts every night. |
| 10 | **1 Video → 5 Posts** | Paste a YouTube link: caption, LinkedIn post, X thread, Shorts hook and newsletter blurb, saved in Notion. |
| 11 | **Review Replier** | Fetches new Google reviews hourly and writes on-brand replies. Angry reviews are never auto-answered; you get a draft. |
| 12 | **Review Asker** | After a visit or order, asks happy customers for a Google review; unhappy feedback comes privately to you instead. |

## Finance

| # | Agent | What it does |
|---|-------|--------------|
| 13 | **Bill Reader** | Bill PDFs arriving in Gmail become Sheet rows: vendor, invoice no., date, amount, tax. |
| 14 | **Invoice Chaser** | Finds overdue invoices every night and sends reminders whose tone gets firmer the later the payment is. |
| 15 | **Statement AI** | Reads a bank statement PDF and categorises every transaction into a clean sheet. |
| 16 | **GST Clerk** | Turns sales/purchase invoices into a GST register sheet (GSTIN, taxable value, CGST/SGST/IGST). |

## Ops

| # | Agent | What it does |
|---|-------|--------------|
| 17 | **HR Screener** | Resume PDFs in Gmail are scored 0–10 against your job description; Shortlist or Reject row in Sheets. |
| 18 | **No-Show Stopper** | Confirms tomorrow's appointments on WhatsApp; cancellations are offered to the next person on the waitlist. |
| 19 | **Deadline Bot** | Checks your deadlines sheet daily and sends reminders before anything is due. |
| 20 | **Doc Chaser** | Tracks which documents each customer still owes you and politely follows up until they arrive. |

## 🛡️ Cyber Security, DevSecOps, DevOps & Tech Lead

| # | Agent | What it does |
|---|-------|--------------|
| 22 | **GitHub DevSecOps Sentinel** | Webhook fires on PRs: regex & AI secret leak scanner (AWS/OpenAI/JWT), OWASP Top 10 SAST audit (SQLi/XSS/SSRF), posts GitHub review comments, and triggers WhatsApp alert on critical risks. |
| 23 | **Autonomous Bug Hunter** | Ingests findings from Nuclei/Burp/Zap/HackerOne, filters false positives, calculates CVSS 3.1/4.0 score, and generates code patches and advisory reports. |
| 24 | **DevOps CI/CD Doctor** | Webhook on GitHub Actions/Docker build failures: ingests logs, isolates root cause, generates exact code diff / terminal fix, and alerts via WhatsApp. |
| 25 | **Freelance Tech Lead (SOW)** | Turns client RFPs / project briefs into winning System Architectures, Agile Sprint Milestones, DB schemas, and Scope of Work (SOW) commercial quotes. |
| 26 | **Treasury Market Scanner** | Daily pre-market scanner, SEC EDGAR earnings analyzer, and treasury risk guardian for company reserves. |

## 👑 CodeRaksh Master Executive Orchestrator

| # | Master Agent | What it does |
|---|--------------|--------------|
| 21 | **AI CEO & Command Center** | **The Central Executive Brain connecting all 25 departmental agents!**<br>• **9:00 AM Morning Flight Plan**: Scans hot leads, meetings, urgent cash due, and compliance deadlines into a Top-3 founder priority list via WhatsApp & Gmail.<br>• **9:00 PM Boardroom Audit**: Audits all departments (11 sheets), calculates **CodeRaksh Health Score (0-100%)**, logs to `Daily Log`, and dispatches CEO WhatsApp/Email reports.<br>• **On-Demand Webhook (`/ceo-command`)**: Ask any question via chat/webhook and get real-time data & AI answers.<br>• **24/7 Anomaly Watchdog (`/emergency-escalation`)**: Fires instant SOS WhatsApp alerts for angry reviews, huge overdue bills, or critical deadlines. |

## 🧰 Claude Code, Codex & Antigravity Skills (95+ Skills Hub)

Check [`CODERAKSH_TECH_AND_SKILLS_MANIFEST.md`](./CODERAKSH_TECH_AND_SKILLS_MANIFEST.md) for full documentation of all 95+ professional offensive security, bug bounty, clean engineering (Ponytail), fullstack (GStack), UI/UX design, and algorithmic trading skills loaded on your machine.

The universal master skill `coderaksh` is installed globally in:
- `~/.claude/skills/coderaksh/SKILL.md` (Claude Code)
- `~/.gemini/config/skills/coderaksh/SKILL.md` (Gemini & Antigravity)
- `.agents/skills/coderaksh/SKILL.md` (Codex & Workspace)

## 🌐 Enterprise Apps & Tooling Suite

1. **🌐 Client Agency Portal (`portal/index.html`)**: Public-facing client website featuring an interactive **Instant Security Teaser Scanner** and **SOW Proposal Lead Form**.
2. **📊 Executive Cyber Dashboard (`dashboard/index.html`)**: Real-time business control center featuring Company Health Gauge, live CEO Flight Plan, and an interactive **Webhook Simulator**.
3. **🛠️ Enterprise CLI (`coderaksh.py`)**: Terminal toolkit:
   - `python coderaksh.py health` — Real-time company financial & security metrics
   - `python coderaksh.py scan <url>` — Live security header & server banner disclosure recon
   - `python coderaksh.py pr-check` — Git pre-commit secret leak & SAST sentinel
   - `python coderaksh.py sow <client> <app> <budget>` — Instant technical SOW proposal generator
4. **🐫 CAMEL-AI Multi-Agent Workforce Bridge (`camel_workforce.py`)**:
   - `python camel_workforce.py --status` — Displays active CAMEL workforce roster and capabilities
   - `python camel_workforce.py --task audit` — Multi-agent pull request security and secret audit
   - `python camel_workforce.py --task sow` — Multi-agent system architecture and proposal synthesis
   - `python camel_workforce.py --roleplay` — Autonomous Red Team vs Blue Team communicative consensus
5. **💬 Mobile AI CEO Chatbot (`bot/server.py`)**: Standalone FastAPI server for WhatsApp Cloud API & Telegram Bot.
6. **📜 Legal & Contracts Hub (`legal_contracts/`)**:
   - `VAPT_RULES_OF_ENGAGEMENT_AND_AUTHORIZATION.md`
   - `MUTUAL_NON_DISCLOSURE_AGREEMENT_NDA.md`
   - `MASTER_SERVICES_AGREEMENT_MSA_AND_SOW.md`
6. **📊 Google Sheets Master Templates (`sheets_template/`)**: 15 pre-built CSV templates with realistic human sample data.
7. **🐳 1-Click Docker Deployment (`docker-compose.yml`)**: Production-ready self-hosted n8n + PostgreSQL instance.

## Bonus

`00_MASTER_CODERAKSH_ALL_26_AGENTS_CONNECTED.json` is the flagship mega canvas uniting all 26 agents across 7 visual department zones on one interconnected screen.

`00_BONUS_first_12_connected_one_canvas.json` is the legacy 12-agent reel canvas.

## How to import

1. Open n8n (n8n.cloud or self-hosted) → **Workflows → Add workflow**.
2. **⋯** menu (top right) → **Import from File** → pick a `.json` file.
3. Read the sticky note on the canvas and follow its setup steps.
4. Add your own credentials: **Anthropic (Claude)**, and as needed **Google Sheets**, **Gmail**, **WhatsApp Business Cloud**. These files contain no keys or IDs.
5. Replace every `YOUR_...` placeholder (sheet IDs, WhatsApp Phone Number ID, your number, etc.).
6. Click **Execute workflow** once with test data, check the result, then switch it to **Active**.

## Tips

- Start with one agent. Easiest first: **13 Bill Reader** (Gmail + Sheets + Claude).
- Point anything that sends messages at your own number or a draft until you trust it.
- Model: Claude nodes use `claude-sonnet-5-5`; switch in the Claude node if you like.

