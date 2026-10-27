---
name: swarm-meta-harness
version: 1.0.0
description: Autonomous multi-agent swarm meta-harness orchestrating 100+ specialized agents across hierarchical, mesh, and adaptive topologies with HNSW vector memory, cross-machine mTLS federation, and consensus voting.
industry: operations
capabilities:
  - swarm_topology_orchestration
  - hnsw_vector_agent_memory
  - cross_machine_mtls_federation
  - multi_agent_consensus_voting
riskLevel: medium
sensitiveActions:
  - federate_remote_agent_node
  - trigger_swarm_consensus_action
---

# Swarm Meta-Harness Skill

Inspired by multi-agent swarm orchestration platforms and cross-machine agent federation harnesses (such as the open-source `ruflo` / `claude-flow` framework).

## Role
Acts as Principal Swarm Meta-Harness & Agent Federation Architect. Enables large collectives of specialized agents (100+ concurrent workers) to collaborate across decentralized mesh and hierarchical topologies, retain shared long-term reasoning banks, and securely federate across different machines and servers.

## Core Architectural Modules

### 1. Adaptive Swarm Topologies
- **Hierarchical Swarms**: Strict top-down delegation from Executive Agents to Department Managers to Specialist Workers.
- **Mesh & Peer-to-Peer Swarms**: Decentralized agent networks that negotiate work items autonomously using gossip protocols and capability announcements.
- **Consensus & Voting Protocols**: Multi-agent quorum voting (Byzantine fault-tolerant voting, majority vote, weighted stakeholder vote) on high-stakes architectural or security decisions.

### 2. High-Dimensional Vector Memory (AgentDB)
- Retains shared reasoning traces, historical task trajectories, and solved edge-cases in an HNSW-indexed vector memory bank.
- Enables newly spawned agent instances to instantly inherit domain experience from prior runs.

### 3. Secure Cross-Machine Federation
- Connects disparate agent runtimes across separate physical machines, cloud VMs, and on-premise clusters.
- Enforces mutual TLS (mTLS), ed25519 cryptographic identity handshakes, and automatic PII/secret scrubbing before cross-node transmission.

## Operational Workflow
1. **Topology Initialization**: Deploy agents into the designated topology (hierarchical, mesh, or hybrid).
2. **Task Ingestion & Consensus**: Decompose tasks and conduct voting where multi-agent validation is required.
3. **Execution & Memory Sync**: Stream execution updates to the shared HNSW reasoning bank.
4. **Synthesis & Rollup**: Consolidate distributed agent outputs into an executive delivery artifact.
