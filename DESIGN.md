# 🎨 CodeRaksh Company — Design System & UI/UX Guidelines

> **Document Version:** 3.0.0  
> **Aesthetic Theme:** Deep Cyber Slate · High-Trust Enterprise · Human Warmth  
> **Applies to:** Executive Cyber Dashboard (`dashboard/`), Client Portal (`portal/`), and CLI  

---

## 1. Design Philosophy & Aesthetic Pillars

### A. High-Trust Cyber Defense
Cyber security interfaces must radiate absolute reliability, precision, and confidence. We avoid juvenile matrix-green stereotypes and instead use a sophisticated **curated palette of deep obsidian slate, electric cyan, and clean emerald**.

### B. "Full Human Touch" (Empathy & Clarity)
Automation must never feel cold, alienating, or intimidating. 
- Personas have human names and warm, encouraging status indicators.
- Notifications celebrate team wins (e.g. "🎉 Proposal Request Received!").
- Error messages provide constructive next steps rather than blunt error codes.

---

## 2. Design Tokens

### Color Palette
```css
/* Background Surfaces */
--bg-dark:       #070b13;  /* Deepest obsidian canvas */
--bg-sidebar:    #0b111d;  /* Structured sidebar background */
--bg-card:       rgba(16, 24, 40, 0.75); /* Glassmorphic panel base */
--bg-card-hover: rgba(22, 34, 56, 0.90); /* Interactive elevation */

/* Accent & Status Colors */
--accent-cyan:    #00f0ff;  /* Primary brand glow & cyber highlight */
--accent-emerald: #10b981;  /* System operational, approved, passed */
--accent-indigo:  #6366f1;  /* Secondary intelligence & AI badges */
--accent-amber:   #f59e0b;  /* Warning, overdue, attention required */
--accent-rose:    #f43f5e;  /* Critical alert, blocked PR, vulnerability */

/* Typography Colors */
--text-main:     #f8fafc;  /* 900+ high-contrast readable white */
--text-muted:    #94a3b8;  /* Secondary descriptions & subtitles */
--text-faint:    #64748b;  /* Metadata, timestamps, table headers */
```

### Typography Scale
- **Display Headings:** `Plus Jakarta Sans`, 800 ExtraBold, letter-spacing `-1.5px`
- **Section Headers:** `Plus Jakarta Sans`, 700 Bold, letter-spacing `-0.5px`
- **Body Text:** `Plus Jakarta Sans`, 400 Regular & 500 Medium, `line-height: 1.6`
- **Code / Metrics / Terminal:** `JetBrains Mono`, 500 Medium & 700 Bold

---

## 3. Component Specifications

### 1. Metric Cards (KPI Gauges)
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`
- **Glassmorphism:** `backdrop-filter: blur(12px)`
- **Hover Micro-interaction:** `transform: translateY(-2px)`, subtle cyan/emerald box shadow.
- **Progress Indicator:** Horizontal gradient bar (`#00f0ff` to `#10b981`).

### 2. Human Persona Cards
- **Avatar:** Circular badge with gradient border and distinct emoji icon.
- **Name & Role Hierarchy:**
  - Name: 14px 700 Bold
  - Role: 11px 600 SemiBold in `--accent-cyan`
- **Status Indicator:** Glowing green dot with `pulse` animation for active agents.

### 3. Interactive Webhook Simulator Console
- **Background:** Monochromatic `#05080f` high-contrast terminal black.
- **Font:** `JetBrains Mono`, 12px, syntax highlighted with cyan/emerald outputs.
- **Status Pills:** Dynamic status pill transitioning from amber (Processing) to emerald (Success 200 OK).

---

## 4. Responsive Breakpoints

| Breakpoint | Target Devices | Layout Adaptation |
|---|---|---|
| **> 1200px** | Desktop Displays | Full sidebar + 4-column metrics grid + 2-column split feed |
| **768px – 1199px** | Tablets & Laptops | 2-column metrics grid + vertical split collapse |
| **< 768px** | Mobile Handsets | Top mobile navigation bar + single-column stacked cards |
