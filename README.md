# Claude → Obsidian + Todoist + Linear Assistant (TypeScript)

This repo is a **production-oriented scaffold** for a personal assistant built with the **Claude Agent SDK** that:
- captures knowledge in **Obsidian** (Markdown notes),
- extracts and manages tasks in **Todoist**, and
- creates/updates scoped work items in **Linear**.

It is designed around a *deterministic execution* model:
1) Claude produces a **typed plan** (JSON, schema-validated).
2) Your code executes the plan via API clients.
3) A **receipt** is written back into Obsidian for auditability.

Why this pattern?
- It reduces tool-risk, keeps execution reliable, and makes output traceable.
- It also makes it easy to add CI tests that validate planning output.

## Requirements
- Bun 1.1+
- Obsidian vault on disk (recommended) OR an Obsidian REST plugin endpoint
- API tokens for Todoist and Linear
- `ANTHROPIC_API_KEY` for the Agent SDK

## Install
```bash
bun install
cp .env.example .env
```

## Run
### 1) Capture a thought / request
```bash
bun run dev capture "Draft the Q1 roadmap. Tasks to Todoist, feature tickets to Linear, and a note in Obsidian."
```

### 2) Dry-run (no writes)
```bash
DRY_RUN=true bun run dev capture "Book flights for April and track as a checklist."
```

### 3) GraphQL API (services surface)
```bash
bun run dev:api -- --port 4000
```
Then query `http://localhost:4000/graphql` for tasks, health snapshots, or to run `captureThought` mutations.

## What gets created
- **Obsidian**
  - Upserts a note (by path) with summary + structured sections
  - Appends a “Receipt” entry referencing Todoist task IDs and Linear issue IDs
- **Todoist**
  - Tasks created with labels, due dates, and optional project selection
- **Linear**
  - Issues created in a team, optionally assigned, with markdown descriptions
  - Backlinks to Obsidian note + a request/trace id

## Extending this repo
- Add new execution targets as **Action types** in `src/plan/schema.ts`
- Add new connectors in `src/connectors/*`
- Add new workflow commands in `src/index.ts`

## Security / Safety defaults
- Claude is used for **planning**, not direct side-effectful tool usage.
- API write operations can be disabled with `DRY_RUN=true`.
- Inputs and outputs are schema-validated with Zod.

## References
- Claude Agent SDK overview and TypeScript API reference.   (See official docs and options like `outputFormat` and `mcpServers`.) 
- Todoist REST v2 docs, Linear GraphQL docs.
