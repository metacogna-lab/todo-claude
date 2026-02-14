# Deployment Playbook

This document summarizes Phase C outcomes (see `tasks/bridge.md`) and the surrounding documentation (`docs/CONFIGURATION_GUIDE.md`, `docs/exec-plans/active/deployment-readiness.md`) so operators can confidently ship the Claude → Obsidian/Todoist/Linear assistant.

## 1. Prerequisites
1. Complete the configuration steps in `docs/CONFIGURATION_GUIDE.md` (OpenAI, Obsidian, Todoist, Linear, Langfuse, DevTools discipline).
2. Run `bun run doctor` locally (or inside CI/CD) to catch missing environment knobs before deploy.
3. Ensure Langfuse credentials and a DevTools artifact registration process exist; verification now blocks when either signal is missing.

## 2. Container Image
- The Dockerfile is multi-stage and Bun-native (`oven/bun:1.1.22`). Build locally with:
  ```bash
  docker build -t claude-assistant .
  docker run --env-file .env -p 4000:4000 claude-assistant
  ```
- Runtime entrypoint: `bun dist/index.js api --port 4000`. Override port with `PORT` env when needed.

## 3. CI Pipeline
- `.github/workflows/ci.yml` runs `bun run lint` and `bun test` on every push/PR. Keep this green before tagging releases.
- Tests hit the entire workflow suite plus the observability/verification gates; missing Langfuse/DevTools warnings are expected locally when keys are absent.

## 4. Webhook Exposure
- `docker-compose.yml` orchestrates two services from the same image:
  - `api`: `bun dist/index.js api --port 4000`
  - `webhooks`: `bun dist/index.js webhooks --port 4100`
- Expose the webhook listener through a Cloudflare Tunnel (or equivalent) so external systems can reach it:
  ```bash
  cloudflared tunnel --url http://localhost:4100 --hostname hooks.example.com
  ```
- Configure integrations to hit the appropriate routes:
  | Connector | Endpoint | Notes |
  | --- | --- | --- |
  | Todoist | `https://hooks.example.com/webhooks/todoist` | Create under [Todoist Developer Webhooks](https://developer.todoist.com/sync/v9/#webhooks) |
  | Linear | `https://hooks.example.com/webhooks/linear` | Workspace Settings → Webhooks |
  | Obsidian | `https://hooks.example.com/webhooks/obsidian` | Use automation/push scripts when vault syncs |

Extend the `triggerReload` placeholder in `src/webhooks/server.ts` with the actual refresh logic for each detail source.

## 4. Release Workflow
1. Repository variables/secrets:
   - Optional `CONTAINER_REGISTRY` (defaults to `ghcr.io`) to target another registry.
   - Optional `CONTAINER_IMAGE_NAME` to override the default `<repo>` path.
   - Optional secrets `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` (default is GitHub actor + token).
2. Workflow triggers (`.github/workflows/release.yml`):
   - Push a tag like `v1.2.3` to run build → lint → test → docker build → push.
   - Manually dispatch via the Actions tab with optional `image_tag` override.
3. Images land in `${REGISTRY}/${IMAGE_NAME}`, and `latest` is always updated alongside the tagged digest.

## 5. Rollout Checklist
1. Confirm Langfuse dashboards + DevTools evidence exist for the release candidate (Phase B requirements).
2. Tag/version release, monitor the GH Actions release job, and note the pushed tag/digest.
3. Pull the published image in your runtime environment:
   ```bash
   docker pull ghcr.io/<org>/<repo>:v1.2.3
   docker run --env-file prod.env -p 4000:4000 ghcr.io/<org>/<repo>:v1.2.3
   ```
4. Register DevTools artifacts for each production trace via `bun run observability:devtools` (or equivalent automation) so verification doesn’t fail.
5. Update `tasks/bridge.md` if any structural gaps are discovered; new work must still follow “branch → tests → merge” discipline from `AGENTS.md`.
