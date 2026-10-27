# 🛡️ Universal AI Workforce — System Architecture

The Universal AI Workforce is a provider-neutral, autonomous enterprise operating system that manages **1,000+ logical AI employees** across any industry.

---

## 🏛️ 1. Organizational Hierarchy

Every task, goal, and communication flows through a structured, multi-tier chain of command:

```
[FOUNDER / OWNER]
       │
       ▼ (Submits high-level objective: "Launch new store", "Audit infrastructure")
[AI CEO — Central Executive Orchestrator]
       │
       ├── Chief Operating Officer (COO)       ── Operations & Support
       ├── Chief Technology Officer (CTO)       ── Software & Product Engineering
       ├── Chief Financial Officer (CFO)       ── Finance & Treasury
       ├── Chief Marketing Officer (CMO)       ── Growth & AEO Marketing
       ├── Chief Revenue Officer (CRO)         ── Sales & Business Dev
       ├── Chief Human Resources Officer (CHRO)── HR & Recruitment
       ├── Chief Information Security Officer  ── Cyber Security & DevSecOps
       └── Chief of Staff (COS)                ── Cross-Employee Oversight
              │
              ▼
    [12 Core Departments]
              │
              ▼
   [Logical Agent Registry] ── (Supports 1,000+ indexed agent definitions)
              │
              ▼
   [Dynamic Worker Pool]   ── (Ephemeral workers scaled up/down by workload)
```

---

## ⚙️ 2. Core Subsystems

### A. Skill Lifecycle Manager (10-Step Pipeline)
Whenever a skill is added, updated, or scanned, it passes through 10 deterministic steps:
1. **Detect**: Identifies skill file (`SKILL.md` or `skill.json`).
2. **Metadata Intake**: Parses YAML frontmatter, capabilities, dependencies, and risk level.
3. **Structural Validation**: Enforces JSON Schema specifications.
4. **Attribute & Dependency Analysis**: Validates node version, tools (`where/which`), and environment variables.
5. **Deduplication Check**: Detects if an active skill already provides equivalent capabilities.
6. **Scaling Decision**: Decides whether to attach to an existing agent, create a new specialist agent, or keep pending.
7. **Self-Tests**: Runs verification tests.
8. **Policy Activation**: Enforces zero-trust and approval requirements.
9. **Registry Update**: Indexes capabilities and updates agents.
10. **Audit Logging**: Appends an immutable audit event to `storage/audit.jsonl` with secret redaction.

### B. Agent Factory & Worker Auto-Scaler
- **Logical Agents**: Lightweight database records (supporting 1,000+ agents without high RAM consumption).
- **Worker Instances**: Ephemeral execution units instantiated only when tasks are queued.
- **Dynamic Workload Scaling**:
  - Scales up worker instances when queue depth exceeds threshold (`tasksPerWorkerToScaleUp`).
  - Scales down and terminates idle workers when the queue empties.

### C. Task Engine & Dependency DAG
- Converts high-level business goals into a Directed Acyclic Graph (DAG).
- **Cycle Detection**: Enforces Tarjan's DFS algorithm to prevent infinite delegation or circular deadlocks.
- **Parallel Tier Batching**: Executes independent tasks in concurrent groups safely.
- **Recovery & Checkpointing**: Recovers tasks interrupted during system crashes or restarts.

### D. Provider-Neutral Adapters
- **Mock Provider**: Fast deterministic provider for offline unit tests and load tests with zero API cost.
- **Anthropic Claude**: Full Claude 3.7 / Claude Code compatibility.
- **Google Gemini**: Gemini 2.0 Flash integration with high throughput.
- **OpenAI**: GPT-4o adapter with structured output support.

### E. Security & Human-in-the-Loop Policies
- **Global Kill Switch**: Instantly pauses all active executions.
- **Approval Gate**: Mandatory human approval before external messaging, spending money, deleting data, or running destructive commands.
- **Secret Redaction**: Automatic regex masking of OpenAI, Google, AWS, GitHub, and bearer tokens across logs and events.
