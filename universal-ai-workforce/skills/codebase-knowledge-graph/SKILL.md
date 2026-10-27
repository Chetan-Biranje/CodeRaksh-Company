---
name: codebase-knowledge-graph
version: 1.0.0
description: Transforms complex codebases into interactive semantic knowledge graphs combining AST static analysis, domain clustering, cross-file dependency call-trees, and guided architecture tours.
industry: engineering
capabilities:
  - ast_knowledge_graph_synthesis
  - semantic_domain_mapping
  - dependency_flow_analysis
  - guided_architecture_tours
riskLevel: low
sensitiveActions: []
---

# Codebase Knowledge Graph Skill

Inspired by codebase-to-knowledge-graph pipelines, AST topological mapping, and semantic architecture synthesis frameworks (such as the open-source `Understand-Anything` project).

## Role
Acts as Principal Codebase Topology & Semantic Graph Architect. Ingests raw multi-language source repositories, parses their syntax trees, maps cross-file dependencies, and synthesizes structured, domain-clustered knowledge graphs that allow both AI agents and human engineers to navigate and understand complex legacy architectures in minutes.

## Core Architectural Modules

### 1. Multi-Language AST Parsing & Symbol Extraction
- Uses static analysis parsers (Tree-sitter) across TypeScript, JavaScript, Python, Go, Rust, Java, C++, and SQL.
- Extracts fine-grained entities: modules, classes, functions, interfaces, exported symbols, imported bindings, and API endpoint routes.

### 2. Semantic Domain Clustering
Standard raw dependency graphs result in illegible "hairballs" with thousands of overlapping edges.
- **Domain Segmentation**: Groups related files and functions into logical functional domains:
  - `Authentication & Identity` (OAuth, JWT, session stores)
  - `Data Ingestion & Pipelines` (ETL, streaming, database adapters)
  - `Billing & Commerce` (Stripe, webhooks, invoice calculations)
  - `Task Orchestration & State` (Workers, schedulers, pub/sub queues)
- **Topological Abstraction**: Allows zooming from high-level domain relationships down to single-function invocation paths.

### 3. Cross-Boundary Dependency Call-Trees
- Traces execution flows through synchronous function calls, asynchronous event emitters, HTTP/gRPC client invocations, and database transactions.
- Flags circular dependencies, dead code paths, and architectural layering violations.

### 4. Guided Architecture Tours & Semantic Search
- **Guided Tours**: Generates step-by-step walkthroughs explaining end-to-end lifecycles (e.g., "From User Registration Request to Database Persistence").
- **Semantic Code Discovery**: Enables natural language queries over the graph: *"Where are secrets decrypted before API dispatch?"*

## Operational Workflow
1. **Repository Ingestion**: Traverse directory tree, ignore build artifacts and dependencies (`node_modules`, `dist`, `.git`).
2. **AST Extraction**: Parse source files into structured symbol tables and call edges.
3. **Domain Clustering & Graph Construction**: Cluster components by business logic and compute edge weights.
4. **Graph Serialization & Visualization**: Emit JSON graph payloads and interactive visual node-link diagrams.
