import { randomUUID } from "node:crypto";
import type { Plan, ExecutionResult } from "../plan/schema.js";
import { getDb } from "../storage/db.js";
import { ExecutionRunSchema, type ExecutionRunRecord, DetailSourceLinkSchema, type DetailSourceLink } from "../schema/execution.js";

function insertRunStmt() {
  return getDb().query(`
    INSERT INTO execution_runs (
      id, trace_id, plan_user_intent, started_at, finished_at, summary, actions_count
    ) VALUES (
      $id, $trace_id, $plan_user_intent, $started_at, $finished_at, $summary, $actions_count
    );
  `);
}

function insertActionStmt() {
  return getDb().query(`
    INSERT INTO action_records (
      id, run_id, action_type, payload, status
    ) VALUES (
      $id, $run_id, $action_type, $payload, $status
    );
  `);
}

function insertLinkStmt() {
  return getDb().query(`
    INSERT INTO detail_source_links (
      id, trace_id, source_type, external_id, uri, metadata, created_at
    ) VALUES (
      $id, $trace_id, $source_type, $external_id, $uri, $metadata, $created_at
    );
  `);
}

export type LogExecutionParams = {
  plan: Plan;
  result: ExecutionResult;
  startedAt: string;
  finishedAt: string;
};

export async function logExecutionResult(params: LogExecutionParams): Promise<ExecutionRunRecord> {
  const runId = randomUUID();
  const run = ExecutionRunSchema.parse({
    id: runId,
    traceId: params.result.traceId,
    planUserIntent: params.plan.userIntent,
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    summary: params.plan.receiptSummary,
    actionsCount: params.plan.actions.length,
  });

  const db = getDb();
  const actionStmt = insertActionStmt();
  const linkStmt = insertLinkStmt();

  db.transaction(() => {
    insertRunStmt().run({
      $id: run.id,
      $trace_id: run.traceId,
      $plan_user_intent: run.planUserIntent,
      $started_at: run.startedAt,
      $finished_at: run.finishedAt,
      $summary: run.summary ?? null,
      $actions_count: run.actionsCount,
    });

    for (const action of params.plan.actions) {
      actionStmt.run({
        $id: randomUUID(),
        $run_id: run.id,
        $action_type: action.type,
        $payload: JSON.stringify(action),
        $status: "success",
      });
    }

    buildLinksFromResult(params.result).forEach(link => {
      linkStmt.run({
        $id: link.id,
        $trace_id: link.traceId,
        $source_type: link.sourceType,
        $external_id: link.externalId,
        $uri: link.uri ?? null,
        $metadata: link.metadata ? JSON.stringify(link.metadata) : null,
        $created_at: link.createdAt,
      });
    });
  })();

  return run;
}

function buildLinksFromResult(result: ExecutionResult): DetailSourceLink[] {
  const links: DetailSourceLink[] = [];
  const now = new Date().toISOString();

  result.obsidian.updatedNotes.forEach(note => {
    links.push(DetailSourceLinkSchema.parse({
      id: randomUUID(),
      traceId: result.traceId,
      sourceType: "obsidian",
      externalId: note.notePath,
      uri: note.uri,
      metadata: {},
      createdAt: now,
    }));
  });

  result.todoist.createdTasks.forEach(task => {
    links.push(DetailSourceLinkSchema.parse({
      id: randomUUID(),
      traceId: result.traceId,
      sourceType: "todoist",
      externalId: task.id,
      uri: task.url,
      metadata: { content: task.content },
      createdAt: now,
    }));
  });

  result.linear.createdIssues.forEach(issue => {
    links.push(DetailSourceLinkSchema.parse({
      id: randomUUID(),
      traceId: result.traceId,
      sourceType: "linear",
      externalId: issue.id,
      uri: issue.url,
      metadata: { title: issue.title },
      createdAt: now,
    }));
  });

  return links;
}

export async function listExecutionRuns(traceId?: string): Promise<ExecutionRunRecord[]> {
  const db = getDb();
  const rows = traceId
    ? db.query(`SELECT * FROM execution_runs WHERE trace_id = ? ORDER BY started_at DESC`).all(traceId)
    : db.query(`SELECT * FROM execution_runs ORDER BY started_at DESC`).all();
  return rows.map(row => ExecutionRunSchema.parse({
    id: row.id,
    traceId: row.trace_id,
    planUserIntent: row.plan_user_intent,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    summary: row.summary ?? undefined,
    actionsCount: row.actions_count,
  }));
}

export async function listDetailSourceLinks(traceId: string): Promise<DetailSourceLink[]> {
  const db = getDb();
  const rows = db.query(`SELECT * FROM detail_source_links WHERE trace_id = ? ORDER BY created_at DESC`).all(traceId);
  return rows.map(row => DetailSourceLinkSchema.parse({
    id: row.id,
    traceId: row.trace_id,
    sourceType: row.source_type,
    externalId: row.external_id,
    uri: row.uri ?? undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.created_at,
  }));
}
