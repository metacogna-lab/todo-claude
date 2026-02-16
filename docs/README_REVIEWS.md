# Claude Review System - Product Intelligence & Market Analysis

## Overview

This automated review system analyzes your weekly notes to extract **productization opportunities** in the AI/ML/LLM sector, with a focus on:

- 🛠️ **DevTools for AI/ML/LLM** (observability, testing, frameworks)
- 🔒 **Privacy-Focused AI Tools** (federated learning, secure computation)
- 🏢 **Enterprise AI Solutions** (SMB to large enterprise)
- 🛡️ **Defence & Security AI** (government, high-security applications)
- 🔬 **Cutting-Edge Research → Product** (commercialization opportunities)

---

## Quick Start

### 1. Setup Environment

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear

# Ensure dependencies are installed
bun install

# Verify configuration
bun run dev doctor
```

### 2. Install Automated Reviews (Cron Jobs)

```bash
./scripts/setup-cron.sh
```

This will configure:
- **Daily Review** (weekdays at 9:00 AM)
- **Weekly Review** (Fridays at 4:00 PM)
- **Monthly Product Review** (1st of each month at 10:00 AM)
- **Quarterly Product Review** (Jan/Apr/Jul/Oct 1st at 10:00 AM)

### 3. Run Manual Reviews

```bash
# Test daily review
bun run review:daily

# Test weekly review
bun run review:weekly

# Test monthly product review
bun run review:product

# Test quarterly product review
bun run review:product:quarterly
```

---

## Review Types

### 📅 Daily Review (10-15 minutes)

**Purpose:** Maintain daily workflow, capture insights, sync tasks

**Process:**
1. Updates `state/claude-state.md` with session state
2. Processes new notes in vault root
3. Extracts actionable tasks → Todoist/Linear
4. Generates daily summary

**Output:** `daily-summary/YYYY-MM-DD.md`

**When:** Every weekday at 9:00 AM (automated) or on-demand

---

### 📊 Weekly Review (30-45 minutes)

**Purpose:** Consolidate week's work, identify patterns, archive completed items

**Process:**
1. Collects all daily summaries from the week
2. Analyzes patterns (task completion, blockers, themes)
3. Uses Claude to extract key achievements
4. Archives daily summaries to `notes-archive/`
5. Generates weekly summary

**Output:** `weekly-notes/YYYY-WWW.md`

**When:** Every Friday at 4:00 PM (automated) or on-demand

---

### 🎯 Product Review (2-3 hours)

**Purpose:** Extract productization insights and market opportunities from weekly notes

**Focus Areas:**

#### DevTools for AI/ML/LLM
- Development frameworks and SDKs
- Observability and monitoring tools
- Testing and evaluation platforms
- CI/CD for ML pipelines
- Model deployment infrastructure

#### Privacy-Focused AI
- Federated learning platforms
- Privacy-preserving ML techniques
- Secure multi-party computation
- Differential privacy tools
- Data anonymization solutions

#### Enterprise AI Solutions
- **Small Business:** Self-service AI tools
- **Mid-Market:** Team collaboration AI
- **Large Enterprise:** Governance, compliance, audit
- **Industry-Specific:** Healthcare, Finance, Legal AI

#### Defence & Security AI
- Threat detection and analysis
- Secure AI deployment in air-gapped environments
- Adversarial ML protection
- Intelligence gathering and synthesis
- Cybersecurity automation

#### Research → Product
- Academic research ready for commercialization
- Novel algorithms with market potential
- Emerging techniques gaining traction
- Open-source projects at inflection point

**Process:**
1. Extracts weekly notes from period
2. Performs keyword analysis for initial insights
3. Uses Claude for deep market analysis
4. Generates comprehensive product review document
5. Creates Linear issues for high-priority opportunities
6. Produces actionable recommendations

**Output:** `product-reviews/YYYY-MM-product-review.md` (monthly)
**Output:** `product-reviews/YYYY-QQ-product-review.md` (quarterly)

**When:**
- **Monthly:** 1st of each month at 10:00 AM
- **Quarterly:** Jan 1, Apr 1, Jul 1, Oct 1 at 10:00 AM

---

## Product Review Output Structure

Each product review contains:

### 1. Executive Summary
- Key findings and metrics
- Number of opportunities identified
- Market trends summary

### 2. Market Segment Analysis
Detailed breakdown for each category:
- Specific opportunities identified
- Market size assessment
- Technical readiness level
- Competitive landscape analysis
- Revenue potential
- Implementation complexity
- Time to market estimate

### 3. Market Trends & Signals
- Emerging patterns in AI/ML/LLM space
- Competitive movements
- Technology shifts
- Customer demand signals

### 4. Prioritized Opportunities
Ranked by:
- Market size and growth
- Technical feasibility
- Competitive positioning
- Time to market
- Revenue potential
- Strategic fit

### 5. Strategic Recommendations
- Investment decisions
- Partnership opportunities
- Build vs. buy analysis
- Go-to-market strategies

### 6. Next Steps & Action Items
- Research tasks
- Customer discovery
- Prototyping priorities
- Partnership outreach

---

## Example Use Cases

### Use Case 1: Identifying DevTools Opportunity

**Weekly Note Entry:**
> Noticed that Langfuse observability is critical but lacks integration with local development. Developers struggle to debug LLM applications without production-like traces.

**Product Review Extraction:**
- **Category:** DevTools
- **Opportunity:** Local LLM development observability platform
- **Market Size:** Medium (developer tools)
- **Readiness:** MVP-ready
- **Competition:** Langfuse (cloud-only), LangSmith (proprietary)
- **Differentiation:** Self-hosted, privacy-first, IDE integration

**Action Items:**
- [ ] Build prototype with VS Code extension
- [ ] Interview 10 LLM developers
- [ ] Assess open-source vs. commercial model

---

### Use Case 2: Privacy AI Opportunity

**Weekly Note Entry:**
> Defence contractor mentioned need for AI training on classified data without centralizing datasets. Current solutions require security clearances and dedicated infrastructure.

**Product Review Extraction:**
- **Category:** Privacy + Defence
- **Opportunity:** Federated learning for classified environments
- **Market Size:** Enterprise (defence contractors)
- **Readiness:** Research stage
- **Competition:** Custom in-house solutions, academic tools
- **Differentiation:** Production-ready, compliance-certified

**Action Items:**
- [ ] Research CMMC and FedRAMP requirements
- [ ] Partner with defence-focused VC
- [ ] Build SBIR grant proposal

---

### Use Case 3: Enterprise AI Governance

**Weekly Note Entry:**
> Multiple enterprise clients asking about AI usage tracking, cost allocation, and compliance across teams. No good solution exists for multi-tenant AI governance.

**Product Review Extraction:**
- **Category:** Enterprise
- **Opportunity:** AI governance and cost management platform
- **Market Size:** Large enterprise
- **Readiness:** MVP-ready
- **Competition:** FinOps tools (not AI-specific), custom dashboards
- **Differentiation:** AI-native, multi-LLM support, compliance built-in

**Action Items:**
- [ ] Create competitive matrix
- [ ] Design PoC for Fortune 500 pilot
- [ ] Estimate ARR potential

---

## Integration with Todoist/Linear

Product reviews automatically create:

### Todoist Tasks
- Research tasks (competitive analysis, customer discovery)
- Follow-up actions (meetings, prototypes)
- Recurring review tasks

### Linear Issues
- Feature opportunities (new product ideas)
- Partnership opportunities (strategic relationships)
- Technical spikes (feasibility assessments)

### Obsidian Notes
- Comprehensive review documents
- Cross-referenced insights
- Source note tracking

---

## Monitoring & Optimization

### Check Review Status

```bash
# View cron jobs
crontab -l

# Check logs
tail -f /tmp/claude-product-review.log

# List generated reviews
ls -lh /Users/nullzero/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/claude-summary/product-reviews/
```

### Optimize Review Process

1. **Improve Note Quality:**
   - Tag notes with categories (#DevTools, #Privacy, #Enterprise)
   - Include market signals explicitly
   - Note competitor movements

2. **Enhance Claude Analysis:**
   - Provide more context in weekly notes
   - Link to external research
   - Include customer quotes/feedback

3. **Refine Opportunity Criteria:**
   - Adjust market size thresholds
   - Update competitive analysis templates
   - Customize readiness levels

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Obsidian Vault                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Daily Notes  │→ │ Weekly Notes │→ │ Product  │  │
│  │              │  │              │  │ Reviews  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Claude Agent SDK (Analysis)               │
│  ┌──────────────────────────────────────────────┐   │
│  │ • Pattern recognition                        │   │
│  │ • Market analysis                            │   │
│  │ • Competitive intelligence                   │   │
│  │ • Opportunity prioritization                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│             Task Management (Output)                │
│  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Todoist   │  │  Linear  │  │  Obsidian      │  │
│  │  (Tasks)   │  │ (Issues) │  │  (Receipt)     │  │
│  └────────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Advanced Configuration

### Custom Analysis Prompts

Edit `scripts/product-review.ts` to customize Claude's analysis:

```typescript
const analysisPrompt = `
PRODUCT REVIEW & MARKET ANALYSIS - ${period}

// Add custom instructions here
// Modify focus areas
// Adjust output format
`;
```

### Filter Specific Sectors

Focus on specific market segments:

```typescript
// In product-review.ts
const FOCUS_SECTORS = ["DevTools", "Privacy"]; // Exclude others

insights = insights.filter(i => FOCUS_SECTORS.includes(i.category));
```

### Integration with External Data

Enhance reviews with external market data:

```typescript
// Add API calls to:
// - Crunchbase (funding data)
// - GitHub (open-source trends)
// - Product Hunt (product launches)
// - LinkedIn (hiring trends)
```

---

## Troubleshooting

### No Opportunities Detected

**Issue:** Product review finds no opportunities

**Solutions:**
1. Ensure weekly notes contain market-related content
2. Add explicit tags (#DevTools, #Privacy, etc.)
3. Lower keyword matching thresholds
4. Manually trigger Claude analysis

### Claude Analysis Incomplete

**Issue:** Capture workflow times out or incomplete

**Solutions:**
1. Check Langfuse traces for errors
2. Reduce number of weekly notes analyzed
3. Increase API timeout settings
4. Split into multiple capture calls

### Duplicate Insights

**Issue:** Same opportunity appears multiple times

**Solutions:**
1. Improve deduplication logic
2. Consolidate similar weekly notes before review
3. Use more specific opportunity descriptions

---

## Roadmap

### Near-Term Enhancements
- [ ] Automated competitive analysis via web scraping
- [ ] Integration with market research APIs
- [ ] Customer sentiment analysis from notes
- [ ] Automated SWOT analysis generation

### Long-Term Vision
- [ ] Real-time opportunity detection (not just reviews)
- [ ] Predictive market trend modeling
- [ ] Automated due diligence reports
- [ ] Partnership matching AI

---

## Related Documentation

- [[REVIEW_PLAN]] - Detailed review methodology
- [[CRON_SCHEDULE]] - Automation schedule reference
- [AGENTS.md](../AGENTS.md) - Agent operating covenant
- [README.md](../README.md) - Main project documentation

---

*Version: 1.0*
*Last Updated: 2026-02-15*
*Maintained by: Claude Obsidian-Todoist-Linear Assistant*
