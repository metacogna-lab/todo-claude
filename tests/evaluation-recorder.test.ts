import { beforeEach, describe, expect, it } from "vitest";
import { recordEvaluationSnapshot } from "../src/evals/recorder.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import type { VerificationResult } from "../src/schema/verification.js";
import { resetDb } from "../src/storage/db.js";
import { ingestEvent } from "../src/events/ingest.js";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
    source: "cli",
    type: "capture",
    occurred_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    trace_id: plan.traceId,
    payload: { text: "hello" },
    context: { user_id: "test", workflow: "capture" },
  });
});

it("writes evaluation snapshot to file", async () => {
  const file = await recordEvaluationSnapshot({ plan, execution, verification });
  expect(file).toBeTruthy();
  const data = JSON.parse(readFileSync(file!, "utf-8"));
  expect(data.traceId).toBe(plan.traceId);
  expect(data.verification.status).toBe("passing");
  expect(data.event.trace_id).toBe(plan.traceId);
});
