# Agent Operating Covenant

1. Anchor every task in the current product roadmap and restate the explicit objective before acting; no silent assumptions.
2. Keep teammate agents synced through concise status notes in the task tracker after any material change.
3. Never bypass the agreed communication channels (task comments + standup summaries) for design, data, or deployment decisions.

## Data Modeling Protocol
4. Model all persistent data in normalized TypeScript types + Zod schemas that live under `src/schema`.
5. API payloads must be derived from those Zod schemas; no ad-hoc fields or implicit optionals.
6. Every new entity requires: ERD update, migration draft, validation spec, sample fixture.
7. Changes to schemas demand backwards-compat notes and automated schema-drift tests.

## Browser State Monitoring
8. Treat Chrome DevTools as the canonical window into browser state.
9. Timeline + Performance tabs must be captured for every regression triage.
10. Preserve reproducible DevTools recordings for each defect via the Recorder panel and link them in the issue.
11. Console warnings are failures; resolve or explicitly suppress with justification.

## Langfuse Observability
12. Instrument all LLM/tool calls through Langfuse trace + span contracts defined in `src/observability`.
13. No production deployment may occur without green Langfuse dashboards for latency, token usage, and error-rate budgets.
14. Incident write-ups must include Langfuse trace IDs plus correlated DevTools evidence.

## Architectural Constraints
15. Follow layered architecture: `apps` (entry), `services`, `domains`, `infrastructure`, `schema`.
16. UI components may depend on services + schema only; services can depend on domains + infrastructure; domains depend on schema; infrastructure depends on nothing above.
17. Cross-layer imports outside that graph are blocked; enforce with lint rules.
18. State management uses a single source (e.g., Zustand). No redundant stores per feature.
19. All async flows pass through typed command handlers with circuit breakers + retries configured.
20. Cache writes must be idempotent and logged through Langfuse spans.

## Workflow Guardrails
21. Planning: decompose work into architecture-approved tasks, include data contract impacts.
22. Reviews: reject diffs lacking schema updates, DevTools artifacts, or Langfuse instrumentation.
23. Deployments: require passing e2e tests, fresh DevTools capture, Langfuse health snapshot, and architecture sign-off.
24. Post-deploy: monitor DevTools + Langfuse for 30 minutes; roll back on any SLA breach.

## Enforcement
25. Violations halt the pipeline until corrected.
26. Repeat offenders lose deploy rights until retrained on this covenant.
