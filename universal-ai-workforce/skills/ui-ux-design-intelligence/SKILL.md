---
name: ui-ux-design-intelligence
version: 1.0.0
description: Comprehensive UI/UX design intelligence database and reasoning engine covering 79 visual styles, 192 product color palettes, 74 font pairings, 119 UX heuristics, and micro-interaction animation presets.
industry: product_design
capabilities:
  - design_intelligence_query
  - style_archetype_matching
  - accessible_palette_generation
  - ux_heuristic_evaluation
  - component_animation_specification
riskLevel: low
sensitiveActions: []
---

# UI/UX Design Intelligence Skill

Inspired by comprehensive design intelligence patterns and systematic styling taxonomies (such as the open-source UI/UX Pro Max initiative).

## Role
Acts as the Senior UI/UX Architect and Design System Director. Eliminates generic, uninspired AI user interfaces by providing authoritative, tokenized design archetypes, mathematically harmonious typography, context-aware color schemes, accessibility-first contrast validation, and high-fidelity interaction guidelines.

## Core Architectural Matrices

### 1. Style Archetypes (79 Styles / 50 Active Production Archetypes)
- **Bento Grid**: Modular card-based containers, subtle border highlights, clean hierarchical segmentation, soft drop-shadows.
- **Glassmorphism / Frosted Surface**: `backdrop-filter: blur(16px)`, translucent white/dark layers (`rgba(255,255,255,0.08)`), crisp 1px borders with gradient highlights.
- **Neo-Brutalism**: High contrast black borders (2-3px), unrounded or hard-cornered geometries, bold flat accent colors, hard drop shadows with zero blur offset.
- **Minimalist Editorial**: Generous whitespace, refined serif/sans-serif pairing, stark monochromatic base with a singular razor-sharp brand highlight.
- **Cyber / Dark Cyberpunk**: Deep midnight/obsidian backdrops (`#0a0b10`), neon luminescent accents (cyan `#00f2fe`, violet `#9d4edd`), subtle glowing boundary strokes, monospace tabular typography.
- **Claymorphism**: Multi-directional inner and outer shadows creating soft, tactile, 3D pillowy surfaces.

### 2. Contextual Color Profiles (192 Domain-Specific Palettes)
- **Enterprise Fintech**: Deep navy `#0f172a`, trust slate `#334155`, crisp jade emerald `#10b981`, neutral canvas `#f8fafc`.
- **Developer DevSecOps / Cloud**: Obsidian `#090d16`, electric violet `#8b5cf6`, cyber azure `#06b6d4`, alert amber `#f59e0b`.
- **HealthTech / Clinical**: Pure sterile teal `#0d9488`, calming sky `#0ea5e9`, clean bone `#f0fdfa`, high-contrast text `#134e4a`.
- **Consumer E-Commerce**: Rich espresso `#1c1917`, vibrant coral `#f43f5e`, warm cream `#fffbeb`, focus charcoal `#292524`.

### 3. Font Pairings & Typographic Hierarchy (74 Curated Pairs)
- **Modern Tech / SaaS**: `Inter` / `Geist` paired with `JetBrains Mono` for code and metrics.
- **Editorial / Premium**: `Playfair Display` or `Fraunces` headers paired with `Plus Jakarta Sans` body.
- **Clean Swiss Corporate**: `Work Sans` headers paired with `Open Sans` or `Roboto` body.
- Golden ratio type scale: `12px` (caption), `14px` (body-sm), `16px` (body), `20px` (h4), `24px` (h3), `32px` (h2), `48px` (h1), `64px` (display).

### 4. 119 UX Heuristics & Micro-Interactions
- **Nielsen-Norman Grounding**: System visibility, error recovery, immediate tactile feedback on all interactive touchpoints.
- **Motion Spec**: Fast micro-transitions (150ms-250ms `cubic-bezier(0.16, 1, 0.3, 1)`), zero spring overshoot on functional UI elements, intentional staggered reveals.
- **WCAG 2.2 Compliance**: Strict AA/AAA contrast ratios for text and graphical controls; persistent, high-visibility keyboard focus rings (`outline: 2px solid var(--focus-ring); outline-offset: 2px;`).

## Operational Workflows
1. **Design Archetype Ingestion**: Determine target audience and industry to assign the ideal visual archetype and color profile.
2. **Design Token Blueprinting**: Export CSS custom properties (`--bg-primary`, `--text-headline`, `--radius-lg`, `--shadow-elevation`).
3. **Component Spec Review**: Audit layout against the 119 UX heuristics to eliminate clutter, accessibility flaws, and generic placeholders.
4. **Motion & Interaction Delivery**: Specify GSAP / CSS keyframe timing curves for interactive elements.
