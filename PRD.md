# 🛡️ CodeRaksh Company — Product Requirements Document (PRD)

> **Document Version:** 3.0.0  
> **Author:** Chetan Biranje & Autonomous Executive Lead  
> **Status:** APPROVED & IN PRODUCTION  
> **Target Audience:** Engineering, Security, Product, and AI Agents  

---

## 1. Executive Summary & Vision

**CodeRaksh Company** is an autonomous, security-first digital enterprise and cyber defense agency. The platform operates 26 interconnected AI agents coordinated by an Executive AI CEO Command Center, eliminating manual overhead while providing enterprise-grade Cyber Security, DevSecOps gating, Fullstack Engineering, and Client Acquisition.

### Core Value Proposition
- **26 Autonomous AI Employees, ₹0 Payroll Overhead:** Full coverage across Sales, Support, Marketing, Finance, Ops, DevSecOps, and Cyber Defense.
- **Human-in-the-Loop Safeguards ("Full Human Touch"):** Natural, empathetic human communication in Marathi, Hinglish, and English; destructive actions (sending invoices, public review replies, commits) require owner verification or smart safety thresholds.
- **100% Zero-Secret-Leak Guarantee:** Automated SAST and secret leak sentinel guarding every git commit and pull request.

---

## 2. User Personas

| Persona | Role | Primary Goal | Key Workflows Used |
|---|---|---|---|
| **Chetan Biranje** | Founder / CEO | High-level company oversight, cash flow control, and strategic decisions | Workflow 21 (AI CEO), Dashboard, CLI |
| **Enterprise Client** | CIO / CTO / Security Lead | Order VAPT security audits, obtain automated SOW proposals, track deliverables | Client Portal (`portal/`), SOW Generator (25) |
| **Internal Developer** | Software Engineer | Push code safely without leaking credentials, debug failing builds in minutes | Workflow 22 (DevSecOps), Workflow 24 (CI Doctor) |
| **Prospect / Inbound Lead** | Small Business / Tech Startup | Get quick consultation, automated security scan, and pricing quotes | Workflow 01-03 (Sales), WhatsApp Replier |

---

## 3. Product Features & Departmental Scope

### Department 1: Sales & Client Acquisition (Workflows 01–04)
- **FR-01 (Lead Finder):** Daily automated Google Maps scraping for niche target businesses with personalized cold email icebreakers.
- **FR-02 (WhatsApp Replier):** Sub-5-second reply to incoming WhatsApp inquiries with qualifying questions.
- **FR-03 (Lead Qualifier):** Evaluates inbound leads into `Hot`, `Warm`, or `Cold`. Dispatches immediate WhatsApp SOS alert on `Hot` leads.
- **FR-04 (Repeat Order Bot):** Proactively re-engages previous clients based on service lifecycle.

### Department 2: Customer Support & Retention (Workflows 05–08)
- **FR-05 (AI Receptionist):** Books calendar meetings directly from WhatsApp conversations and handles 24h reminders.
- **FR-06 (Missed Call Rescuer):** Sends instant friendly WhatsApp text-back when an incoming call is missed.
- **FR-07 (Inbox Sorter):** Categorizes Gmail messages, prepares ready response drafts, and flags urgent queries.
- **FR-08 (FAQ Bot):** Resolves common customer technical and pricing questions with human fallback.

### Department 3: Marketing & Brand Reputation (Workflows 09–12)
- **FR-09 (SEO Page Team):** Multi-agent team researching competitors, drafting articles, and creating WordPress drafts.
- **FR-10 (1 Video → 5 Posts):** Converts single video/audio URLs into LinkedIn posts, X threads, Shorts hooks, and newsletters.
- **FR-11 (Review Replier):** Analyzes Google Reviews hourly; drafts on-brand replies (angry reviews routed to owner).
- **FR-12 (Review Asker):** Boosts positive reviews from satisfied clients while shielding complaints privately.

### Department 4: Finance, Tax & Treasury (Workflows 13–16, 26)
- **FR-13 (Bill Reader):** OCR extraction of vendor, invoice number, tax, and total from PDF attachments into Sheets.
- **FR-14 (Invoice Chaser):** Tiered overdue payment collection (Day 2 friendly, Day 7 firm, Day 21 final notice).
- **FR-15 (Statement AI):** Parses bank statement PDFs into structured income/expense rows.
- **FR-16 (GST Register):** Automatic ITC calculation and GSTR-3B tax register compilation.
- **FR-26 (Treasury Scanner):** Pre-market stock chart scanner and SEC EDGAR 10-K/8-K earnings watcher.

### Department 5: Operations & Talent (Workflows 17–20)
- **FR-17 (HR Resume Screener):** Scores candidate resumes 0–10 against job descriptions with Shortlist/Reject logic.
- **FR-18 (No-Show Stopper):** WhatsApp appointment confirmation and automated waitlist slot reassignment.
- **FR-19 (Deadline Alert):** Proactive reminders for statutory, tax, and project deadlines (7, 3, 1 day prior).
- **FR-20 (Doc Chaser):** Automated client KYC and onboarding document collection sequence.

### Department 6: Executive Command Center (Workflow 21)
- **FR-21A (Morning Flight Plan):** 9:00 AM daily briefing highlighting Top-3 Priorities, meetings, and cash dues.
- **FR-21B (Nightly Boardroom Audit):** 9:00 PM audit of 11 sheet tabs; calculates **Company Health Score (0-100%)**.
- **FR-21C (On-Demand CEO Webhook):** `/webhook/ceo-command` interactive question-answering in < 500ms.
- **FR-21D (24/7 Anomaly Watchdog):** `/webhook/emergency-escalation` instant SOS alerts.

### Department 7: Cyber Security & DevSecOps (Workflows 22–25)
- **FR-22 (GitHub DevSecOps Sentinel):** Automated PR security gatekeeper (Secret leak scan + OWASP Top 10 SAST).
- **FR-23 (Bug Hunter & Pentest):** Vulnerability ingestion, false-positive triage, CVSS 4.0 score, and patch creation.
- **FR-24 (DevOps CI/CD Doctor):** Diagnoses CI/CD build failures and outputs exact git commit fix diffs.
- **FR-25 (Freelance Tech Lead):** Converts client project briefs into System Architecture, DB Schemas, and SOW quotes.

---

## 4. Key Performance Indicators (KPIs)

1. **Company Health Score:** Consistently maintained **> 85/100**.
2. **Lead Response Latency:** WhatsApp and web leads acknowledged within **< 10 seconds**.
3. **Secret Leak Rate:** **0%** hardcoded secrets entering GitHub `main`.
4. **VAPT Triage Speed:** Critical vulnerability triage completed within **< 15 minutes**.
5. **Cash Collection Cycle:** Overdue invoices (> 15 days) reduced by **> 60%**.

---

## 5. Non-Functional Requirements (NFRs)
- **Security:** Zero plaintext credentials stored in code repositories. Environment variable isolation.
- **Reliability:** Self-healing Docker Compose container orchestration with automatic PostgreSQL healthchecks.
- **Human Factor:** Warm, respectful, non-robotic language across all communication channels.
