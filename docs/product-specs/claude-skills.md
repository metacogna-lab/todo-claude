# Claude Skills & Agent SDK Integration Spec

## Overview
Introduce progressive, production-grade Claude skills (web search, Claude Code file ops, evaluation capture) that align with `.agents/CONTRACTS.md` and AGENTS covenant.

## Progressive Reveal Stages
1. **Search Skill** – leverage Tavily API via `webSearch` plugin; expose as read-only capability so agents can cite sources.
2. **Claude Code Skills** – add structured file-edit + test-run commands; initially preview-only, later writable once verification passes.
3. **Evaluation Dataset Capture** – record every skill invocation (event, plan, execution, verification) to replay scripts.
4. **Hardening & Mock Removal** – swap mocks for sandbox interfaces, ensure graceful error handling and Langfuse coverage.

## Requirements
- Every new skill must be represented in Plan schema + Zod validators.
- GraphQL + CLI surfaces must reveal skill availability progressively (feature flags per phase).
- Observability: Langfuse spans for skill calls, DevTools artifacts when browser impact expected.
- Governance: CI must fail if skills used without accompanying verification metadata.

## Open Questions
- Should skills be toggled per workspace or repo?
- How to store large evaluation datasets? (Local `data/evals` vs. remote bucket.)
