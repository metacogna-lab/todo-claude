CONTRACTS.md

Unified Backend–Frontend–Agent Contracts

1. Purpose

This document defines all authoritative contracts between:

Ingress / Router / Planner / Executor Workers

Evaluator Worker

Frontend UI(s)

Obsidian Gateway

Todoist

Linear

Claude Agent SDK

It exists to:

Eliminate ambiguity

Prevent schema drift

Guarantee replayability

Enable safe evolution

Enforce deterministic system behavior

This document is normative.

2. Global Invariants (Non-Negotiable)

Every mutation across systems MUST contain trace_id.

Every Plan MUST validate against PlanSchema.

No frontend may mutate external systems directly.

No Claude invocation may bypass schema validation.

Every external write MUST be idempotent.

All contracts MUST be versioned.

Breaking changes require:

schema version bump

migration

evaluator awareness update

Violation of these rules is considered a system integrity failure.

3. Versioning Strategy

Each contract includes:

version: "major.minor.patch"


Rules:

Major → breaking schema change

Minor → additive fields

Patch → validation or doc clarification only

Frontend must reject unknown major versions.

Backend must support previous minor versions for at least one release window.

Version bump protocol:
- Update `CONTRACT_VERSION` in @assistant/contracts with semantic meaning (Major=breaking, Minor=additive, Patch=doc/validation).
- Regenerate affected schemas and runtime validators.
- Add regression tests proving frontend/backend interoperability.
- Document the change in deployment readiness plan and release notes.

4. Canonical Identity Contracts
4.1 Trace Identity
type TraceId = string; // UUIDv7 preferred


Requirements:

Generated at ingress

Immutable

Embedded in:

Obsidian note body

Todoist description

Linear issue description

All database rows

All evaluation artifacts

Frontend must treat trace_id as the primary correlation key.

5. Event Contract
5.1 EventEnvelope (Backend Authoritative)
interface EventEnvelope {
  version: "1.0.0";
  event_id: string;
  source: "manual" | "linear" | "todoist" | "obsidian";
  type: string;
  occurred_at: ISO8601;
  received_at: ISO8601;
  trace_id: TraceId;
  payload: unknown;
  context: {
    user_id: string;
    workspace_id?: string;
    workflow?: string;
    priority?: "low" | "normal" | "high";
  };
}


Rules:

Frontend must not invent EventEnvelope.

Only Ingress Worker creates EventEnvelope.

All events stored immutably in R2.

6. Plan Contract
6.1 Plan Schema (Planner Output)
interface Plan {
  version: "1.0.0";
  traceId: TraceId;
  userIntent: string;
  assumptions: string[];
  actions: PlanAction[];
  receiptSummary: string;
}

6.2 PlanAction Contract

Allowed discriminators:

obsidian.upsert_note

obsidian.append_receipt

todoist.create_task

todoist.close_task

linear.create_issue

linear.update_issue

Rules:

No dynamic action types.

No free-form HTTP calls.

No secret injection.

No nested action execution.

Frontend must treat Plan as read-only artifact.

7. Execution Contract
7.1 ExecutionRun
interface ExecutionRun {
  version: "1.0.0";
  run_id: string;
  trace_id: TraceId;
  plan_id: string;
  state: "RECEIVED" | "EXECUTING" | "DONE" | "FAILED";
  started_at?: ISO8601;
  finished_at?: ISO8601;
  retry_count: number;
}

7.2 ActionExecutionRecord
interface ActionExecutionRecord {
  trace_id: TraceId;
  action_hash: string;
  action_type: string;
  executed_at: ISO8601;
  result_json: unknown;
  verified: boolean;
}


Rules:

Frontend cannot mutate ExecutionRun.

ActionExecutionRecord is append-only.

action_hash MUST be deterministic.

8. Link Graph Contract
8.1 LinkGraph
interface LinkGraph {
  version: "1.0.0";
  trace_id: TraceId;
  obsidian_note_path?: string;
  todoist_task_ids: string[];
  linear_issue_ids: string[];
}


Rules:

LinkGraph is authoritative source for cross-system resolution.

Frontend must display but not mutate directly.

All sync workflows must consult LinkGraph before invoking Claude.

9. Evaluation Contract
9.1 EvalReport
interface EvalReport {
  version: "1.0.0";
  eval_id: string;
  trace_id: TraceId;
  event_id: string;
  plan_id: string;
  run_state: "DONE" | "FAILED" | "EXECUTING" | "UNKNOWN";
  overall_score: number; // 0–5
  verdict: "PASS" | "WARN" | "FAIL";
  category_scores: {
    intent_alignment: number;
    action_minimalism: number;
    determinism_idempotency: number;
    detail_source_correctness: number;
    cross_system_integrity: number;
    verification_coverage: number;
    failure_handling_clarity: number;
  };
  flags: {
    FATAL_SCHEMA: boolean;
    FATAL_SECURITY: boolean;
    FATAL_CONNECTOR: boolean;
    DRIFT: boolean;
    NON_DETERMINISTIC: boolean;
  };
}


Rules:

Evaluator Worker is sole writer.

Frontend displays but cannot edit.

Escalations must occur via separate workflow.

10. API Contracts (Frontend ↔ Backend)

All frontend access must go through a defined API layer.

10.1 GET /traces/:trace_id

Returns:

{
  event: EventEnvelope;
  plan: Plan;
  run: ExecutionRun;
  links: LinkGraph;
  evaluations: EvalReport[];
}


Rules:

Must be read-only.

Must return versioned objects.

Must not expose secrets.

10.2 POST /evaluate?trace_id=...

Manual trigger for evaluator.

Rules:

Only admin or protected role.

Returns evaluation summary only.

Does not expose internal R2 paths.

11. Obsidian Gateway Contract
11.1 Request
POST /upsert-note
{
  notePath: string;
  content: string;
}


Must include:

X-Signature: HMAC_SHA256(timestamp + body)
X-Timestamp: ISO8601


Rules:

Gateway validates timestamp window.

Gateway rejects unsigned requests.

Gateway never exposes filesystem structure.

12. Deterministic Resolution Contract

Before invoking Claude:

System must check:

interface DeterministicResolution {
  canResolveWithoutLLM: boolean;
  strategy?: string;
}


If true:
→ Planner MUST NOT be invoked.

Frontend must not influence this decision.

13. Claude Invocation Contract

Claude must:

Receive PlanningContext only.

Never receive secrets.

Never perform direct external writes.

Produce JSON only.

Match PlanSchema exactly.

If JSON invalid:
→ Reject
→ Log
→ Do not execute

14. Error Contract

All backend errors must return:

{
  error: {
    code: string;
    message: string;
    trace_id?: TraceId;
  }
}


Frontend must:

Not retry blindly.

Display trace_id for debugging.

Log error to observability layer.

15. Breaking Change Policy

A change is breaking if:

Field removed

Field renamed

Field type changed

Enum narrowed

Breaking change requires:

Version bump

Migration file

Evaluator update

Frontend compatibility update

16. Security Contract

Strictly forbidden:

Passing API keys into Claude

Free-form external URL actions in Plan

Unvalidated Plan execution

Frontend direct connector calls

All mutations must pass through Executor Worker.

17. Frontend Responsibilities

Frontend MUST:

Treat all backend artifacts as immutable

Display Plan before execution (if in preview mode)

Surface evaluation score

Never create its own Plan structure

Never store secrets in local state

Frontend MAY:

Filter traces

Render graph of LinkGraph

Display evaluation trend

Trigger manual evaluation

18. Enforcement

These contracts are enforced via:

Zod schemas

TypeScript types

Runtime validation

Evaluator checks

CI schema compatibility tests

19. Auditability

Because of these contracts:

Every trace is reconstructible

Every plan is versioned

Every mutation is replayable

Every evaluation is inspectable

Every drift is detectable

This is intentional.

20. Summary

This CONTRACTS.md ensures:

Strict backend ↔ frontend alignment

Deterministic Claude planning

Cross-system integrity

Idempotent execution

Evaluated system evolution

Safe extensibility

It formalizes the assistant as:

A distributed, schema-enforced, replayable cognitive system — not a collection of loosely connected APIs.
