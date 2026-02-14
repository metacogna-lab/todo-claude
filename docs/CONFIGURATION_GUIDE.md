# Deployment & Usage Guide

This guide distills the current bridge state (`tasks/bridge.md`) and structural docs under `docs/` into a single checklist for configuring and operating the Claude → Obsidian/Todoist/Linear assistant.

## 1. Environment Setup
1. Duplicate `.env.example` and fill in:
   - `OPENAI_API_KEY` (required).
   - At least one Obsidian connector: `OBSIDIAN_VAULT_PATH` (preferred) or `OBSIDIAN_REST_URL` + token.
   - `TODOIST_API_TOKEN` and optional defaults (`TODOIST_DEFAULT_PROJECT_ID`, `TODOIST_DEFAULT_LABELS`).
   - `LINEAR_API_TOKEN`, `LINEAR_DEFAULT_TEAM_ID`, optional `LINEAR_DEFAULT_ASSIGNEE_ID`.
   - Langfuse trio (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`) so traces can be enforced.
   - `EVALS_DIR` (defaults to `data/evals`) and optional `TAVILY_API_KEY` for the web search resolver.
2. Run `bun run doctor` to verify the configuration. The CLI now checks OpenAI, Obsidian, Todoist, Linear, Langfuse, EVALS directory access, and Tavily. Any failing check blocks CI in Phase C.

## 2. Observability & Evidence
1. Every capture run emits a Langfuse trace and records observability evidence in SQLite (`observability_evidence` table). Missing Langfuse or DevTools artifacts now fail verification (`src/verification/service.ts`).
   - The inline Langfuse OpenTelemetry SDK starts automatically at boot when `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_HOST` are set, so export those before launching the CLI/API to avoid dropping spans.
2. After recording a Chrome DevTools HAR, register it so verification can pass:
   ```bash
   bun run observability:devtools TRACE_ID path/to/recording.har --label "baseline"
   ```
3. Inspect or replay evaluation snapshots that live under `EVALS_DIR/<traceId>`:
   ```bash
   bun run observability:snapshots TRACE_ID
   bun run observability:replay TRACE_ID <snapshot-file>
   ```
4. GraphQL also exposes `evaluationSnapshots` and `replayEvaluationSnapshot` queries for automation.

## 3. Daily Operation
1. Capture requests via CLI (`bun run dev capture "..."`) or GraphQL (`captureWithClaude` mutation). Each run writes to Obsidian/Todoist/Linear per the plan contracts.
2. Monitor Langfuse dashboards and DevTools artifacts as mandated by `AGENTS.md` and `docs/exec-plans/active/deployment-readiness.md`.
3. Use the new GitHub Actions workflow (`.github/workflows/ci.yml`) to gate merges on `bun run lint` and `bun test`. Local parity: `bun run lint && bun test`.

## 4. Deployment Readiness Snapshot
- Phases A & B are complete: planner/executor enforced contracts, observability evidence exists, snapshot tooling is live.
- Phase C in progress: doctor checks are expanded and GraphQL responses follow a consistent error envelope. Remaining work: container/release automation and rollout docs (see `docs/exec-plans/active/deployment-readiness.md`).
- Review `tasks/bridge.md` for the canonical state before kicking off additional branches; each phase still requires "new branch → tests → merge" discipline per `AGENTS.md`.

## 5. Container & Release Pipeline
1. Build the container locally (`docker build -t claude-assistant .`) and run with your `.env` file (`docker run --env-file .env -p 4000:4000 claude-assistant`). The image uses Bun 1.1.22, compiles the TypeScript entry point, and defaults to serving the GraphQL API on port 4000 (`CMD ["bun","dist/index.js","api","--port","4000"]`).
2. CI now runs lint + tests on every push/PR via `.github/workflows/ci.yml`.
3. The release workflow (`.github/workflows/release.yml`) builds/tests and publishes container images to GitHub Container Registry. Trigger it by pushing a `v*` tag or via manual dispatch with an optional `image_tag`. Provide deployment credentials by inheriting the repository `GITHUB_TOKEN`, or override `docker login` steps for other registries.
4. After pushing an image, update your runtime to pull `ghcr.io/<org>/<repo>:latest` (or the versioned tag) and supply the same `.env` entries documented above. Langfuse + DevTools requirements still apply; verification will fail if the production environment doesn’t register evidence.
