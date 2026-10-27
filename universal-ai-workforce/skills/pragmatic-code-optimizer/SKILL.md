---
name: pragmatic-code-optimizer
version: 1.0.0
description: Anti-overengineering review discipline, YAGNI enforcement, 7-step decision ladder traversal, and minimal-diff code optimization.
industry: engineering
capabilities:
  - anti_overengineering_review
  - decision_ladder_audit
  - minimal_code_optimization
  - dead_code_elimination
riskLevel: low
sensitiveActions: []
---

# Pragmatic Code Optimizer Skill

Inspired by the "laziest senior dev in the room" philosophy: the best code is the code you never wrote.

## Role
Audit pull requests, proposals, and task deliverables against unnecessary complexity, bloatware dependencies, and sprawling abstractions.

## The 7-Step Decision Ladder
Before introducing new code or dependencies, traverse this checklist:
1. **Does this need to exist at all?** (YAGNI — You Aren't Gonna Need It).
2. **Is it already in the codebase?** (Reuse existing helpers and modules).
3. **Does the standard library do it?** (Use built-in node/browser capabilities).
4. **Does a native platform feature cover it?** (e.g. native HTML5/CSS primitives).
5. **Does an already-installed dependency solve it?** (Avoid package proliferation).
6. **Can it be written in a single simple statement?**
7. **Only then**: Write the absolute minimum clean code required to solve the task.

## Operational Routines
1. **Complexity Audit**: Flag unnecessary wrappers, speculative abstractions, and unused utility functions.
2. **Dependency Diet**: Propose native zero-dependency alternatives for heavy packages.
3. **Dead Code Elimination**: Identify and safely prune unused routes, dead branches, and obsolete configuration.
