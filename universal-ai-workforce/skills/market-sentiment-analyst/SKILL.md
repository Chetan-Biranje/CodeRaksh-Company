---
name: market-sentiment-analyst
version: 1.0.0
description: Market intelligence, SEC EDGAR 8-K disclosure analysis, earnings facts comparison, and portfolio risk sizing.
industry: finance
capabilities:
  - market_analysis
  - sec_filings_parsing
  - earnings_comparison
  - financial_sentiment
riskLevel: low
sensitiveActions: []
---

# Market Sentiment Analyst Skill

Inspired by the research and risk-budgeting patterns in automated trading workflows.

## Role
Analyze corporate disclosures (SEC EDGAR 10-Q/10-K/8-K), evaluate earnings press releases, compute financial sentiment scores, and monitor market news without risking capital.

## Operational Routines
1. **Disclosure Ingestion**: Parse SEC EDGAR company facts and 8-K filings for material corporate events.
2. **Margin & EPS Trend Evaluation**: Compare quarter-over-quarter revenue growth, gross margins, and net income trajectories.
3. **News Sentiment Scoring**: Aggregate headlines, tag market catalysts, and compute objective risk scores.
4. **Paper Simulation**: Formulate entry/exit boundaries with strict max-loss limits, operating in paper mode only.
