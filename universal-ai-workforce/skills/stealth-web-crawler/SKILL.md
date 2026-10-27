---
name: stealth-web-crawler
version: 1.0.0
description: Adaptive, resilient, and undetectable web scraping and crawling engine featuring stealth browser emulation, dynamic anti-bot bypass, and auto-healing DOM traversal.
industry: engineering
capabilities:
  - adaptive_dom_traversal
  - stealth_fingerprint_evasion
  - automated_content_extraction
  - resilient_crawler_pipeline
riskLevel: medium
sensitiveActions:
  - execute_network_scraping
  - bypass_bot_protection
---

# Stealth Web Crawler Skill

Inspired by resilient, adaptive web scraping and anti-bot evasion frameworks (such as the open-source `Scrapling` project).

## Role
Acts as the Lead Scraping & Data Extraction Engineer. Navigates complex, dynamic, JavaScript-heavy, and anti-bot-protected web targets to reliably extract structured datasets without fragility or breakage.

## Core Architectural Capabilities

### 1. Adaptive DOM Traversal & Auto-Healing Locators
Traditional scrapers break when web applications update CSS class names, randomize IDs, or change DOM hierarchy.
- **Semantic Locators**: Locates target elements using text anchors, sibling relationships, and semantic roles rather than brittle CSS selector chains.
- **Similarity Scoring**: When an exact selector fails, evaluates neighboring nodes using cosine similarity on attributes, tag depth, and text content to automatically heal the selector.
- **Dynamic Content Waiting**: Observes DOM mutations rather than using hardcoded sleep timers.

### 2. Stealth Anti-Bot & Fingerprint Evasion
- **Browser Fingerprint Masking**: Normalizes TLS client hello fingerprints (JA3/JA4), spoofed HTTP/2 headers, screen resolutions, and canvas/WebGL noise.
- **Navigator & Runtime De-cloaking**: Masks headless automation indicators (`navigator.webdriver`, `window.chrome`, permissions API inconsistencies, WebRTC leakage).
- **Human Interaction Emulation**: Simulates natural bezier mouse paths, organic typing cadence, and human-like scroll deceleration.

### 3. High-Throughput Extraction Pipeline
- **Hybrid Fetch Engine**: Switches between fast lightweight HTTP requests (for static or JSON endpoints) and headless browser contexts (for heavy SPAs requiring full JS evaluation).
- **Session & Cookie Rotation**: Seamlessly manages session lifecycles, user-agent pools, and proxy tunnels.
- **Polite Crawling & Exponential Backoff**: Honors target server rate limits and responds gracefully to HTTP 429/503 statuses with jittered exponential backoff.

## Operational Workflow
1. **Target Surface Reconnaissance**: Analyze target URL structure, response headers, and bot protection defenses (Cloudflare, Akamai, PerimeterX, Datadome).
2. **Strategy Selection**: Pick between fast HTTP fetching vs stealth browser session.
3. **Execution with Auto-Healing**: Query elements using resilient semantic rules. If a selector fails, trigger the auto-healing selector engine.
4. **Data Normalization & Delivery**: Clean, parse, and validate the extracted fields against the target JSON schema before outputting.
