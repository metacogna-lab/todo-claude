---
name: daily-review
description: Run daily review to process notes, sync tasks across Todoist/Linear, and generate daily summary. Use when user asks to "run daily review", "process today's notes", or "sync my tasks".
disable-model-invocation: false
allowed-tools: Bash(bun *), Read, Write
context: fork
agent: general-purpose
---

# Daily Review

Processes daily notes, syncs tasks, and generates summaries for your Obsidian vault.

## What this does

1. Updates state tracking in `state/claude-state.md`
2. Processes new notes from vault root
3. Extracts actionable items to Todoist and Linear
4. Generates daily summary document

## Running the review

Execute the daily review script:

```bash
cd /Users/nullzero/Metacogna/claude-obsidian-todoist-linear
bun run review:daily
```

## Output location

The daily summary is saved to:
```
/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/daily-summary/YYYY-MM-DD.md
```

## What gets processed

- **New notes**: Any `.md` files in vault root
- **State updates**: Session timestamps and context
- **Task extraction**: Converts checkboxes and action items to Todoist/Linear
- **Cross-references**: Links notes to tasks via receipts

## Review logs

Check execution logs at:
```bash
tail -f /tmp/claude-daily-review.log
```

## Manual execution

You can run this review anytime, not just via automation:
```bash
/daily-review
```

Or invoke the script directly:
```bash
bun run review:daily
```

## Integration

This skill automatically:
- Creates Todoist tasks for action items
- Creates Linear issues for product work
- Writes receipts back to Obsidian with cross-references
- Updates the state tracking file

## Customization

To modify the review behavior, edit:
```
/Users/nullzero/Metacogna/claude-obsidian-todoist-linear/scripts/daily-review.ts
```
