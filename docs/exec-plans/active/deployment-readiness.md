# Deployment Readiness Plan

## Goal

Elevate the tool from validated prototypes to a production-ready system that can be deployed, monitored, and iterated on safely.

## Pillars

1. **Contracts Everywhere** – enforce @assistant/contracts at every boundary (planner, executor, GraphQL, API responses).
2. **Observability Baseline** – Langfuse, DevTools captures, verification snapshots, and trace contracts available for each run.
3. **Operational Playbook** – build phase-runner + CI gating, environment verification (`doctor`), rollback + evaluation workflows.
4. **Deployment Automation** – containerization, secrets, runtime config, and rollout steps.

## Phased Plan

### Phase A – Contract Enforcement 👩‍💻 _(complete)_

- [x] Replace remaining internal schemas (ExecutionResult, LinkGraph) with contract mirrors.
- [x] Expose contract-validated `TraceResponse` via GraphQL & REST (if added) and add tests.
- [x] Document contract version bump policy in `.agents/CONTRACTS.md`.

### Phase B – Observability & Evaluations

- [x] Ensure every capture writes Langfuse spans; fail verification on missing spans/DevTools.
- [x] Provide CLI/GraphQL commands to list evaluation snapshots and replay them.
- [x] Dashboards: script to generate summary from `data/evals`, connect to monitoring.

### Phase C – Ops & Deployment

- [x] Extend `doctor` command to validate all env requirements (`OPENAI_API_KEY`, connectors, Langfuse, Tavily, etc.) and surface contract mismatches.
- [x] Add container image + deployment scripts (Dockerfile review, GitHub Actions release job) and document rollout steps.
- [x] Harden CLI/GraphQL error handling, ensure structured error format per contracts.

### Phase D – Final QA & Rollout

- [ ] Run full TDD pass: tests, contracts:typecheck, evaluation replay.
- [ ] Produce deployment checklist (Langfuse dashboards, DevTools evidence, contract validation status).
- [ ] Sign-off: merge to main, tag release, update docs.

## Deliverables

- Updated schema + contract enforcement in runtime.
- Observability dashboards + evaluation CLI.
- Deployment instructions (CI pipeline, container, env management).
- Documented rollback/runbook referencing trace contracts.
