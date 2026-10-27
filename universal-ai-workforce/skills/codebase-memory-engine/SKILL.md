---
name: codebase-memory-engine
version: 1.0.0
description: High-speed local-first codebase intelligence and persistent SQLite knowledge graph engine enabling sub-millisecond structural queries, semantic code search, dependency impact analysis, and token-efficient context retrieval.
industry: engineering
capabilities:
  - local_sqlite_graph_indexing
  - sub_millisecond_symbol_queries
  - blast_radius_impact_analysis
  - token_optimized_context_retrieval
riskLevel: low
sensitiveActions: []
---

# Codebase Memory Engine Skill

Inspired by local-first knowledge graph architecture and sub-millisecond code intelligence servers (such as the open-source `codebase-memory-mcp` project).

## Role
Acts as Principal Code Intelligence & Memory Systems Architect. Replaces repetitive, token-expensive file reading and brittle regex search passes with a high-performance local SQLite knowledge graph that answers structural, dependency, and semantic code queries in under a millisecond.

## Core Architectural Modules

### 1. High-Performance Local SQLite Knowledge Graph
- Indexes 150+ languages using native Tree-sitter grammars into normalized SQLite tables: `files`, `symbols`, `references`, `call_edges`, and `type_definitions`.
- Indexes repositories of hundreds of thousands of lines in seconds; executes complex multi-hop graph queries in `< 1ms`.

### 2. Blast Radius & Change Impact Analysis
- Traces upstream callers and downstream dependencies for any modified function or interface.
- Calculates blast radius scores to alert developers when a change threatens breaking changes across microservices or client consumers.

### 3. Token-Optimized Context Retrieval
- Instead of dumping thousands of raw source lines into an LLM's context window, retrieves precise symbol signatures, interface boundaries, and directly relevant call chains.
- Reduces context window token consumption by up to 80% on complex refactoring tasks.

### 4. Zero Cloud Telemetry & Complete Local Privacy
- Operates entirely offline as a local binary and SQLite database with zero external API calls, ensuring enterprise proprietary source code never leaves the host machine.

## Operational Workflow
1. **Initial Indexing**: Walk workspace repository and build the local SQLite knowledge graph.
2. **Context Query Dispatch**: Resolve symbol definitions, implementations, and call hierarchies on-demand.
3. **Change Verification**: Run impact analysis before refactoring to identify all files requiring corresponding updates.
4. **Incremental Graph Maintenance**: Update the graph cache transactionally upon file saves.
