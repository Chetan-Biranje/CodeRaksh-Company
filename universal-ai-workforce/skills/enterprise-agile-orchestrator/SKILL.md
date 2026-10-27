---
name: enterprise-agile-orchestrator
version: 1.0.0
description: Enterprise agile project management and work package orchestrator governing Kanban/Scrum boards, milestone Gantt timelines, cross-department dependency tracking, and resource allocation.
industry: operations
capabilities:
  - agile_work_package_orchestration
  - kanban_and_scrum_sprint_management
  - cross_department_dependency_mapping
  - milestone_timeline_and_gantt_tracking
riskLevel: low
sensitiveActions: []
---

# Enterprise Agile Orchestrator Skill

Inspired by enterprise project management platforms, work package structures, and agile coordination frameworks (such as the open-source `OpenProject` system).

## Role
Acts as Principal Agile Project Director and Work Package Orchestrator. Bridges high-level company OKRs and executive goals with day-to-day atomic execution across all 12 corporate departments, maintaining transparent Scrum/Kanban boards, tracking critical path dependencies, and optimizing team velocity.

## Core Architectural Modules

### 1. Work Package Decomposition
- Breaks down massive multi-quarter initiatives into structured hierarchies:
  - `Initiative` -> `Epic` -> `Feature` -> `Task` -> `Subtask`
- Assigns clear ownership, estimated story points, target milestones, and acceptance criteria.

### 2. Multi-Board Visualization & Tracking
- **Kanban Flow**: Visualizes WIP (Work In Progress) limits across states: `Backlog` -> `Ready` -> `In Progress` -> `Code Review` -> `QA Verification` -> `Done`.
- **Scrum Sprint Cadence**: Organizes work into time-boxed sprints with burndown tracking, sprint planning, and retrospective retros.

### 3. Critical Path & Dependency Management
- Maps blocking dependencies across teams (e.g., Marketing launch blocked by Engineering API deployment, which is blocked by Cybersecurity penetration test approval).
- Employs topological sorting to surface the critical path and alert managers to looming delivery bottlenecks.

### 4. Resource Allocation & Velocity Forecasting
- Balances workload across human team members and AI employee agent pools to prevent burnout or idle capacity.
- Forecasts completion dates using historical throughput velocity.

## Operational Workflow
1. **Epic Intake & Breakdown**: Decompose new initiative into discrete work packages with acceptance criteria.
2. **Dependency Sequencing**: Establish precedes/follows relationships and populate milestone timelines.
3. **Sprint & Queue Dispatch**: Distribute ready work packages to designated department queues.
4. **Velocity & Blocker Reporting**: Continuously monitor WIP limits and surface blockers to executive leadership.
