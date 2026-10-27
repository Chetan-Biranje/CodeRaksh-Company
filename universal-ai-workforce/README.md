# 🛡️ Universal AI Workforce (1,000+ Logical AI Employees)

> **Enterprise-Grade Provider-Neutral Autonomous Workforce Operating System & Multi-Agent Orchestrator**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-21%2F21%20Passing-brightgreen.svg)]()
[![Logical Agents](https://img.shields.io/badge/Scale-1%2C000%2B%20Logical%20Agents-purple.svg)]()

---

## 🌟 Overview

The **Universal AI Workforce** is an extensible, industry-independent AI operating system engineered to govern **1,000+ logical AI employees** across any commercial domain. Rather than running 1,000 expensive concurrent model connections, the platform employs a clean separation of concerns:
- **Logical Agents**: Indexed, metadata-rich role definitions across corporate departments.
- **Worker Pool**: Dynamic, ephemeral execution units that auto-scale up under heavy task queues and scale down to zero when idle.
- **Skill Lifecycle Manager**: An autonomous 10-step ingestion engine that registers skills, detects duplicate capabilities, resolves dependencies, and dynamically provisions specialized agents.
- **Central AI CEO**: Translates raw business objectives into dependency-aware Directed Acyclic Graphs (DAGs) and generates synthesized executive briefings.
- **Industry Templates**: Out-of-the-box configurations for E-Commerce, B2B SaaS, Marketing Agencies, Healthcare Administration, Fintech, Manufacturing, Education, and Small Businesses.

---

## 🏛️ Organizational Hierarchy

```
[FOUNDER / OWNER]
       │
       ▼ (Submits business objective)
[AI CEO — Central Executive Orchestrator]
       │
       ├── Chief Operating Officer (COO)       ── Operations & Customer Support
       ├── Chief Technology Officer (CTO)       ── Software & Product Engineering
       ├── Chief Financial Officer (CFO)       ── Finance & Treasury
       ├── Chief Marketing Officer (CMO)       ── Marketing & Growth
       ├── Chief Revenue Officer (CRO)         ── Sales & Business Development
       ├── Chief Human Resources Officer (CHRO)── HR & Recruitment
       ├── Chief Information Security Officer  ── Cyber Security & DevSecOps
       └── Chief of Staff (COS)                ── Cross-Employee Oversight
              │
              ▼
    [12 Core Departments]
              │
              ▼
   [Logical Agent Registry] ── (Fast indexing supporting 1,000+ agents)
              │
              ▼
   [Dynamic Worker Pool]   ── (Workload auto-scaling instances)
```

---

## ⚡ Key Capabilities

1. **1,000+ Logical AI Agents**: High-performance indexed storage (`core/agent-factory/agent-registry.js`) supporting instant filtering and pagination across 1,000+ agent records in `< 2ms`.
2. **Autonomous Skill Lifecycle Manager**: Deterministic 10-step pipeline (`core/skill-registry/skill-lifecycle.js`):
   - Ingests markdown (`SKILL.md`) and YAML frontmatter.
   - Verifies system tools and environment variables.
   - Detects capability duplicates.
   - Reuses existing agents or provisions new specialized roles when justified.
3. **Task DAG Engine with Cycle Detection**: Prevents infinite loops and circular dependencies using Tarjan's DFS algorithm; calculates parallel execution batches.
4. **Provider-Neutral Architecture**: Interchangeable adapters for **Anthropic Claude**, **Google Gemini**, **OpenAI ChatGPT**, and an ultra-fast **Deterministic Mock Provider** for offline CI/CD.
5. **Universal AI Client Integration**: Native **MCP (Model Context Protocol)** server over stdio for Claude Desktop, Claude Code, Cursor, Windsurf, and Gemini/Antigravity, plus pure-Node **HTTP REST API** with OpenAPI 3.1 for **OpenAI ChatGPT Custom Actions** (see [Universal AI Tool Integration Guide](docs/UNIVERSAL_AI_TOOL_INTEGRATION.md)).
6. **Zero-Trust Security & Human Approval**: Mandatory human approval on sensitive actions (external messaging, payment/spending, data deletion, destructive shell commands).
7. **Automatic Secret Redaction**: Real-time masking of OpenAI, Google, AWS, GitHub, and Bearer tokens across logs and audit events (`storage/audit.jsonl`).
8. **Crash Checkpointing & Recovery**: Automatically detects and recovers interrupted tasks upon restart.
9. **Configurable Industry Templates**: Pre-configured templates for 8 different commercial sectors.

---

## 🛠️ Registered Skills (34 Production Skills)

| Skill ID | Department | Capabilities & Focus | Risk Level |
|---|---|---|:---:|
| `bug-hunter-audit` | Cybersecurity | Vulnerability triage, CVSS 4.0 assessment, patch synthesis | Medium |
| `devsecops-sentinel` | Cybersecurity | SAST scanning, secret leak detection, PR security audits | Low |
| `red-team-auditor` | Cybersecurity | Red-team penetration testing, MITRE ATT&CK mapping, posture audit | High |
| `autonomous-pentest-orchestrator` | Cybersecurity | Autonomous graph pentesting, sandbox-verified exploit PoCs, patch PRs | High |
| `adversarial-security-auditor` | Cybersecurity | Cloudflare 6-phase audit harness, coverage tracking, adversarial disprove | High |
| `gtm-launch-board` | Marketing | Product Hunt launch orchestration, directory distribution | Medium |
| `seo-content-engine` | Marketing | Keyword research, search engine optimization, content briefs | Low |
| `prose-humanizer` | Marketing | Eliminates synthetic LLM cadence, burstiness and perplexity tuning | Low |
| `agentic-video-studio` | Marketing | Multi-stage video studio, storyboarding, TTS narration, Remotion rendering | Medium |
| `sales-outreach-drafter` | Sales | B2B prospecting, personalized email sequencing, follow-up tracking | Medium |
| `market-sentiment-analyst` | Finance | Time-series market sentiment analysis, SEC EDGAR filings, trade planning | Low |
| `web-dev-sweep` | Engineering | Health check monitoring, console error triage, dependency updates | Low |
| `reverse-api-engineer` | Engineering | Network HAR analysis, undocumented REST/GraphQL reverse engineering | Medium |
| `pragmatic-code-optimizer` | Engineering | YAGNI code audit, dead code elimination, minimal surface area | Low |
| `stealth-web-crawler` | Engineering | Undetectable web scraping, anti-bot evasion, auto-healing DOM locators | Medium |
| `computer-use-sandbox` | Engineering | Virtual machine desktop sandboxes, non-intrusive GUI automation, MCP | High |
| `codebase-knowledge-graph` | Engineering | AST code mapping, semantic domain clustering, architecture tours | Low |
| `codebase-memory-engine` | Engineering | Local SQLite Tree-sitter knowledge graph, sub-ms queries, blast radius | Low |
| `agentic-context-learning` | Engineering | Deterministic Graft Maps, continuous memory, cross-session learnings | Low |
| `local-voice-transcription` | Engineering | 100% offline local speech-to-text dictation, Silero VAD, zero telemetry | Low |
| `enterprise-rag-connector` | Research | Semantic document chunking, vector embeddings, cross-silo enterprise RAG | Medium |
| `last-30-days-researcher` | Research | Time-fenced multi-platform discourse research (Reddit, X, YouTube, HN, GitHub) | Low |
| `anti-slop-designer` | Product Design | Eliminates generic AI design artifacts, editorial aesthetic enforcement | Low |
| `impeccable-design-system` | Product Design | Product truth (PRODUCT.md), design contracts (DESIGN.md), spatial rhythm | Low |
| `ui-ux-design-intelligence` | Product Design | 79 visual styles, 192 product palettes, 74 font pairings, 119 UX heuristics | Low |
| `editorial-diagram-architect` | Product Design | Publication-grade technical diagrams across 45 layouts (SVG/HTML/Mermaid) | Low |
| `executive-office-hours` | Operations | YC-style partner pressure test, scope reduction, ship readiness audit | Low |
| `swarm-meta-harness` | Operations | Multi-agent swarms (100+ agents), HNSW memory, cross-machine mTLS | Medium |
| `agency-persona-architect` | Operations | Role-based agency persona design, cognitive reflection, deliverable checklists | Low |
| `awesome-skills-curator` | Operations | Standardized SKILL.md catalog, frontmatter validation, cross-tool portability | Low |
| `agent-reliability-runtime` | Operations | Inspect-before-edit mandate, risk-scaled planning (eco/deep), proof audit | Low |
| `enterprise-agile-orchestrator` | Operations | Work package decomposition, Kanban/Scrum boards, critical path Gantt | Low |
| `career-ops-recruiter` | HR | Candidate sourcing, technical resume parsing, interview rubric design | Low |
| `automated-career-pipeline` | HR | Multi-board job aggregation, JD requirement extraction, semantic match ranking | Low |

---

## 🚀 Quick Start

### 1. Initialize Workforce
```bash
node bin/workforce.mjs init
```
Provisions departments, loads built-in skills, and initializes local state.

### 2. View Real-Time Dashboard
```bash
node bin/workforce.mjs status
# Or generate standalone HTML dashboard:
node bin/workforce.mjs status --html
```

### 3. Inspect Full Organization Tree
```bash
node bin/workforce.mjs tree
```

### 4. Submit an Autonomous Goal to the AI CEO
```bash
node bin/workforce.mjs goal "Launch a new online store for retail electronics"
```
The AI CEO decomposes the goal, maps subtasks to Engineering, Marketing, Cybersecurity, and Sales, executes the DAG, and prints an Executive Status Briefing.

---

## 🧪 Verified Automated Test Suite (21/21 Passing)

Run the full test suite verifying all 21 requirements:
```bash
node tests/test-runner.js
# Or: npm test
```

### Test Results Breakdown:
| Test # | Requirement Verified | Status |
|:---:|:---|:---:|
| **01** | Adding and validating a new skill | ✅ PASSED |
| **02** | Attaching a skill to an existing agent | ✅ PASSED |
| **03** | Creating a new specialist agent when justified | ✅ PASSED |
| **04** | Detecting duplicate capabilities | ✅ PASSED |
| **05** | Blocking activation when dependencies are missing | ✅ PASSED |
| **06** | Revalidating updated skills | ✅ PASSED |
| **07** | Safely disabling or removing skills | ✅ PASSED |
| **08** | Creating and completing a task | ✅ PASSED |
| **09** | Delegating tasks through the organization hierarchy | ✅ PASSED |
| **10** | Preventing infinite delegation and circular dependencies | ✅ PASSED |
| **11** | Enforcing approval policies for sensitive operations | ✅ PASSED |
| **12** | Protecting secrets from logs and event payloads | ✅ PASSED |
| **13** | Scaling workers under increased workload | ✅ PASSED |
| **14** | Respecting concurrency and budget limits | ✅ PASSED |
| **15** | Recovering after an interrupted task | ✅ PASSED |
| **16** | Running without real credentials using mock provider | ✅ PASSED |
| **17** | Handling provider errors and rate limits with retries | ✅ PASSED |
| **18** | Supporting 1,000 logical agent records in realistic load test | ✅ PASSED |
| **19** | Dynamic Department restructuring (merging and splitting) | ✅ PASSED |
| **20** | Workforce Scheduler periodic dispatch and deadline watchdog | ✅ PASSED |
| **21** | Industry workforce template application and agent provisioning | ✅ PASSED |

---

## 💻 CLI Commands Reference

| Command | Action |
|---|---|
| `workforce init` | Initialize departments and register built-in starter skills |
| `workforce status [--html]` | Display live dashboard or export single-file HTML report |
| `workforce tree` | Print organizational hierarchy and assigned agents |
| `workforce goal <objective>` | Submit high-level objective for autonomous execution |
| `workforce skill add <path>` | Process new skill through 10-step lifecycle manager |
| `workforce skill validate <path>` | Validate skill structure and dependencies |
| `workforce skill list` | List all registered skills |
| `workforce agent list` | List logical agents across departments |
| `workforce agent inspect <id>` | Inspect agent configuration, capabilities, and metrics |
| `workforce task list` | View tasks and approval statuses |
| `workforce task approve <id>` | Grant human approval for held sensitive action |
| `workforce department list` | List all 12+ company departments |
| `workforce department merge <src> <dst>` | Merge source department into destination and move agents |
| `workforce department split <id> ...` | Split department into two departments |
| `workforce template list` | List all 8 industry workforce templates |
| `workforce template apply <id>` | Apply an industry workforce template |
| `workforce scheduler status` | View recurring jobs and scheduler health |
| `workforce scheduler tick` | Trigger manual scheduler tick |
| `workforce seed [count]` | Seed 1,000+ realistic agents and profile memory |
| `workforce benchmark` | Run performance stress test on DAG, queries, and security |
| `workforce mcp-server` | Start JSON-RPC 2.0 MCP server for Claude, Gemini, Cursor, Windsurf |
| `workforce server [port]` | Start HTTP REST API server for ChatGPT Custom Actions (default: 3456) |
| `workforce install [target]` | Install configs for claude, gemini, cursor, chatgpt, or all |
| `workforce doctor` | Run system diagnostics and compatibility checks |
| `workforce test` | Run all 21 automated test suites |

---

## 📚 Architectural & Manifest References

- 🏛️ **[Complete 1,000+ Agent Organization Tree](ORGANIZATION_TREE.md)**: Full directory of 1,038 agent roles across all 12 corporate departments.
- 🌲 **[Complete Codebase Project Tree](PROJECT_TREE.md)**: Full directory and file manifest of the plugin codebase.
- 🌐 **[Universal AI Tool Integration Guide](docs/UNIVERSAL_AI_TOOL_INTEGRATION.md)**: Setup guides for Claude, Gemini, ChatGPT, Cursor, and Windsurf.
- 🏗️ **[System Architecture](docs/ARCHITECTURE.md)**: Core architectural principles, Task DAG engine, and security policies.
- ⚙️ **[Configuration Reference](docs/CONFIGURATION.md)**: Environment variables and tuning options.
- 🚑 **[Troubleshooting & Self-Healing](docs/TROUBLESHOOTING.md)**: Diagnostics and error resolution procedures.

---

## 🔒 Security & Privacy

- All sensitive actions require explicit human confirmation.
- Secrets are automatically masked as `[REDACTED_SECRET]` before hitting disk.
- Storage uses atomic transactional file replacement (`.tmp` -> `.json`) to prevent data corruption.

---

## 📄 License & Attribution

Licensed under the [MIT License](LICENSE).  
Architected and built for **CodeRaksh Company**. Inspired by open multi-agent design patterns while independently engineered for universal enterprise scale.
