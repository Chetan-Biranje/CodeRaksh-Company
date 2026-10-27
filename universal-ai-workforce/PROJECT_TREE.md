# 🌲 Universal AI Workforce — Project Codebase Tree

```
universal-ai-workforce/
├── .claude/                               # Claude Code MCP Configuration
│   └── config.json
├── .cursor/                               # Cursor & Windsurf MCP Configuration
│   └── mcp.json
├── .gitignore                             # Git ignore rules for node_modules, temp files
├── CHANGELOG.md                           # System release history and milestone changelog
├── LICENSE                                # Permissive MIT License
├── ORGANIZATION_TREE.md                   # 1,000+ Agent Organizational Hierarchy & Dept Roster
├── PROJECT_TREE.md                        # Complete Codebase Directory & File Manifest
├── README.md                              # Master System Overview & Quick Start Guide
├── hooks.json                             # Event hooks & lifecycle callbacks
├── mcp_config.json                        # Google Antigravity & Gemini MCP Server Config
├── package.json                           # Package manifest and test scripts
├── plugin.json                            # Antigravity & Claude plugin descriptor
│
├── bin/                                   # Executable CLI & Server Binaries
│   └── workforce.mjs                      # Master CLI (18+ subcommands, MCP server, HTTP server)
│
├── config/                                # System & Engine Configuration
│   └── workforce.config.json              # Concurrency limits, budget thresholds, provider settings
│
├── core/                                  # Core Operating System & Orchestration Engine
│   ├── index.js                           # Master state loader and persistence coordinator
│   ├── agent-factory/                     # Logical Agent Factory & Storage
│   │   ├── agent-data-model.js            # AgentConfiguration schema & capability validator
│   │   ├── agent-factory.js               # Dynamic worker instance auto-scaler
│   │   └── agent-registry.js              # High-performance indexed storage (1,000+ agents in <2ms)
│   ├── event-system/                      # Reactive Pub/Sub Event System
│   │   ├── event-bus.js                   # In-memory pub/sub broker with replay buffer
│   │   └── events.js                      # Standard event types (lifecycle, tasks, skills)
│   ├── http-server/                       # Zero-Dependency HTTP REST Server
│   │   └── http-server.js                 # REST API endpoints for ChatGPT Custom Actions & Webhooks
│   ├── mcp-server/                        # Model Context Protocol (MCP) Server
│   │   └── mcp-server.js                  # Standard JSON-RPC 2.0 stdio server (10 exposed tools)
│   ├── orchestrator/                      # Central Executive & Department Hierarchy
│   │   ├── ceo-orchestrator.js            # AI CEO: Goal decomposition, Task DAG generation, Briefings
│   │   └── hierarchy.js                   # 12-department organizational hierarchy and routing
│   ├── policy-engine/                     # Zero-Trust Security & Policy Enforcement
│   │   ├── approval-manager.js            # Human-in-the-loop approval workflows
│   │   ├── kill-switch.js                 # Emergency workforce halt/resume trigger
│   │   ├── policy-engine.js               # Policy evaluator, sensitive action blocker, secret redactor
│   │   └── secret-masker.js               # Regex-based real-time credential redactor
│   ├── scheduler/                         # Workforce Job Scheduler
│   │   └── workforce-scheduler.js         # Cron dispatcher, periodic worker scaling, timeout watchdog
│   ├── skill-registry/                    # Autonomous Skill Ingestion & Lifecycle Engine
│   │   ├── skill-lifecycle.js             # 10-step autonomous skill ingestion pipeline
│   │   ├── skill-registry.js              # Skill storage, capability deduplication, lookup
│   │   └── skill-validator.js             # Schema validation and environment dependency checking
│   └── task-engine/                       # Task DAG Engine & Worker Pool
│       ├── task-dag.js                    # Tarjan cycle detection, parallel execution tiers
│       ├── task-engine.js                 # Task execution, worker assignment, state checkpointing
│       └── task-queue.js                  # Priority task queue (urgent > high > medium > low)
│
├── dashboard/                             # Terminal & Web Dashboards
│   ├── cli-dashboard.js                   # Unicode terminal KPI dashboard
│   └── html-dashboard.js                  # Standalone responsive single-file HTML report generator
│
├── departments/                           # 12 Core Corporate Department JSON Schemas
│   ├── cybersecurity.json                 # Cyber Security & DevSecOps
│   ├── engineering.json                   # Software & AI Engineering
│   ├── finance.json                       # Finance & Accounting
│   ├── healthcare.json                    # Healthcare Administration (HIPAA, Clinical trials)
│   ├── hr.json                            # Human Resources & Recruitment
│   ├── legal.json                         # Legal & Compliance Support
│   ├── marketing.json                     # Marketing & Growth
│   ├── operations.json                    # Operations & Project Management
│   ├── product_design.json                # Product & Design
│   ├── research.json                      # Research & Business Intelligence
│   ├── sales.json                         # Sales & Business Development
│   ├── supply_chain.json                  # Procurement & Supply Chain
│   └── support.json                       # Customer Support & CSAT
│
├── docs/                                  # Comprehensive System Documentation
│   ├── ARCHITECTURE.md                    # Core architectural design and data flow
│   ├── CONFIGURATION.md                   # Environment variables and engine tuning
│   ├── INSTALLATION.md                    # Quick start and prerequisites
│   ├── TROUBLESHOOTING.md                 # Common errors, remediation, recovery procedures
│   ├── UNIVERSAL_AI_TOOL_INTEGRATION.md   # Integration guides for Claude, Gemini, ChatGPT, Cursor
│   └── UPGRADE_AND_ROLLBACK.md            # Atomic snapshot backup and state recovery
│
├── integrations/                          # Multi-Platform Integration Packages
│   ├── chatgpt/                           # OpenAI ChatGPT Custom Actions
│   │   ├── README.md                      # ChatGPT configuration walkthrough
│   │   └── openapi.json                   # OpenAPI 3.1 schema specification
│   ├── claude-code/                       # Anthropic Claude Code CLI
│   │   ├── README.md                      # Slash commands reference
│   │   └── plugin.json                    # Claude plugin manifest
│   ├── claude-desktop/                    # Anthropic Claude Desktop
│   │   └── claude_desktop_config.json     # Ready-to-copy Claude Desktop MCP config
│   └── gemini/                            # Google Gemini & Antigravity
│       ├── README.md                      # Gemini CLI setup instructions
│       └── plugin.json                    # Antigravity plugin manifest
│
├── providers/                             # Interchangeable LLM Provider Adapters
│   ├── base-provider.js                   # Base LLM provider interface
│   ├── claude-adapter.js                  # Anthropic Claude 3.5 Sonnet / Opus adapter
│   ├── gemini-adapter.js                  # Google Gemini 2.5 Pro / Flash adapter
│   ├── mock-provider.js                   # Zero-credential deterministic mock provider for CI/CD
│   └── openai-adapter.js                  # OpenAI GPT-4o / o1 adapter
│
├── rules/                                 # Operational Constraints & Architectural Guidelines
│   └── universal-workforce.md             # Security, licensing, and memory invariants
│
├── schemas/                               # JSON Schema Contract Definitions
│   ├── agent.schema.json                  # Logical Agent schema
│   ├── department.schema.json             # Department definition schema
│   ├── skill.schema.json                  # Standard Skill definition schema
│   └── task.schema.json                   # Task & DAG definition schema
│
├── scripts/                               # Performance & Stress Test Scripts
│   ├── benchmark-workforce.js             # Sub-millisecond performance benchmark suite
│   └── seed-1000-agents.js                # 1,000+ realistic agent load seeder with heap profiling
│
├── skills/                                # 34 Production Agent Skills (SKILL.md)
│   ├── adversarial-security-auditor/      # Cloudflare 6-phase audit harness, disprove verification
│   ├── agency-persona-architect/          # Domain-expert agency personas with cognitive reflection
│   ├── agent-reliability-runtime/         # Inspect-before-edit mandate, risk-scaled planning
│   ├── agentic-context-learning/          # Deterministic Tree-sitter code maps, persistent memory
│   ├── agentic-video-studio/              # Multi-stage video studio, scriptwriting, Remotion rendering
│   ├── anti-slop-designer/                # Editorial aesthetics, anti-AI visual slop
│   ├── automated-career-pipeline/         # Multi-board job scraping, JD parsing, semantic matching
│   ├── autonomous-pentest-orchestrator/   # Graph pentesting, sandbox-verified exploit PoCs, patch PRs
│   ├── awesome-skills-curator/            # Standardized SKILL.md catalog, cross-tool portability
│   ├── bug-hunter-audit/                  # Vulnerability triage, CVSS 4.0 assessment, patch synthesis
│   ├── career-ops-recruiter/              # Candidate sourcing, technical resume parsing
│   ├── codebase-knowledge-graph/          # Codebase AST knowledge graph, domain clustering
│   ├── codebase-memory-engine/            # Local SQLite Tree-sitter knowledge graph, sub-ms queries
│   ├── computer-use-sandbox/              # VM desktop sandboxes, non-intrusive GUI automation, MCP
│   ├── devsecops-sentinel/                # SAST scanning, secret leak detection, PR audits
│   ├── editorial-diagram-architect/       # Publication-grade technical diagrams across 45 layouts
│   ├── enterprise-agile-orchestrator/     # Work package decomposition, Kanban/Scrum boards, Gantt
│   ├── enterprise-rag-connector/          # Semantic document chunking, vector embeddings, cross-silo RAG
│   ├── executive-office-hours/            # YC-style partner pressure tests, ruthless scope reduction
│   ├── gtm-launch-board/                  # Product Hunt launch orchestration, directory syndication
│   ├── impeccable-design-system/          # Product truth (PRODUCT.md), design token contracts (DESIGN.md)
│   ├── last-30-days-researcher/           # Time-fenced multi-platform discourse research (Reddit, X, HN)
│   ├── local-voice-transcription/         # 100% offline local speech-to-text dictation, Silero VAD
│   ├── market-sentiment-analyst/          # Time-series sentiment tracking, SEC EDGAR 8-K/10-Q analysis
│   ├── pragmatic-code-optimizer/          # YAGNI code audit, dead code elimination, minimal surface area
│   ├── prose-humanizer/                   # Eliminates synthetic LLM cadence, burstiness tuning
│   ├── red-team-auditor/                  # Red-team penetration testing, MITRE ATT&CK mapping
│   ├── reverse-api-engineer/              # Network HAR analysis, undocumented REST/GraphQL reverse engineering
│   ├── sales-outreach-drafter/            # B2B prospecting, personalized email sequencing
│   ├── seo-content-engine/                # Keyword research, search engine optimization, content briefs
│   ├── stealth-web-crawler/               # Undetectable web scraping, anti-bot evasion, auto-healing DOM
│   ├── swarm-meta-harness/                # Multi-agent swarm orchestration (100+ agents), HNSW memory
│   ├── ui-ux-design-intelligence/         # 79 visual styles, 192 product palettes, 74 font pairings
│   └── web-dev-sweep/                     # Health check monitoring, console error triage, dependency updates
│
├── storage/                               # Transactional Local State & Audit Logs
│   ├── agents.json                        # 1,000+ indexed agent records
│   ├── audit.jsonl                        # Append-only security audit trail with redacted secrets
│   ├── dashboard.html                     # Live single-file responsive HTML dashboard
│   ├── departments.json                   # Provisioned department records
│   ├── scheduler.json                     # Scheduler job definitions and execution state
│   ├── skills.json                        # 34 registered skills and capability index
│   └── tasks.json                         # Executed and pending task ledger
│
├── templates/                             # 8 Industry Workforce Templates
│   ├── b2b-saas.json                      # B2B Software as a Service template
│   ├── ecommerce.json                     # E-Commerce & Retail Operations template
│   ├── education.json                     # EdTech & Academic Administration template
│   ├── fintech.json                       # Financial Services & Treasury template
│   ├── healthcare.json                    # Healthcare Administration & Compliance template
│   ├── manufacturing.json                 # Manufacturing & Industrial Logistics template
│   ├── marketing-agency.json              # Full-Service Marketing & Creative Agency template
│   └── small-business.json                # Lean Small Business & Solopreneur template
│
└── tests/                                 # Verification Test Suites
    └── test-runner.js                     # 21 comprehensive automated verification test suites (21/21 Passing)
```
