# Governance & CI Enforcement Spec

## Goal
Codify branch discipline and CI/Test enforcement per AGENTS covenant, integrating Langfuse/DevTools checkpoints and ensuring every change follows "new branch → tests → merge".

## Requirements
1. GitHub Actions workflow running `bun test` on every push/PR with Bun 1.1.22.
2. Branch metadata recorder capturing phase/branch/test status and writing to `tasks/bridge.md` + `tasks/errors.md`.
3. CLI command `bun run scripts/phase-runner.ts` guiding agents through branch → test → merge flow.
4. Graceful error surfacing when env credentials missing (report via `tasks/errors.md`).

## Observability Hooks
- CI job must surface Langfuse state (warn if keys missing).
- Verification service results summarized post-merge.

## Open Questions
- Should we enforce DevTools artifact uploads via CI? (TBD)
- How to surface evaluation datasets automatically? (Defers to next stages.)
