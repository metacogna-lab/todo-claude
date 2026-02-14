# Claude → Obsidian + Todoist + Linear Assistant (TypeScript)

This repo is a **production-oriented scaffold** for a personal assistant built with the **Claude Agent SDK** that:

- captures knowledge in **Obsidian** (Markdown notes),
- extracts and manages tasks in **Todoist**, and
- creates/updates scoped work items in **Linear**.

It is designed around a _deterministic execution_ model:

1. Claude produces a **typed plan** (JSON, schema-validated).
2. Your code executes the plan via API clients.
3. A **receipt** is written back into Obsidian for auditability.

Why this pattern?

- It reduces tool-risk, keeps execution reliable, and makes output traceable.
- It also makes it easy to add CI tests that validate planning output.

## Requirements

- Bun 1.1+
- Obsidian vault on disk (recommended) OR an Obsidian REST plugin endpoint
- API tokens for Todoist and Linear
- `OPENAI_API_KEY` for LLM planning

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

Example mutation that goes end-to-end through Claude planning + execution:

```graphql
mutation {
  captureWithClaude(input: { text: "Draft roadmap and sync tools" }) {
    plan {
      traceId
      receiptSummary
    }
    execution {
      warnings
    }
    receipt {
      notePath
      written
    }
  }
}
```

### 4) Observability helpers

- Register DevTools artifacts after recording in Chrome DevTools:
  ```bash
  bun run observability:devtools TRACE_ID path/to/recording.har --label "baseline"
  ```
- List and replay evaluation snapshots saved under `data/evals/TRACE_ID`:
  ```bash
  bun run observability:snapshots TRACE_ID
  bun run observability:replay TRACE_ID <snapshot-file>
  ```

### 5) Docker deployment

Build and run the containerized API server:

```bash
docker build -t claude-assistant .
docker run --env-file .env -p 4000:4000 claude-assistant
```

GitHub Actions also ships a release workflow (`.github/workflows/release.yml`) that builds/tests and pushes images to `ghcr.io/<org>/<repo>` when tags like `v1.2.3` are pushed (or manually triggered via `workflow_dispatch` with an `image_tag`).

### 6) Docker Compose + Webhooks

`docker-compose.yml` spins up both the GraphQL API (`:4000`) and the webhook listener (`:4100`):

```bash
docker compose up --build
```

Each webhook endpoint lives at:

- `POST /webhooks/todoist`
- `POST /webhooks/linear`
- `POST /webhooks/obsidian`

Expose `:4100` to external services (Todoist/Linear/Obsidian) via Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:4100 --hostname hooks.example.com
```

Then configure:

1. **Todoist** → Developer Console → Webhooks → point to `https://hooks.example.com/webhooks/todoist`.
2. **Linear** → Workspace Settings → Webhooks → `https://hooks.example.com/webhooks/linear`.
3. **Obsidian** (if using a remote vault) → Cloud provider automations or custom scripts → `https://hooks.example.com/webhooks/obsidian`.

Each webhook triggers a reload placeholder today (logged via `logger.info`); extend `src/webhooks/server.ts` to tie into your refresh logic.

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

- Claude Agent SDK overview and TypeScript API reference. (See official docs and options like `outputFormat` and `mcpServers`.)
- Todoist REST v2 docs, Linear GraphQL docs.
- Configuration details: `docs/CONFIGURATION_GUIDE.md`
- Deployment playbook (CI/CD, releases, rollout): `docs/DEPLOYMENT.md`
