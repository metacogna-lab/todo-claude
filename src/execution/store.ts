import { randomUUID } from "node:crypto";
import type { Plan, ExecutionResult } from "../plan/schema.js";
import { getDb } from "../storage/db.js";
import { ExecutionRunSchema, type ExecutionRunRecord, DetailSourceLinkSchema, type DetailSourceLink } from "../schema/execution.js";
import {
  CONTRACT_VERSION,
  ExecutionRunSchema as ContractExecutionRunSchema,
  type ExecutionRun as ContractExecutionRun,
  LinkGraphSchema as ContractLinkGraphSchema,
  type LinkGraph as ContractLinkGraph,
} from "@assistant/contracts";

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

const defaultPlanId = (traceId: string) => `${traceId}-plan`;

export function toContractExecutionRun(
  run: ExecutionRunRecord,
  options?: { planId?: string; state?: ContractExecutionRun["state"]; retryCount?: number }
): ContractExecutionRun {
  return ContractExecutionRunSchema.parse({
    version: CONTRACT_VERSION,
    run_id: run.id,
    trace_id: run.traceId,
    plan_id: options?.planId ?? defaultPlanId(run.traceId),
    state: options?.state ?? "DONE",
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    retry_count: options?.retryCount ?? 0,
  });
}

export function toContractLinkGraph(traceId: string, links: DetailSourceLink[]): ContractLinkGraph {
  return ContractLinkGraphSchema.parse({
    version: CONTRACT_VERSION,
    trace_id: traceId,
    obsidian_note_path: links.find(link => link.sourceType === "obsidian")?.externalId,
    todoist_task_ids: links.filter(link => link.sourceType === "todoist").map(link => link.externalId),
    linear_issue_ids: links.filter(link => link.sourceType === "linear").map(link => link.externalId),
  });
}

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

type ExecutionRow = {
  id: string;
  trace_id: string;
  plan_user_intent: string;
  started_at: string;
  finished_at: string;
  summary: string | null;
  actions_count: number;
};

type LinkRow = {
  id: string;
  trace_id: string;
  source_type: "obsidian" | "todoist" | "linear";
  external_id: string;
  uri: string | null;
  metadata: string | null;
  created_at: string;
};

export async function listExecutionRuns(traceId?: string): Promise<ExecutionRunRecord[]> {
  const db = getDb();
  const rows: ExecutionRow[] = traceId
    ? db.query<ExecutionRow>(`SELECT * FROM execution_runs WHERE trace_id = ? ORDER BY started_at DESC`).all(traceId)
    : db.query<ExecutionRow>(`SELECT * FROM execution_runs ORDER BY started_at DESC`).all();
  return rows.map((row: ExecutionRow) => ExecutionRunSchema.parse({
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
  const rows = db.query<LinkRow>(`SELECT * FROM detail_source_links WHERE trace_id = ? ORDER BY created_at DESC`).all(traceId);
  return rows.map((row: LinkRow) => DetailSourceLinkSchema.parse({
    id: row.id,
    traceId: row.trace_id,
    sourceType: row.source_type,
    externalId: row.external_id,
    uri: row.uri ?? undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.created_at,
  }));
}
