import { beforeEach, describe, expect, it } from "vitest";
import { recordEvaluationSnapshot } from "../src/evals/recorder.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import type { VerificationResult } from "../src/schema/verification.js";
import type { ExecutionRunRecord, DetailSourceLink } from "../src/execution/store.js";
import { resetDb } from "../src/storage/db.js";
import { ingestEvent } from "../src/events/ingest.js";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TraceResponseSchema } from "@assistant/contracts";

const plan: Plan = {
  traceId: "trace-eval-1",
  userIntent: "test",
  assumptions: [],
  actions: [],
  receiptSummary: "done",
};

const execution: ExecutionResult = {
  traceId: plan.traceId,
  obsidian: { updatedNotes: [] },
  todoist: { createdTasks: [] },
  linear: { createdIssues: [] },
  warnings: [],
};

const verification: VerificationResult = {
  id: randomUUID(),
  traceId: plan.traceId,
  runId: randomUUID(),
  status: "passing",
  issues: [],
  createdAt: new Date().toISOString(),
};

beforeEach(async () => {
  resetDb();
  process.env.APP_DB_PATH = ":memory:";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.EVALS_DIR = mkdtempSync(join(tmpdir(), "evals-"));
  await ingestEvent({
    event_id: randomUUID(),
    source: "manual",
    type: "capture",
    occurred_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    trace_id: plan.traceId,
    payload: { text: "hello" },
    context: { user_id: "test", workflow: "capture" },
  });
});

it("writes evaluation snapshot to file", async () => {
  const run: ExecutionRunRecord = {
    id: randomUUID(),
    traceId: plan.traceId,
    planUserIntent: plan.userIntent,
    startedAt: "2024-07-01T10:00:00.000Z",
    finishedAt: "2024-07-01T10:00:05.000Z",
  };
  const links: DetailSourceLink[] = [
    { id: randomUUID(), traceId: plan.traceId, sourceType: "obsidian", externalId: "Projects/Demo.md", uri: undefined, metadata: undefined, createdAt: "2024-07-01T10:00:05.000Z" },
  ];
  const file = await recordEvaluationSnapshot({ plan, execution, verification, run, links });
  expect(file).toBeTruthy();
  const data = JSON.parse(readFileSync(file!, "utf-8"));
  const parsed = TraceResponseSchema.parse(data);
  expect(parsed.plan.traceId).toBe(plan.traceId);
  expect(parsed.links.obsidian_note_path).toBe("Projects/Demo.md");
});
