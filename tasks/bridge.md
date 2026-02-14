# Bridge State

## Context

- Derived from `.agents/ARCHITECTURE.md`, `.agents/DATAMODEL.md`, `.agents/CONTRACTS.md`, `AGENTS.md`, and `CLAUDE.md`.
- Goal: bring the tool in line with the seven-layer data/observability model and Bun-first execution rules.

## Active Plan Snapshot

1. **Phase 1 – Event & Context Foundation** (branch `phase1-event-context`) ✅ _complete_
   - Bun-native SQLite store for `EventEnvelope` + planning context snapshots.
   - Tests covering ingestion + context rebuild flows (`tests/event-ingestion.test.ts`).
2. **Phase 2 – Execution & Link Graph** (branch `phase2-execution-links`) ✅ _complete_
   - SQLite persistence for execution runs + action records.
   - DetailSource link graph capturing obsidian/todoist/linear artifacts with trace IDs.
3. **Phase 3 – Verification & Observability** (branch `phase3-verification-obs`) ✅ _complete_
   - Verification service persisting results + issues (`detail_links_missing` guard) with tests (`tests/verification-service.test.ts`).
   - Evaluation snapshots recorded to `data/evals` via `recordEvaluationSnapshot`.
4. **Phase 4 – Agent-Oriented Governance** (branch `phase4-governance`)
   - Enforce enforcement policies, automation tooling, CI checks, and branch/test/merge discipline per AGENTS covenant.
5. **Deployment Readiness** (branches `contracts-runtime-validation`, `deployment-phase-b-observability`, `deployment-phase-c-ops`)
   - Contracts plan documented (`docs/exec-plans/active/deployment-readiness.md`).
   - Planner now validates outputs against `@assistant/contracts`; runtime schema imports updated.
   - Execution logging + link graph builders emit contract-validated payloads for Langfuse snapshots.
   - Langfuse traces + DevTools evidence tracked via observability evidence table; CLI/GraphQL surface snapshot introspection + replay.
   - Doctor command now validates OPENAI/Langfuse/connectors/Tavily/EVALS paths, GH Actions lint+test gate CI, Docker + release workflows deploy images to GHCR.

## Next Actions

- Continue Phase C ops work (new branch) – finalize deployment automation + structured error guidance.
- Use the new observability commands to register DevTools captures per trace; verification now blocks when spans/artifacts missing.
- Keep logging structural gaps in `tasks/errors.md`; track governance automation gap (still open).
