# Launching Claude Integrations

This guide explains how the project uses the Claude Agent SDK, the available skills, and how those capabilities centralize TODOist, Linear, and Obsidian workflows while exposing them through a single CLI + GraphQL API.

## Architectural Overview

1. **Planning layer** – `src/agent/planner.ts` calls `@anthropic-ai/claude-agent-sdk` with a strict JSON schema derived from our Plan Zod definition. Claude only produces plans, never executes actions directly.
2. **Execution layer** – `src/services/claudeCapture.ts` orchestrates the workflow: generate plan → execute deterministic actions (Obsidian/Todoist/Linear connectors) → write receipts → record evaluation snapshots and Langfuse traces.
3. **Central API** – `src/index.ts` exposes CLI commands (`capture`, `doctor`, `api`, `webhooks`, etc.) while `src/graphql/schema.ts` provides GraphQL entrypoints (`captureThought`, `captureWithClaude`, `traceContract`, etc.). All functionality routes through the same services for consistent logging and evidence capture.

## Claude Planner Implementation

### Structured Plans (Three Skills)

Claude uses schema-backed skills to produce actions that map exactly to our execution targets:

| Skill | JSON shape | Result |
| --- | --- | --- |
| `obsidian.upsert_note` | `{ notePath, title, markdown, tags[] }` | Upserts a note in Obsidian (local vault or REST) and later receives the receipt append.
| `todoist.create_task` | `{ content, description?, due?, priority?, projectId?, labels[] }` | Creates a Todoist task with defaults resolved in `src/execution/execute.ts`.
| `linear.create_issue` | `{ teamId, title, description?, assigneeId?, labels[] }` | Opens a Linear issue with deterministic description metadata (trace IDs, source tags).

Zod schemas live under `src/plan/schema.ts`, and `src/agent/planner.ts` converts them into a JSON schema passed to Claude via `outputFormat` (ensuring we get precise actions). The `systemPrompt` enforces architectural guardrails (no secrets, use placeholders for missing defaults, include `receiptSummary`, etc.).

### Planning Flow

1. CLI or API hands user text → `generatePlan(userText)`.
2. Claude stream yields a `result` message; we parse + Zod-validate.
3. Contract runtime checks (`@assistant/contracts`) ensure the plan is versioned (`1.0.0`) and compatible with downstream services.

## Centralized Capture Service

`runClaudeCapture` stitches together planning, execution, verification, receipts, and Langfuse evidence. Key steps:

1. **Langfuse Observability** – `startActiveObservation("capture.workflow", ...)` wraps the entire capture, while `startObservation("planner.generate")` captures the planner span. Inline OTEL instrumentation (via `@langfuse/otel`) sends spans as long as `LANGFUSE_*` env vars exist.
2. **Execution** – `src/execution/execute.ts` goes action-by-action:
   - Obsidian connector: local vault or REST plugin.
   - Todoist connector: applies defaults/tags, handles due dates.
   - Linear connector: ensures team/assignee defaults, appends trace metadata.
3. **Persistence + Contract Recording** – Execution results are logged into SQLite with contract conversions (`toContractExecutionRun`, `toContractLinkGraph`) and stored as evaluation snapshots (`src/evals/recorder.ts`).
4. **Verification** – `src/verification/service.ts` ensures detail links exist and (Phase B) that Langfuse + DevTools evidence were recorded.
5. **Receipts** – `src/services/claudeCapture.ts` builds markdown receipts and upserts them via the Obsidian connector (or logs warnings if no connector/dry run).

The service returns `{ plan, execution, receipt }`, which CLI, GraphQL, and webhook flows can all reuse.

## Querying & Integrating

### CLI Commands (`src/index.ts`)

- `capture` – high-level capture CLI that invokes `captureWorkflow` (which calls `runClaudeCapture` and logs the plan/execution summary).
- `captureThought` – simple Todo-style capture using the task registry (Langfuse wrapped).
- `doctor` – validates `.env` (OpenAI, Todoist, Linear, Langfuse, Tavily, EVALS dir) before deployments.
- `api` – starts the GraphQL server (`src/graphql/server.ts`) at `:4000`.
- `webhooks` – starts the webhook listener (`src/webhooks/server.ts`) at `:4100`.
- `observability:*` – register DevTools artifacts, list/replay evaluation snapshots for auditing.

### GraphQL API (`src/graphql/schema.ts`)

- `captureWithClaude(input)` → returns plan, execution, receipt (mirrors CLI).
- `traceContract(traceId)` → fetches the latest contract snapshot from `data/evals/<traceId>`.
- `evaluationSnapshots`, `replayEvaluationSnapshot` → list/replay stored contracts for observability.
- `tasks`, `integrationProfile`, `health` → centralized data for dashboards.

### Webhooks (`src/webhooks/server.ts`)

Endpoints:

- `POST /webhooks/todoist`
- `POST /webhooks/linear`
- `POST /webhooks/obsidian`

Each route logs the payload and calls `triggerReload`, a placeholder to plug in any “refresh planning context” logic (e.g., rebuild `planning_contexts` table, kick off a new capture, etc.). Use Cloudflare Tunnel or Railway to expose `:4100` publicly.

## Environment & Deployment Notes

- `.env` is loaded automatically via `import "dotenv/config"` in `src/config/env.ts`.
- Docker image defaults to `bun dist/index.js api --port 4000`; Compose also runs `webhooks` on `4100` (see `docker-compose.yml`).
- Railway deployment guide (`RAILWAY_DEPLOY.md`) explains setting up two services (API/webhooks) with shared environment variables.

## Centralized Usage Pattern

1. **Capture** user requests via CLI, GraphQL, or a webhook trigger.
2. **Plan** with Claude (structured skill outputs) enforcing the data model.
3. **Execute** connectors deterministically; store receipts/links/traces.
4. **Query** state via GraphQL (`traceContract`, `evaluationSnapshots`, etc.) or CLI (`observability:*`).
5. **Reload** via webhooks when external systems change (Todoist/Linear/Obsidian events).

All functionality—planning, execution, observability, and integration—is centralized through the same TypeScript services, making it easy to add new skills (extend `src/plan/schema.ts` and `src/agent/planner.ts`), new connectors (`src/connectors/*`), or additional surfaces (GraphQL/CLI/webhook) without duplicating logic.
