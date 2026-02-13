# Claude Agent SDK Drop-In Plan (Progressive Reveal)

## Stage 0 – Context
- Current stack already orchestrates planning/execution with Claude Agent SDK + Bun.
- Goal: add drop-in "skills" (Claude Code operations, web search, verification) that follow progressive reveal (introduce capabilities gradually, validate, then expand).

## Stage 1 – Web Search & Retrieval Hooks (branch `skills-stage1-websearch`)
1. Integrate Tavily-based web search plugin (see `src/plugins/webSearch.ts`).
2. Expose search skill via Claude Agent SDK tool definition and GraphQL mutation (progressively reveal search outputs to users).
3. Tests: ensure missing API keys reported gracefully; add integration tests for search traces.
4. Deliverables: documentation under `docs/product-specs/claude-skills.md` and CI coverage.

## Stage 2 – Claude Code Skills & File Ops (branch `skills-stage2-claude-code`)
1. Build command set mirroring Claude Code experiences (edit file, run tests) by wrapping existing Bun scripts.
2. Progressive reveal: start with read-only `plan.preview` skill, then unlock write/apply once verification passes.
3. Update CONTRACTS + Plan schema to version new actions.
4. Tests: end-to-end fixture ensuring file edits recorded in link graph.

## Stage 3 – Evaluation Datasets & Observability (branch `skills-stage3-eval`) ✅ _Completed_
1. Generate evaluation artifacts (event → plan → execution → verification) per run, store in `data/evals` using `recordEvaluationSnapshot`.
2. Surface verification results via Langfuse + SQLite (remaining dashboards tracked in future work).
3. Provide groundwork for replay CLI via stored JSON snapshots.

## Stage 4 – Real Interface & Mock Removal (branch `skills-stage4-hardening`)
1. Remove remaining test-time mocks by introducing sandbox services (local Todoist/Linear/Obsidian simulators).
2. Enforce graceful error handling (never terminate unless unrecoverable) and document fallback behavior.
3. Finalize progressive reveal docs and ensure governance automation verifies skill usage.

---
_This plan references new plugin + best practices discovered locally; revisit once web search access is fully validated._
