# Architecture Overview

## Layered System
- `apps`: entrypoints (web, worker, cli) that assemble UI/application flows.
- `services`: orchestrate workflows, enforce policies, and expose typed commands.
- `domains`: pure domain logic + aggregates; no IO.
- `infrastructure`: integrations (db, queues, LLM providers) accessed via interfaces.
- `schema`: shared data contracts (TypeScript + Zod) powering every other layer.

## Data + Observability Requirements
- Models originate in `schema` and migrate downstream through ERDs, fixtures, and API payloads.
- Langfuse traces wrap every external call; spans annotate retries/circuit breakers.
- Chrome DevTools recordings serve as evidence for regressions impacting browser state.

## Constraints
1. Upper layers may only depend downward (apps→services→domains→schema, services→infrastructure allowed for adapters).
2. Cross-layer imports are blocked via lint rules; any exception needs written approval.
3. Async flows must travel through typed command handlers surfaced in services.
4. State management is centralized (Zustand store) exposed via React hooks.
5. Caches are idempotent; writes emit Langfuse spans tagged with cache keys.

## Extension Playbook
- Propose changes via docs/design-docs; include schema diffs and DevTools/ Langfuse expectations.
- Update docs/product-specs with user-facing outcomes before coding.
- Mirror implementation tasks under docs/exec-plans with owners + checkpoints.
