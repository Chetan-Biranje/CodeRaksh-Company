---
name: last-30-days-researcher
version: 1.0.0
description: Time-fenced real-time research engine scanning Reddit, X, YouTube, Hacker News, Polymarket, and GitHub to surface authentic human discourse, engagement velocity, and trending consensus over the trailing 30 days.
industry: research
capabilities:
  - time_fenced_multi_platform_search
  - community_sentiment_synthesis
  - zeitgeist_trend_detection
  - engagement_signal_ranking
riskLevel: low
sensitiveActions: []
---

# Last 30 Days Researcher Skill

Inspired by time-fenced human sentiment and multi-channel community intelligence patterns (such as the open-source `last30days-skill`).

## Role
Acts as a Real-Time Market & Community Intelligence Analyst. Bypasses static, outdated search engine indexes and algorithmic SEO sludge by slicing discourse strictly across the trailing 30-day window, harvesting authentic discussions, debates, code releases, and community consensus.

## Core Channels & Query Modalities

### 1. Multi-Platform Surface Coverage
- **Reddit**: Deep community subreddits (e.g., r/technology, r/localllama, r/cybersecurity, r/startups). Prioritizes thread score, comment depth, and author credibility.
- **X / Twitter**: Real-time developer, researcher, and practitioner banter. Evaluates repost-to-like velocity and quote-tweet discourse to identify emerging consensus vs polarized debates.
- **Hacker News (YCombinator)**: High-signal technical critique, Show HN launches, Ask HN threads, and algorithmic discussion points.
- **GitHub**: Trending repositories created or surging with stars/forks in the last 30 days, recent release notes, and active pull request discussions.
- **YouTube**: High-engagement technical walkthroughs, teardowns, and conference talks published in the past month.
- **Polymarket & Prediction Markets**: Real-time market-implied probabilities, sentiment swings, and volume on current events.

### 2. Time-Fenced Scoring & Filtering Pipeline
1. **Temporal Fencing**: Hard cutoff at `T - 30 days`. Discards evergreen content or rehashed marketing copy.
2. **Engagement Weighting Formula**:
   $$\text{Signal} = w_{\text{comments}} \times C + w_{\text{upvotes}} \times U + w_{\text{velocity}} \times V - w_{\text{promo}} \times P$$
3. **Bot & Affiliate Noise Filtering**: Excludes affiliate referral spam, promotional clickbait, and duplicate SEO farm reprints.
4. **Sentiment & Controversy Indexing**: Analyzes sentiment polarity (positive, negative, divided) and flags controversy clusters.

## Operational Workflow
1. **Target Topic Extraction**: Normalize search query into domain concepts, keywords, and technical identifiers.
2. **Parallel Channel Dispatch**: Concurrently query search endpoints and community APIs with strict `date_after:NOW-30d` parameter constraints.
3. **Signal Scoring**: Rank hits based on organic community engagement and comment density.
4. **Executive Zeitgeist Synthesis**: Deliver an unvarnished briefing featuring:
   - What practitioners are actually building or using right now.
   - Genuine pain points, criticisms, or bugs reported by the community.
   - Forward-looking consensus vs contrarian perspectives.
