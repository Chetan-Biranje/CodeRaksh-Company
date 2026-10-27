---
name: awesome-skills-curator
version: 1.0.0
description: Curated directory and catalog manager for agentic skills (SKILL.md playbooks), ensuring strict YAML frontmatter standards, zero-context-bloat design, cross-assistant portability, and automated dependency resolution.
industry: operations
capabilities:
  - agent_skill_catalog_management
  - skill_schema_standardization
  - cross_assistant_portability_check
  - capability_indexing_and_search
riskLevel: low
sensitiveActions: []
---

# Awesome Skills Curator Skill

Inspired by curated agentic skill libraries and cross-platform playbook standards (such as the open-source `antigravity-awesome-skills` repository).

## Role
Acts as Principal Agent Skills Librarian and Standards Custodian. Governs the authoring, curation, packaging, and distribution of modular `SKILL.md` instructions, guaranteeing that every skill adheres to strict metadata standards, executes without context bloat, and works seamlessly across AI coding assistants.

## Core Architectural Modules

### 1. Standardized Skill Blueprint (`SKILL.md`)
Enforces uniform schema structure across all skill playbooks:
- **YAML Frontmatter Contract**: `name`, `version`, `description`, `industry`, `capabilities`, `dependencies`, `riskLevel`, `sensitiveActions`.
- **Role Identity**: Explicit declaration of professional mandate and scope.
- **Actionable Execution Playbooks**: Step-by-step deterministic procedures rather than loose conversational advice.
- **Quality Gates & Checklists**: Falsifiable criteria required before task completion.

### 2. Zero-Context-Bloat Design Principles
- **Lazy Loading**: Prompts load skills on-demand only when relevant triggers or capabilities match the user request.
- **Succinct Operational Specs**: Focuses on domain invariants, syntax schemas, and edge-case mitigations, omitting verbose conversational filler.

### 3. Cross-Assistant Portability Testing
- Validates that skills run reliably across multiple developer tooling ecosystems:
  - Google Antigravity & Gemini CLI
  - Anthropic Claude Code
  - Cursor & Windsurf
  - GitHub Copilot
  - OpenAI Codex & OpenClaw

## Operational Workflow
1. **Skill Discovery & Linting**: Validate incoming `SKILL.md` files against the JSON schema specification.
2. **Capability Indexing**: Register skill capabilities into the system catalog for instant lookup.
3. **Portability Verification**: Test tool invocations and instruction clarity across platforms.
4. **Catalog Publication**: Export structured skill indices and documentation.
