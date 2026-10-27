---
name: agentic-context-learning
version: 1.0.0
description: Self-learning context engineering layer creating deterministic Tree-sitter code maps, persisting agent discoveries and architectural learnings across sessions, and exposing continuous memory via MCP.
industry: engineering
capabilities:
  - deterministic_code_mapping
  - agent_learning_persistence
  - cross_session_context_sync
  - mcp_context_retrieval
riskLevel: low
sensitiveActions: []
---

# Agentic Context Learning Skill

Inspired by local deterministic code mapping, persistent agent learning layers, and continuous context engineering frameworks (such as the open-source `Trail-Code` initiative).

## Role
Acts as the Principal Agentic Context Engineer and Long-Term Memory Architect. Solves the amnesia problem inherent in stateless LLM coding sessions by constructing local, deterministic code maps, continuously logging architectural breakthroughs and bug discoveries, and serving persistent context to agents via MCP so they never repeat past mistakes.

## Core Architectural Modules

### 1. Deterministic Local Code Maps (Graft Maps)
- **Zero API Dependency**: Uses native, local Tree-sitter AST parsers to index all repository symbols, function signatures, and call hierarchies in milliseconds without external cloud API calls or LLM token costs.
- **Incremental Cache**: Updates only modified files on Git commit or file save, ensuring instant lookup times.

### 2. Persistent Learnings Ledger (`.trail/learnings`)
Agents frequently waste tokens and time re-diagnosing known quirks, configuration gotchas, or architectural invariants.
- **Discovery Capture**: Automatically records key discoveries during development:
  - *Gotchas*: e.g., "Must use atomic file writes when modifying `storage/*.json` on Windows."
  - *Architectural Invariants*: e.g., "All sensitive actions must declare explicit entries in `sensitiveActions`."
  - *Workarounds*: e.g., "Use `cubic-bezier(0.16, 1, 0.3, 1)` for micro-interactions to prevent rubber-banding."
- **Team-Syncable Storage**: Persists insights into human-readable markdown and JSON files committed alongside the repository.

### 3. Cross-Session Memory Synchronization
- Injects relevant historical learnings into agent prompt contexts based on the active files and task goals.
- Deduplicates and ranks past learnings using recency and relevance scoring.

### 4. Model Context Protocol (MCP) Memory Server
- Exposes dynamic MCP tools for coding agents:
  - `get_code_map(path)`: Returns deterministic symbol definitions and caller trees.
  - `query_learnings(topic)`: Retrieves persisted repository insights and past resolutions.
  - `record_learning(category, insight, evidence)`: Stores a new validated finding into the persistent repository memory.

## Operational Workflow
1. **Repository Initialization**: Parse repository files into local deterministic code map.
2. **Context Retrieval on Task Start**: Query learnings ledger for context pertinent to the incoming task description.
3. **Continuous Insight Logging**: When an agent resolves a non-trivial bug or design challenge, write a structured learning entry.
4. **Verification & Commit**: Validate learnings for accuracy and persist to repository context layer.
