import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { getLatestEvent } from "../events/ingest.js";
import type { Plan, ExecutionResult } from "../plan/schema.js";
import type { VerificationResult } from "../schema/verification.js";
import { loadEnv } from "../config/env.js";
import { logger } from "../logging/logger.js";
import type { ExecutionRunRecord, DetailSourceLink } from "../execution/store.js";
import { CONTRACT_VERSION, TraceResponseSchema, EvalReportSchema, assertSchema } from "@assistant/contracts";

const snapshotBase = () => resolve(process.cwd(), loadEnv().EVALS_DIR ?? "data/evals");

export type EvaluationSnapshotInput = {
  plan: Plan;
  execution: ExecutionResult;
  verification: VerificationResult;
  run: ExecutionRunRecord;
  links: DetailSourceLink[];
};

export async function recordEvaluationSnapshot(input: EvaluationSnapshotInput): Promise<string | null> {
  try {
    const baseDir = snapshotBase();
    const traceDir = resolve(baseDir, input.plan.traceId);
    await mkdir(traceDir, { recursive: true });
    const event = await getLatestEvent(input.plan.traceId);
    const payload = buildTraceResponsePayload(input, event);
    const file = resolve(traceDir, `${Date.now()}-${randomUUID()}.json`);
    await writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
    return file;
  } catch (error) {
    logger.warn({ err: error }, "Failed to record evaluation snapshot");
    return null;
  }
}

type LatestEvent = Awaited<ReturnType<typeof getLatestEvent>>;

const allowedSources = new Set(["manual", "linear", "todoist", "obsidian"]);

function buildTraceResponsePayload(
  input: EvaluationSnapshotInput,
  event: LatestEvent
) {
  if (!event) throw new Error("No event available for trace");
  const source = allowedSources.has(event.source as any) ? event.source : "manual";
  const plan = {
    version: CONTRACT_VERSION,
    traceId: input.plan.traceId,
    userIntent: input.plan.userIntent,
    assumptions: input.plan.assumptions,
    actions: input.plan.actions,
    receiptSummary: input.plan.receiptSummary,
  };
  const run = {
    version: CONTRACT_VERSION,
    run_id: input.run.id,
    trace_id: input.run.traceId,
    plan_id: `${input.run.traceId}-plan`,
    state: "DONE" as const,
    started_at: input.run.startedAt,
    finished_at: input.run.finishedAt,
    retry_count: 0,
  };
  const links = {
    version: CONTRACT_VERSION,
    trace_id: input.plan.traceId,
    obsidian_note_path: input.links.find(l => l.sourceType === "obsidian")?.externalId,
    todoist_task_ids: input.links.filter(l => l.sourceType === "todoist").map(l => l.externalId),
    linear_issue_ids: input.links.filter(l => l.sourceType === "linear").map(l => l.externalId),
  };
  const evalReport = buildEvalReport(input.verification, input.plan.traceId);
  const payload = {
    event: {
      version: CONTRACT_VERSION,
      ...event,
      source,
    },
    plan,
    run,
    links,
    evaluations: [evalReport],
  };
  return assertSchema(TraceResponseSchema, payload);
}

function buildEvalReport(verification: VerificationResult, traceId: string) {
  const passing = verification.status === "passing";
  const score = passing ? 5 : 1;
  const report = {
    version: CONTRACT_VERSION,
    eval_id: randomUUID(),
    trace_id: traceId,
    plan_id: `${traceId}-plan`,
    overall_score: score,
    verdict: passing ? "PASS" : "FAIL",
    category_scores: {
      intent_alignment: score,
      action_minimalism: score,
      determinism_idempotency: score,
      detail_source_correctness: score,
      cross_system_integrity: score,
      verification_coverage: score,
      failure_handling_clarity: score,
    },
    flags: {
      FATAL_SCHEMA: !passing,
      FATAL_SECURITY: false,
      FATAL_CONNECTOR: !passing,
      DRIFT: false,
      NON_DETERMINISTIC: false,
    },
  };
  return assertSchema(EvalReportSchema, report);
}

export async function loadLatestTraceContract(traceId: string): Promise<any | null> {
  const dir = resolve(snapshotBase(), traceId);
  try {
    const files = await readdir(dir);
    const candidates = files.filter(f => f.endsWith(".json")).sort();
    const latest = candidates.at(-1);
    if (!latest) return null;
    const data = JSON.parse(await readFile(resolve(dir, latest), "utf-8"));
    return assertSchema(TraceResponseSchema, data);
  } catch (error) {
    logger.warn({ traceId, err: error }, "Failed to load trace contract");
    return null;
  }
}
