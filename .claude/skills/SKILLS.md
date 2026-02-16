# Claude Skills - Review System

<details>
<summary><strong>Quick Start</strong> - Click to expand</summary>

## Available Skills

Three skills are available for automated review workflows:

| Skill | Command | Purpose |
|-------|---------|---------|
| **daily-review** | `/daily-review` | Process notes, sync tasks, generate daily summary |
| **weekly-review** | `/weekly-review` | Consolidate week's work, identify patterns |
| **product-review** | `/product-review [monthly\|quarterly]` | Extract productization insights from notes |

## Quick Test

```bash
# Test each skill
/daily-review
/weekly-review
/product-review monthly
```

</details>

---

<details>
<summary><strong>📅 Daily Review</strong> - Process notes and sync tasks</summary>

## Daily Review Skill

**Command**: `/daily-review`

### What It Does

Automates your daily workflow by:
1. Updating state tracking (`state/claude-state.md`)
2. Processing new notes from your vault
3. Extracting tasks to Todoist and Linear
4. Generating a daily summary

### When to Use

- Start or end of each workday
- After capturing multiple notes
- When you need task synchronization
- To prepare for weekly review

### Output

Creates: `daily-summary/YYYY-MM-DD.md`

Example output:
```markdown
# Daily Summary - 2026-02-15

## Session State
- Current Focus: Product research
- Active Tasks: 3 Todoist, 2 Linear
- Blockers: None

## Tasks Processed
- [ ] Research LLM observability tools → Todoist: 123456
- [ ] Interview defence contractor → Linear: PROJ-789

## Notes Created/Updated
- [[llm-monitoring-gaps]] - Market gap analysis
- [[defence-ai-requirements]] - Customer needs

## Insights
- Privacy concerns recurring theme
- Defence sector showing interest in air-gapped solutions
```

### Automation

**Cron Schedule**: Weekdays at 9:00 AM
```cron
0 9 * * 1-5 bun run review:daily
```

### Manual Execution

```bash
# Via skill
/daily-review

# Via script
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run review:daily
```

### Logs

```bash
tail -f /tmp/claude-daily-review.log
```

### Customization

Edit the script:
```
scripts/daily-review.ts
```

Modify:
- Note processing logic
- Task extraction patterns
- Summary format
- Integration mappings

</details>

---

<details>
<summary><strong>📊 Weekly Review</strong> - Consolidate and identify patterns</summary>

## Weekly Review Skill

**Command**: `/weekly-review`

### What It Does

Consolidates your week's work:
1. Collects all daily summaries from current week
2. Analyzes patterns and trends
3. Uses Claude for insight extraction
4. Archives daily summaries
5. Generates weekly summary

### When to Use

- End of each week (Friday recommended)
- Before monthly planning
- To identify productivity patterns
- For team status updates

### Output

Creates: `weekly-notes/YYYY-WWW.md`

Example output:
```markdown
# Weekly Review - Week 07, 2026

## Metrics
- Daily Summaries: 5
- Tasks Completed: 23
- Notes Created: 12
- Average Daily Focus Time: 6 hours

## Key Achievements
1. Identified LLM observability market gap
2. Connected with 3 defence contractors
3. Prototyped privacy-preserving eval framework

## Patterns Observed
- Privacy concerns mentioned daily
- Defence sector engagement increasing
- DevTools opportunities clustering

## Challenges & Blockers
- None this week (exceptional!)

## Consolidated Insights
- Clear market need for self-hosted LLM monitoring
- Defence sector has budget for privacy solutions
- Open-source projects maturing into products

## Next Week's Focus
1. Customer discovery (10 interviews)
2. Technical feasibility assessment
3. Competitive analysis deep-dive
```

### Automation

**Cron Schedule**: Fridays at 4:00 PM
```cron
0 16 * * 5 bun run review:weekly
```

### Manual Execution

```bash
# Via skill
/weekly-review

# Via script
bun run review:weekly
```

### Archive Process

Daily summaries are moved to:
```
notes-archive/YYYY-WWW Week Archive.md
```

### Pattern Recognition

Automatically identifies:
- Task completion velocity
- Common blockers
- Time allocation
- Recurring themes
- Focus area trends

### Logs

```bash
tail -f /tmp/claude-weekly-review.log
```

### Customization

Edit the script:
```
scripts/weekly-review.ts
```

Modify:
- Pattern detection algorithms
- Archive strategy
- Summary template
- Metric calculations

</details>

---

<details>
<summary><strong>🎯 Product Review</strong> - Extract market insights</summary>

## Product Review Skill

**Command**: `/product-review [monthly|quarterly]`

### What It Does

Analyzes your notes for **productization opportunities** in AI/ML/LLM:

1. Extracts weekly notes from the period
2. Performs keyword-based insight detection
3. Uses Claude for deep market analysis
4. Generates comprehensive product review
5. Creates Linear issues for opportunities
6. Produces strategic recommendations

### Focus Areas

<details>
<summary>🛠️ <strong>DevTools for AI/ML/LLM</strong></summary>

#### Market Segments
- **Observability**: LLM monitoring, tracing, debugging
- **Testing**: Evaluation frameworks, regression testing
- **Development**: SDKs, frameworks, IDE integrations
- **Deployment**: Infrastructure, scaling, orchestration

#### What to Capture in Notes
```markdown
Met with AI startup. They're struggling with LLM observability.
Current tools (Langfuse, LangSmith) require cloud connectivity.
#DevTools

**Opportunity**: Self-hosted LLM monitoring platform
**Market Size**: Medium (1000s of AI companies)
**Competition**: Limited self-hosted options
```

</details>

<details>
<summary>🔒 <strong>Privacy-Focused AI</strong></summary>

#### Market Segments
- **Federated Learning**: Train on distributed data
- **Secure Computation**: Multi-party ML
- **Data Protection**: Anonymization, PII removal
- **Compliance**: GDPR, HIPAA, industry regulations

#### What to Capture in Notes
```markdown
Healthcare provider needs HIPAA-compliant AI training.
Can't send patient data to OpenAI/Anthropic.
#Privacy #Enterprise

**Opportunity**: HIPAA-certified federated learning platform
**Market Size**: Large (healthcare AI market)
**Readiness**: Technical solution exists, needs packaging
```

</details>

<details>
<summary>🏢 <strong>Enterprise AI Solutions</strong></summary>

#### Market Segments
- **Small Business**: $100-$1K/month, self-service
- **Mid-Market**: $1K-$50K/month, team features
- **Large Enterprise**: $50K-$500K/month, governance
- **Industry-Specific**: Healthcare, Finance, Legal

#### What to Capture in Notes
```markdown
CFO wants visibility into AI spend across 50 teams.
No tools for AI cost allocation and chargeback.
#Enterprise

**Opportunity**: Enterprise AI cost management platform
**Market Size**: Enterprise (Fortune 500s)
**Similar to**: Cloud FinOps tools but for AI
```

</details>

<details>
<summary>🛡️ <strong>Defence & Security AI</strong></summary>

#### Market Segments
- **Threat Detection**: Cybersecurity, anomaly detection
- **Secure Deployment**: Air-gapped, classified environments
- **Adversarial ML**: Attack detection, model hardening
- **Intelligence**: Analysis, correlation, synthesis

#### What to Capture in Notes
```markdown
Defence contractor needs AI in air-gapped environment.
Can't connect to external APIs. Need local LLM deployment.
#Defence #Security

**Opportunity**: Classified AI infrastructure platform
**Market Size**: Enterprise (government/defence)
**Requirements**: CMMC, FedRAMP, IL5 compliance
```

</details>

<details>
<summary>🔬 <strong>Research → Product</strong></summary>

#### What to Look For
- Academic papers with commercial potential
- Open-source projects gaining traction
- Novel algorithms ready for packaging
- Emerging techniques not yet productized

#### What to Capture in Notes
```markdown
New paper on efficient model distillation (10x speedup).
Open-source implementation getting GitHub stars.
No commercial product yet.
#Research

**Opportunity**: Model compression SaaS
**Market**: All AI companies (cost reduction)
**Timing**: 6 months ahead of competition
```

</details>

### Output Structure

The product review generates:

```markdown
# Product Review - 2026-02

## Executive Summary
- Insights: 12 opportunities identified
- Market Trends: 5 major signals
- Top Opportunity: Self-hosted LLM observability

## Market Segments Analysis

### 🛠️ DevTools for AI/ML/LLM
**Opportunity 1**: Self-hosted LLM monitoring
- Market Size: Medium
- Readiness: MVP-ready
- Competition: Langfuse (cloud), LangSmith (proprietary)
- Revenue Potential: $5M ARR Year 1
- Source: [[weekly-note-2026-W06]], [[customer-meeting-notes]]

### [Additional segments...]

## Market Trends & Signals
1. Privacy-first AI gaining enterprise adoption
2. Defence sector increasing AI investment
3. Open-source LLM tools maturing
4. Compliance driving platform consolidation

## Prioritized Opportunities
1. Self-hosted LLM monitoring (DevTools + Privacy)
2. HIPAA-compliant federated learning (Privacy + Enterprise)
3. AI cost management platform (Enterprise)

## Strategic Recommendations
1. **Build**: Self-hosted LLM monitoring (fastest path)
2. **Partner**: Defence contractors for compliance expertise
3. **Watch**: Model compression research (6mo runway)

## Next Steps
- [ ] Customer discovery: 10 interviews
- [ ] Technical spike: Self-hosted architecture
- [ ] Competitive analysis: Langfuse vs. LangSmith
```

### Automation

**Cron Schedule**:
- **Monthly**: 1st of month at 10:00 AM
- **Quarterly**: Jan/Apr/Jul/Oct 1st at 10:00 AM

```cron
# Monthly
0 10 1 * * bun run review:product

# Quarterly
0 10 1 1,4,7,10 * bun run review:product:quarterly
```

### Manual Execution

```bash
# Monthly
/product-review monthly
bun run review:product

# Quarterly
/product-review quarterly
bun run review:product:quarterly
```

### Output Locations

- **Monthly**: `product-reviews/YYYY-MM-product-review.md`
- **Quarterly**: `product-reviews/YYYY-QQ-product-review.md`

### Integration

Automatically creates:
- **Linear Issues**: For high-priority opportunities
- **Todoist Tasks**: For research and discovery
- **Obsidian Receipts**: Linking sources to outputs

### Reference Materials

Deep market context available at:
```
.claude/skills/product-review/reference/market-segments.md
```

Contains:
- Market sizing methodology
- Competitive intelligence
- Go-to-market strategies
- Investment landscape
- Compliance requirements

### Logs

```bash
tail -f /tmp/claude-product-review.log
```

### Customization

Edit the script:
```
scripts/product-review.ts
```

Focus on specific sectors:
```typescript
const FOCUS_SECTORS = ["DevTools", "Privacy"];
insights = insights.filter(i => FOCUS_SECTORS.includes(i.category));
```

Modify analysis prompts:
```typescript
const analysisPrompt = `
  Analyze weekly notes for ${CUSTOM_CRITERIA}
  Focus on ${SPECIFIC_INDUSTRIES}
  Prioritize ${STRATEGIC_GOALS}
`;
```

</details>

---

## Progressive Understanding

<details>
<summary><strong>Level 1: Basic Usage</strong> - Just run the skills</summary>

### Getting Started

1. **Run daily review**:
   ```bash
   /daily-review
   ```

2. **Run weekly review**:
   ```bash
   /weekly-review
   ```

3. **Run product review**:
   ```bash
   /product-review monthly
   ```

That's it! The skills handle everything automatically.

</details>

<details>
<summary><strong>Level 2: Automation</strong> - Set up cron jobs</summary>

### Install Automated Reviews

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-cron.sh
```

This configures:
- Daily review: Weekdays at 9 AM
- Weekly review: Fridays at 4 PM
- Product review: Monthly on the 1st

### Verify Automation

```bash
crontab -l | grep claude
```

### Monitor Logs

```bash
tail -f /tmp/claude-*-review.log
```

</details>

<details>
<summary><strong>Level 3: Customization</strong> - Modify for your workflow</summary>

### Edit Skills

Each skill can be customized by editing its `SKILL.md`:

```bash
# Daily review
vim ~/.claude/skills/daily-review/SKILL.md

# Weekly review
vim ~/.claude/skills/weekly-review/SKILL.md

# Product review
vim ~/.claude/skills/product-review/SKILL.md
```

### Edit Scripts

Modify the underlying automation:

```bash
# Daily review logic
vim scripts/daily-review.ts

# Weekly review logic
vim scripts/weekly-review.ts

# Product review logic
vim scripts/product-review.ts
```

### Common Customizations

**Change review time**:
```bash
crontab -e
# Modify time in cron expression
```

**Filter product categories**:
```typescript
// In scripts/product-review.ts
const FOCUS_SECTORS = ["DevTools", "Enterprise"];
```

**Adjust summary format**:
```typescript
// In any review script, modify template strings
const summary = `# Custom Format...`;
```

</details>

<details>
<summary><strong>Level 4: Integration</strong> - Connect everything</summary>

### Todoist Integration

Configure in `.env`:
```bash
TODOIST_API_TOKEN=your-token-here
```

Tasks are automatically created with:
- Labels from note tags
- Due dates from context
- Project assignment

### Linear Integration

Configure in `.env`:
```bash
LINEAR_API_KEY=your-key-here
```

Issues are created with:
- Team assignment
- Labels and priority
- Markdown descriptions
- Backlinks to Obsidian

### Langfuse Observability

Track all LLM operations:
```bash
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_SECRET_KEY=your-secret-key
```

View traces:
```bash
bun run observability:snapshots TRACE_ID
```

### Webhook Real-time Sync

Start webhook server:
```bash
bun run dev webhooks -- --port 4100
```

Configure webhooks in:
- Todoist Developer Console
- Linear Workspace Settings
- Obsidian (if using remote vault)

</details>

<details>
<summary><strong>Level 5: Advanced</strong> - Build custom skills</summary>

### Create Your Own Skill

```bash
mkdir -p ~/.claude/skills/my-skill
```

Create `SKILL.md`:
```yaml
---
name: my-skill
description: What this skill does
allowed-tools: Read, Write, Bash
---

# My Custom Skill

Your instructions here...
```

### Use Agent SDK Tools

Wrap skills as TypeScript tools (see next section).

### Create Subagents

Define custom agents in `.claude/agents/`:
```yaml
---
name: my-agent
description: Specialized agent
model: sonnet
allowed-tools: Read, Grep
preload-skills: product-review
---

Custom agent instructions...
```

### Build Plugins

Package skills for distribution:
```
my-plugin/
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── hooks/
│   └── tool-use.sh
└── PLUGIN.md
```

</details>

---

## Claude Agent SDK Tools

<details>
<summary><strong>TypeScript Tool Wrappers</strong> - Use skills programmatically</summary>

### Tool Integration

Skills are also available as Claude Agent SDK tools in:
```
src/agent/tools/
├── daily-review.tool.ts
├── weekly-review.tool.ts
└── product-review.tool.ts
```

### Usage in Agent SDK

```typescript
import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { dailyReviewTool } from "./agent/tools/daily-review.tool.js";
import { weeklyReviewTool } from "./agent/tools/weekly-review.tool.js";
import { productReviewTool } from "./agent/tools/product-review.tool.js";

const agent = new Agent({
  tools: [
    dailyReviewTool,
    weeklyReviewTool,
    productReviewTool,
  ],
});

// Agent can now use review tools automatically
const result = await agent.run("Run the daily review and summarize");
```

### Programmatic Invocation

```typescript
// Direct tool calls
await dailyReviewTool.function();
await weeklyReviewTool.function();
await productReviewTool.function({ type: "monthly" });
```

See implementation details in the [Agent SDK Tools](#agent-sdk-tools-implementation) section below.

</details>

---

## Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

### Skill Not Found

**Error**: `Skill 'xxx' not found`

**Solutions**:
1. Check skill exists: `ls ~/.claude/skills/`
2. Verify SKILL.md present in skill directory
3. Restart Claude Code if you just created it

### Permission Denied

**Error**: `Permission denied executing script`

**Solutions**:
```bash
chmod +x scripts/*.ts
chmod +x scripts/*.sh
```

### Cron Job Not Running

**Solutions**:
1. Verify crontab: `crontab -l`
2. Check Bun path: `which bun`
3. Update cron with correct path
4. Check logs: `tail /tmp/claude-*-review.log`

### Integration Failures

**Solutions**:
1. Verify `.env` configuration
2. Test API credentials: `bun run dev doctor`
3. Check network connectivity
4. Review Langfuse traces for errors

### Empty Product Reviews

**Solutions**:
1. Ensure weekly notes exist
2. Add tags: `#DevTools`, `#Privacy`, etc.
3. Include market context in notes
4. Lower keyword matching thresholds

</details>

---

## Documentation Links

- **[REVIEW_PLAN](../../../claude-summary/REVIEW_PLAN.md)** - Complete methodology
- **[CRON_SCHEDULE](../../../claude-summary/CRON_SCHEDULE.md)** - Automation reference
- **[README_REVIEWS](../README_REVIEWS.md)** - In-depth guide
- **[AGENTS.md](../AGENTS.md)** - Agent operating covenant

---

*Skills created: 2026-02-15*
*Version: 1.0*
*Compatible with: Claude Code CLI, Claude.ai, Claude API*
