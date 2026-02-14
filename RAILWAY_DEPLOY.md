# Railway Deployment Guide

This guide walks through deploying the Claude → Obsidian/Todoist/Linear assistant on [Railway](https://railway.app). It assumes you already have API keys for OpenAI, Todoist, Linear, and Langfuse, and a root `.env` file similar to `.env.example`.

---

## 1. Prerequisites

1. **Railway account**: Sign up and create a new project.
2. **Repo access**: Ensure Railway can access your GitHub repository (or push a copy to Railway’s Git provider if preferred).
3. **Environment variables**: Collect all required secrets from `.env`:
   - `OPENAI_API_KEY`, optional `OPENAI_MODEL`
   - `TODOIST_API_TOKEN`, `TODOIST_DEFAULT_PROJECT_ID`, `TODOIST_DEFAULT_LABELS`
   - `LINEAR_API_TOKEN`, `LINEAR_DEFAULT_TEAM_ID`, `LINEAR_DEFAULT_ASSIGNEE_ID`
   - `OBSIDIAN_VAULT_PATH` if using local vault (rare in Railway); otherwise rely on `OBSIDIAN_REST_URL`/`OBSIDIAN_REST_TOKEN`.
   - `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`
   - `TAVILY_API_KEY` (optional)
   - `EVALS_DIR` (set to a writable path, e.g. `/tmp/evals`)
   - `GLOBAL_TAGS`, `RECEIPTS_FOLDER`, `DRY_RUN`

---

## 2. Project Structure

Railway will run two services from the same repo:

1. **GraphQL API** – `bun dist/index.js api --port 4000`
2. **Webhook Listener** – `bun dist/index.js webhooks --port 4100`

You can deploy them as separate services (recommended for scaling/monitoring) or run one service and expose both via a process manager.

---

## 3. Build Command

Add the following to each Railway service:

- **Build command**: `bun install && bun run build`
- **Start command (API)**: `bun dist/index.js api --port 4000`
- **Start command (Webhooks)**: `bun dist/index.js webhooks --port 4100`

Railway automatically honors the `PORT` environment variable, so optionally set `PORT=4000` (API) and `PORT=4100` (webhooks); otherwise, pass `--port` explicitly as above.

---

## 4. Environment Variables

In each service’s **Variables** tab, configure:

| Key | Description |
| --- | --- |
| `OPENAI_API_KEY` | Required |
| `OPENAI_MODEL` | Optional |
| `TODOIST_API_TOKEN`, `TODOIST_DEFAULT_PROJECT_ID`, `TODOIST_DEFAULT_LABELS` | Optional but required for Todoist automation |
| `LINEAR_API_TOKEN`, `LINEAR_DEFAULT_TEAM_ID`, `LINEAR_DEFAULT_ASSIGNEE_ID` | Optional but required for Linear automation |
| `OBSIDIAN_REST_URL`, `OBSIDIAN_REST_TOKEN` | If using remote Obsidian connectors |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` | Required for observability |
| `TAVILY_API_KEY` | Optional web search integration |
| `EVALS_DIR` | Use `/tmp/evals` or another writable path |
| `RECEIPTS_FOLDER`, `GLOBAL_TAGS`, `DRY_RUN` | Behavior flags |

> Tip: Use Railway’s **Shared Variables** so both API and webhook services receive the same config.

---

## 5. Deploy Workflow

1. **Connect repository**: In Railway, link your GitHub repo and select the branch (e.g., `main`).
2. **Define services**:
   - Create Service A (“claude-api”) with the build/start commands above.
   - Create Service B (“claude-webhooks”) referencing the same repo.
3. **Environment**: Set variables for each service.
4. **Deploy**: Railway runs build + start automatically after configuration changes.

---

## 6. Webhook Routing

After Railway deploys the webhook service, it will provide a public URL like `https://webhooks-<slug>.up.railway.app`.

Configure third-party webhooks to hit the appropriate endpoints:

- Todoist → `https://webhooks-<slug>.up.railway.app/webhooks/todoist`
- Linear → `https://webhooks-<slug>.up.railway.app/webhooks/linear`
- Obsidian (if using remote automation) → `https://webhooks-<slug>.up.railway.app/webhooks/obsidian`

Railway handles TLS automatically.

---

## 7. Observability & Logs

- **Langfuse**: With keys set, the inline OTEL pipeline begins as soon as the service boots; check your Langfuse dashboard for traces.
- **Railway logs**: Each service exposes logs under the “Deployments” tab. You should see the doctor output, GraphQL boot, and webhook notifications.
- **Mongo** (if needed later): Railway offers managed databases. For now, the assistant uses SQLite; ensure `EVALS_DIR` is on an ephemeral disk you can tolerate wiping between deploys.

---

## 8. Tips & Troubleshooting

- To avoid hitting third-party APIs during tests, gate them behind `DRY_RUN=true`.
- If Langfuse telemetry logs warnings about missing keys, double-check variable names and restart the deployment.
- Webhook handlers currently log payloads; wire actual reload logic into `triggerReload` in `src/webhooks/server.ts`.
- Use `railway run bun dist/index.js doctor` for quick health checks after deployment.

---

Railway deployment is now complete. For production hardening (autoscaling, metrics, etc.), refer to `docs/DEPLOYMENT.md` for additional CI/CD considerations. Happy shipping!
