AGENT DATA MODEL

For Agent Consumption During Build + Runtime

1. Conceptual Layers

The system separates data into seven logical layers:

Layer	Purpose
L1	Event ingestion
L2	Planning context
L3	Plan artifact
L4	Execution graph
L5	DetailSource link graph
L6	Verification & audit
L7	Build metadata

Each layer is independently consumable by an agent.

2. Core Identity Model

Everything revolves around Trace Identity.

type TraceId = string;
type PlanId = string;
type RunId = string;
type ActionHash = string;

Trace Identity Invariant

A trace_id MUST:

Originate at ingress

Flow through every system

Appear in:

Obsidian note

Todoist description

Linear issue body

D1 tables

R2 artifacts

This guarantees cross-system join capability.

3. Event Model (L1)
EventEnvelope (Canonical)
interface EventEnvelope {
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
    project_hint?: string;
    priority?: "low" | "normal" | "high";
    workflow?: string;
    lane?: "fast" | "heavy";
  };
}

Agent Consumption During Build

Agent uses this to:

Generate routing logic

Produce workflow inference rules

Simulate ingestion behavior

Generate test fixtures

4. Planning Context Model (L2)

Claude never receives raw unfiltered environment state.

Instead it receives a PlanningContext.

interface PlanningContext {
  trace_id: TraceId;

  workflow: string;
  source: string;
  event_type: string;

  detailSourceCapabilities: DetailSourceCapabilities[];

  linkSnapshot?: LinkGraphSnapshot;

  environmentDefaults: {
    defaultTeamId?: string;
    defaultProjectId?: string;
    defaultAssigneeId?: string;
  };

  historicalSignals?: {
    previousActions?: PlanAction[];
    relatedTraces?: TraceId[];
  };
}

Why This Matters

During build:

Agent must know what actions are allowed.

Agent must know what defaults exist.

Agent must know if deterministic sync is possible.

This prevents hallucinated actions.

5. Plan Artifact Model (L3)
Plan
interface Plan {
  plan_version: "1.0.0";
  traceId: TraceId;
  userIntent: string;
  assumptions: string[];
  actions: PlanAction[];
  receiptSummary: string;
}

PlanAction (Discriminated Union)
type PlanAction =
  | ObsidianUpsert
  | ObsidianAppendReceipt
  | TodoistCreate
  | TodoistClose
  | LinearCreate
  | LinearUpdate;

Agent Build Usage

Agent must:

Generate new Plan versions when schema changes

Validate backward compatibility

Detect deprecated action types

Refuse execution on unknown types

6. Execution Graph Model (L4)

Each plan produces an Execution Graph.

interface ExecutionRun {
  run_id: RunId;
  trace_id: TraceId;
  plan_id: PlanId;
  state: "RECEIVED" | "EXECUTING" | "DONE" | "FAILED";
  started_at?: ISO8601;
  finished_at?: ISO8601;
  retry_count: number;
  error?: string;
}

Action Execution Record
interface ActionExecutionRecord {
  trace_id: TraceId;
  action_hash: ActionHash;
  action_type: string;
  executed_at: ISO8601;
  result_json: unknown;
  verified: boolean;
}

Agent Build Use

Agent can:

Generate action-level idempotency logic

Detect execution gaps

Validate failure-handling flows

Simulate execution states

7. DetailSource Model (L5)

All external systems conform to:

interface DetailSource {
  name: "obsidian" | "todoist" | "linear";

  capabilities: DetailSourceCapabilities;

  verifyConnection(): Promise<void>;
  execute(action: PlanAction): Promise<ExecutionArtifact>;
  verifyResult(artifact: ExecutionArtifact): Promise<boolean>;
}

Capability Model
interface DetailSourceCapabilities {
  source: string;
  supportedActions: string[];
  requiresVerification: boolean;
  supportsIdempotencyKey: boolean;
  supportsReadAfterWriteVerification: boolean;
}

Agent Build Use

Agent can:

Generate execution guards

Disable unsupported actions

Avoid planning invalid actions

8. Link Graph Model (L5.2)

Cross-system mapping:

interface LinkGraph {
  trace_id: TraceId;
  obsidian_note_path?: string;
  todoist_task_ids: string[];
  linear_issue_ids: string[];
}

Agent Build Use

Allows:

Deterministic sync detection

Plan short-circuiting

Cross-system reconciliation logic generation

9. Verification Model (L6)

Verification is a first-class data object.

interface VerificationResult {
  trace_id: TraceId;
  action_hash: ActionHash;
  verification_type:
    | "schema"
    | "idempotency"
    | "connector"
    | "receipt"
    | "cross_system_integrity";

  success: boolean;
  verified_at: ISO8601;
  metadata?: unknown;
}

Agent Build Use

Agent can:

Generate verification pipelines

Identify missing verification layers

Propose schema migrations safely

10. Artifact Storage Model (R2)

All major artifacts stored immutably:

events/{traceId}/{eventId}.json
plans/{traceId}/{planId}.json
receipts/{traceId}/{runId}.json


Metadata stored in D1.

Agent Build Use

Agent can:

Reconstruct full system behavior

Perform regression testing

Score plan quality

11. Idempotency Model
Event-Level
idempotency_keys
(idem_key PRIMARY KEY)


Key format:

{source}:{event_id}

Action-Level (Recommended Extension)
action_results
(trace_id, action_hash PRIMARY KEY)

Agent Build Use

Agent must:

Generate hash logic for action idempotency

Enforce idempotent replays

Avoid duplicate external writes

12. Build Metadata Model (L7)

This is critical for long-term agent evolution.

interface SystemMetadata {
  schema_version: string;
  plan_version_supported: string[];
  deprecated_action_types: string[];
  detailSourceRegistry: DetailSourceCapabilities[];
  enforcementPolicies: EnforcementPolicy[];
}

EnforcementPolicy
interface EnforcementPolicy {
  name: string;
  appliesTo: string;
  rule: string;
  severity: "warn" | "block";
}


Example:

"No direct linear.create_issue without Obsidian note"

"All plans must include receiptSummary"

Agent Build Use

Enforce architectural invariants

Generate migration guides

Block unsafe builds

13. Deterministic Sync Decision Model

Before invoking Claude:

interface DeterministicResolution {
  canResolveWithoutLLM: boolean;
  resolutionStrategy?: string;
  affectedTraceIds?: TraceId[];
}


If true:
→ Skip planner
→ Execute deterministic mutation

This reduces drift and cost.

14. Agent Cognitive Boundaries

The Agent is allowed to:

Generate plans

Update plan schema versions

Suggest new action types

Generate enforcement policies

The Agent is NOT allowed to:

Bypass schema validation

Execute arbitrary HTTP calls

Mutate DetailSources directly

Access secrets

This must be encoded in:

SystemMetadata.enforcementPolicies

15. Build-Time Agent Capabilities

Using this model, an agent can:

1. Generate New Workflow

Add new event types

Extend routing logic

Create new plan action unions

2. Validate Schema Changes

Detect incompatible plan versions

Suggest migrations

3. Generate Deterministic Sync Logic

If link graph supports resolution

Create fast-lane executor logic

4. Auto-Generate Tests

Use stored R2 artifacts

Replay event + plan + execution

5. Run System Health Analysis

Missing receipts

Missing link entries

Orphaned tasks/issues

16. Invariants (Non-Negotiable)

Every external mutation must contain traceId.

Every plan must pass PlanSchema.

Every run must update runs table.

Every execution must update links table if external IDs created.

Every trace must have receipt written to Obsidian.

These invariants are part of EnforcementPolicy.

17. Why This Model Works for Agent Consumption

It is:

Strongly typed

Deterministic

Versionable

Schema-validated

Replayable

Cross-system linked

Policy enforced

LLM-decoupled from execution

It allows the agent to:

Think

Plan

Evolve

Extend

Audit

Without ever compromising system integrity.

18. Final Structural Summary

The full agent-consumable system can be represented as:

EventEnvelope
    ↓
PlanningContext
    ↓
Plan
    ↓
ExecutionRun
    ↓
ActionExecutionRecords
    ↓
DetailSourceArtifacts
    ↓
LinkGraph
    ↓
VerificationResults
    ↓
Receipt


Each stage is stored.
Each stage is queryable.
Each stage is versioned.
Each stage is auditable.