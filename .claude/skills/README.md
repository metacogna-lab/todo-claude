# Claude Skills - Review System

This directory contains Claude Skills for the automated review system.

## Skills Available

| Skill | Command | Description |
|-------|---------|-------------|
| **daily-review** | `/daily-review` | Process notes, sync tasks, generate daily summary |
| **weekly-review** | `/weekly-review` | Consolidate week's work, identify patterns |
| **product-review** | `/product-review [monthly\|quarterly]` | Extract AI/ML/LLM productization insights |

## Quick Start

### 1. Test Skills

```bash
# Daily review
/daily-review

# Weekly review
/weekly-review

# Product review
/product-review monthly
```

### 2. Automate Reviews

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
./scripts/setup-cron.sh
```

### 3. View Documentation

See [SKILLS.md](SKILLS.md) for complete progressive reveal documentation.

## Structure

```
.claude/skills/
├── README.md                  ← You are here
├── SKILLS.md                  ← Progressive reveal documentation
├── daily-review/
│   └── SKILL.md              ← Daily review skill definition
├── weekly-review/
│   └── SKILL.md              ← Weekly review skill definition
└── product-review/
    ├── SKILL.md              ← Product review skill definition
    └── reference/
        └── market-segments.md ← Market intelligence reference
```

## Integration

Skills are also wrapped as Claude Agent SDK TypeScript tools:
```
src/agent/tools/
├── daily-review.tool.ts
├── weekly-review.tool.ts
├── product-review.tool.ts
└── index.ts
```

See [Agent Tools README](../../src/agent/tools/README.md) for programmatic usage.

## Related Documentation

- **[REVIEW_PLAN](../../../claude-summary/REVIEW_PLAN.md)** - Complete methodology
- **[CRON_SCHEDULE](../../../claude-summary/CRON_SCHEDULE.md)** - Automation schedule
- **[README_REVIEWS](../../README_REVIEWS.md)** - Product review deep dive

---

*Skills compatible with Claude Code CLI, Claude.ai, and Claude API*
