import { loadEnv } from "../config/env.js";
import { getDb } from "../storage/db.js";
import { PlanningContextSchema, type PlanningContext } from "../schema/planningContext.js";
import { type EventEnvelope } from "../schema/event.js";
import { PlanAction } from "../plan/schema.js";

const insertContextStmt = () => getDb().query(`
  INSERT INTO planning_contexts (
    trace_id, workflow, source, event_type, snapshot, created_at
  ) VALUES (
    $trace_id, $workflow, $source, $event_type, $snapshot, $created_at
  )
  ON CONFLICT(trace_id) DO UPDATE SET
    workflow=excluded.workflow,
    source=excluded.source,
    event_type=excluded.event_type,
    snapshot=excluded.snapshot,
    created_at=excluded.created_at;
`);

function deriveDetailSourceCapabilities(env: ReturnType<typeof loadEnv>): string[] {
  const capabilities: string[] = [];
  if (env.OBSIDIAN_VAULT_PATH || env.OBSIDIAN_REST_URL) capabilities.push("obsidian");
  if (env.TODOIST_API_TOKEN) capabilities.push("todoist");
  if (env.LINEAR_API_TOKEN) capabilities.push("linear");
  return capabilities;
}

function deriveEnvironmentDefaults(env: ReturnType<typeof loadEnv>) {
  return {
    defaultTeamId: env.LINEAR_DEFAULT_TEAM_ID,
    defaultProjectId: env.TODOIST_DEFAULT_PROJECT_ID,
    defaultAssigneeId: env.LINEAR_DEFAULT_ASSIGNEE_ID,
  };
}

export async function upsertPlanningContextFromEvent(event: EventEnvelope): Promise<PlanningContext> {
  const env = loadEnv();
  const context = PlanningContextSchema.parse({
    traceId: event.trace_id,
    workflow: event.context.workflow,
    source: event.source,
    eventType: event.type,
    detailSourceCapabilities: deriveDetailSourceCapabilities(env),
    environmentDefaults: deriveEnvironmentDefaults(env),
    historicalSignals: undefined as { previousActions?: PlanAction[] } | undefined,
    createdAt: new Date().toISOString(),
  });

  insertContextStmt().run({
    $trace_id: context.traceId,
    $workflow: context.workflow,
    $source: context.source,
    $event_type: context.eventType,
    $snapshot: JSON.stringify(context),
    $created_at: context.createdAt,
  });

  return context;
}

export async function getPlanningContext(traceId: string): Promise<PlanningContext | null> {
  const db = getDb();
  const row = db.query(`SELECT snapshot FROM planning_contexts WHERE trace_id = ?`).get(traceId) as any;
  if (row?.snapshot) {
    return PlanningContextSchema.parse(JSON.parse(row.snapshot));
  }
  const { getLatestEvent } = await import("../events/ingest.js");
  const event = await getLatestEvent(traceId);
  if (!event) return null;
  return upsertPlanningContextFromEvent(event);
}

export async function rebuildPlanningContext(traceId: string): Promise<PlanningContext | null> {
  const { getLatestEvent } = await import("../events/ingest.js");
  const event = await getLatestEvent(traceId);
  if (!event) return null;
  return upsertPlanningContextFromEvent(event);
}
