# Structural Roadmap (Derived from `.agents/*`, `AGENTS.md`, `CLAUDE.md`)

> Guiding requirement: "Always start each phase on a new feature branch, write tests, work, test, commit, merge."

## Phase 1 – Event & Context Foundation (`phase1-event-context`) ✅ _Completed_
**Gaps addressed:** Missing EventEnvelope ingestion, PlanningContext builder, schema persistence (see `.agents/DATAMODEL.md` §§3–5).  
**Scope**
- Stand up a Bun-native event ingestion service that stores `EventEnvelope` + `PlanningContext` records (SQLite/`bun:sqlite` per `CLAUDE.md` guidance).
- Inject deterministic defaults (`defaultTeamId`, `defaultProjectId`, etc.) into planner via new `context` module.
- Add failing tests for missing ingestion/context behavior, then implement resolvers + CLI commands.
- Wire Langfuse trace IDs at ingress.
**Deliverables**
1. `src/events/ingest.ts` + schema migrations.
2. Planner refactor to consume `PlanningContext`.
3. Comprehensive tests (`bun test`) covering ingestion round-trip.
**Definition of done**
- Branch merged after `bun test` passes and docs updated.

## Phase 2 – Execution & Link Graph (`phase2-execution-links`) ✅ _Completed_
**Gaps addressed:** Execution graph, ActionExecutionRecords, DetailSource link graph ( `.agents/DATAMODEL.md` §§7–12 ).  
**Scope**
- Persist `ExecutionRun`, `ActionExecutionRecord`, and `DetailSourceArtifact` entities.
- Enforce trace propagation into Obsidian/Todoist/Linear connectors.
- Build reconciliation job that backfills `LinkGraph` from receipts + external IDs.
- Tests validating creation + retrieval of execution/link artifacts.
**Deliverables**
1. `src/execution/store.ts` + link graph module.
2. Connector instrumentation ensuring `traceId` in every payload.
3. Migration scripts + fixtures; new Vitest suite verifying link consistency.

## Phase 3 – Verification & Observability (`phase3-verification-obs`) ✅ _Completed_
**Gaps addressed:** Verification pipeline, audit receipts, enforcement policies, observability mandates ( `.agents/DATAMODEL.md` §13–16, `AGENTS.md` Workflow Guardrails ).  
**Scope**
- Create verification service that runs post-execution checks (receipts written, Langfuse spans present, DevTools artifacts attached).
- Surface verification status through GraphQL (`verificationResults` query) and CLI report.
- Record incidents in `tasks/errors.md` when checks fail.
- Expand tests to cover failure + success cases; capture fixtures for DevTools + Langfuse.
**Deliverables**
1. `src/verification/*.ts` modules + schemas.
2. GraphQL + CLI surfaces for verification results.
3. Automated tests + sample DevTools recordings committed under `docs/generated`.

## Phase 4 – Agent-Oriented Governance (`phase4-governance`)
**Gaps addressed:** Enforcement automation, build metadata, process adherence ( `.agents/CONTRACTS.md`, `.agents/ERRORS.md`, `AGENTS.md` Workflow Guardrails ).  
**Scope**
- Implement branch/merge guard scripts enforcing "new branch → tests → merge" policy.
- Capture build metadata (phase, branch, test results) and store in `BuildMetadata` table.
- Automate updates to `tasks/bridge.md` + `tasks/errors.md` via scripts run in CI.
- Provide documentation for agents on how to follow the branching + testing cadence.
**Deliverables**
1. `scripts/phase-runner.ts` orchestrating branch/test/merge workflow.
2. CI checks gating merges on `bun test` and verification suite.
3. Updated docs under `docs/DESIGN.md` or `docs/PLANS.md` describing governance.

---
**Execution Notes**
- Each phase must begin from `main`, create the named branch, add targeted tests before implementation, and only merge once `bun test` + verification jobs pass.
- Update `tasks/bridge.md` with progress and append new issues to `tasks/errors.md` whenever a structural invariant fails.
