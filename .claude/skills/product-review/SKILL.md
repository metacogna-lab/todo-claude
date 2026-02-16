---
name: product-review
description: Analyze weekly notes for productization opportunities in AI/ML/LLM sectors (DevTools, Privacy, Enterprise, Defence, Research). Extracts market insights and strategic recommendations. Use for monthly/quarterly product analysis.
disable-model-invocation: false
argument-hint: [monthly|quarterly]
allowed-tools: Bash(bun *), Read, Write
context: fork
agent: general-purpose
---

# Product Review - Market Intelligence & Productization Analysis

Analyzes your weekly notes to extract **productization opportunities** in AI/ML/LLM across multiple sectors.

## Focus Areas

This review targets five key market segments:

### 🛠️ DevTools for AI/ML/LLM
- Development frameworks and SDKs
- Observability and monitoring tools (Langfuse, LangSmith alternatives)
- Testing and evaluation platforms
- CI/CD for ML pipelines
- Model deployment infrastructure

### 🔒 Privacy-Focused AI Tools
- Federated learning platforms
- Privacy-preserving ML techniques
- Secure multi-party computation
- Differential privacy tools
- Data anonymization solutions

### 🏢 Enterprise AI Solutions
- **Small Business**: Self-service AI tools
- **Mid-Market**: Team collaboration AI
- **Large Enterprise**: Governance, compliance, audit
- **Industry-Specific**: Healthcare, Finance, Legal AI

### 🛡️ Defence & Security AI
- Threat detection and analysis
- Secure AI deployment (air-gapped environments)
- Adversarial ML protection
- Intelligence gathering and synthesis
- Cybersecurity automation

### 🔬 Research → Product
- Academic research ready for commercialization
- Novel algorithms with market potential
- Emerging techniques gaining traction
- Open-source projects at inflection point

## Running the review

### Monthly Product Review
```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run review:product
```

Or with the skill:
```bash
/product-review monthly
```

### Quarterly Product Review
```bash
bun run review:product:quarterly
```

Or with the skill:
```bash
/product-review quarterly
```

## What gets analyzed

The review processes:
- All weekly notes from the period (month or quarter)
- Keyword-based initial insight extraction
- Deep Claude-powered market analysis
- Competitive landscape assessment
- Technical readiness evaluation

## Output structure

### Executive Summary
- Key findings and opportunity count
- Market trends overview
- Strategic highlights

### Market Segment Analysis
For each category (DevTools, Privacy, Enterprise, Defence, Research):
- **Specific opportunities** identified from notes
- **Market size** assessment (Small/Medium/Large/Enterprise)
- **Technical readiness** level (Research/Prototype/MVP/Production)
- **Competitive landscape** analysis
- **Revenue potential** estimation
- **Time to market** estimate
- **Source notes** with cross-references

### Market Trends & Signals
- Emerging patterns in AI/ML/LLM space
- Competitive movements
- Technology shifts
- Customer demand signals

### Prioritized Opportunities
Ranked by:
- Market size and growth potential
- Technical feasibility
- Competitive positioning
- Time to market
- Revenue potential
- Strategic fit

### Strategic Recommendations
- Investment decisions
- Partnership opportunities
- Build vs. buy analysis
- Go-to-market strategies

### Next Steps & Action Items
- Research tasks
- Customer discovery priorities
- Prototyping recommendations
- Partnership outreach

## Output location

### Monthly
```
/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/product-reviews/YYYY-MM-product-review.md
```

### Quarterly
```
/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/product-reviews/YYYY-QQ-product-review.md
```

## How to capture insights for review

Tag your notes with market signals:

```markdown
## Customer Meeting Notes

Discussed need for **LLM observability** in air-gapped environments.
Current tools require cloud connectivity.

#DevTools #Defence
**Opportunity**: Self-hosted LLM monitoring
**Market**: Defence contractors + enterprises
**Readiness**: MVP-ready
```

Use these tags in your weekly notes:
- `#DevTools` - Development tools
- `#Privacy` - Privacy-preserving AI
- `#Enterprise` - B2B solutions
- `#Defence` - Government/military
- `#Research` - Academic commercialization

## Integration & automation

The product review:
- **Analyzes** weekly notes using Claude Agent SDK
- **Creates** Linear issues for high-priority opportunities
- **Generates** Todoist tasks for research/discovery
- **Writes** receipts linking sources to outputs
- **Tracks** opportunities via Langfuse traces

## Automated schedule

- **Monthly**: 1st of each month at 10:00 AM
- **Quarterly**: Jan 1, Apr 1, Jul 1, Oct 1 at 10:00 AM

See [[CRON_SCHEDULE]] for automation details.

## Review logs

Check execution logs:
```bash
# Monthly
tail -f /tmp/claude-product-review.log

# View all reviews
ls -lh /Users/nullzero/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/claude-summary/product-reviews/
```

## Opportunity assessment criteria

Each opportunity is evaluated on:

| Criteria | Description |
|----------|-------------|
| **Category** | DevTools, Privacy, Enterprise, Defence, or Research |
| **Market Size** | Small, Medium, Large, or Enterprise scale |
| **Readiness** | Research, Prototype, MVP, or Production-ready |
| **Competition** | Competitive landscape and differentiation |
| **Revenue** | Potential ARR/revenue projections |
| **Complexity** | Implementation difficulty (1-5 scale) |
| **Time to Market** | Estimated months to launch |

## Advanced usage

### Focus on specific sectors

Edit the product review script to filter categories:
```typescript
const FOCUS_SECTORS = ["DevTools", "Privacy"];
insights = insights.filter(i => FOCUS_SECTORS.includes(i.category));
```

### Custom analysis prompts

Modify the Claude analysis in `scripts/product-review.ts` to add:
- Industry-specific criteria
- Custom competitive analysis
- Regional market considerations
- Technology stack preferences

## Reference materials

For detailed market segment information, see:
- [Market Segments Reference](reference/market-segments.md)

## Customization

To modify the review logic, edit:
```
/Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/product-review.ts
```

To customize output templates, modify the `generateProductReviewDocument()` function.

## Related skills

- `/daily-review` - Daily task processing
- `/weekly-review` - Weekly consolidation

## Documentation

- [[REVIEW_PLAN]] - Complete review methodology
- [[CRON_SCHEDULE]] - Automation reference
- [README_REVIEWS.md] - In-depth product review guide
