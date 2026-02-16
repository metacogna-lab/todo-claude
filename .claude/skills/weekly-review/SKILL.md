---
name: weekly-review
description: Run weekly review to consolidate daily summaries, identify patterns, archive completed work, and generate weekly insights. Use when user asks to "run weekly review", "summarize this week", or at end of week.
disable-model-invocation: false
allowed-tools: Bash(bun *), Read, Write
context: fork
agent: general-purpose
---

# Weekly Review

Consolidates the week's daily summaries into patterns, insights, and a comprehensive weekly report.

## What this does

1. Collects all daily summaries from the current week
2. Analyzes patterns (task completion, blockers, themes)
3. Uses Claude to extract key achievements and insights
4. Archives daily summaries to `notes-archive/`
5. Generates weekly summary document

## Running the review

Execute the weekly review script:

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run review:weekly
```

## Output location

The weekly summary is saved to:
```
/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/daily-summary/weekly-notes/YYYY-WWW.md
```

## What gets analyzed

- **Daily summaries**: All YYYY-MM-DD.md files from current week
- **Task patterns**: Average tasks per day, completion rates
- **Blockers**: Days with blockers identified
- **Themes**: Recurring topics and focus areas

## Weekly summary includes

- **Metrics**: Tasks completed, notes created, daily activity
- **Key achievements**: Major wins from the week
- **Patterns observed**: Productivity insights
- **Challenges & blockers**: Issues encountered
- **Consolidated insights**: Key learnings
- **Next week's focus**: Planning for upcoming week

## Archive process

Daily summaries are automatically archived to:
```
notes-archive/YYYY-WWW Week Archive.md
```

Original daily summary files are removed after archiving.

## Review logs

Check execution logs at:
```bash
tail -f /tmp/claude-weekly-review.log
```

## Manual execution

Run this review anytime (not just Friday):
```bash
/weekly-review
```

Or invoke the script directly:
```bash
bun run review:weekly
```

## Pattern recognition

The review automatically identifies:
- Task completion velocity
- Common blockers and solutions
- Time allocation patterns
- Focus area trends

## Integration

This skill uses the capture workflow to:
- Extract insights using Claude Agent SDK
- Create follow-up tasks in Todoist
- Generate Linear issues for next week's priorities
- Cross-reference all sources in receipts

## Customization

To modify pattern analysis or output format, edit:
```
/Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/weekly-review.ts
```
