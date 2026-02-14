import { beforeEach, expect, it } from "vitest";
import { logExecutionResult } from "../src/execution/store.js";
import {
  verifyExecution,
  listVerificationResults,
} from "../src/verification/service.js";
import { resetDb } from "../src/storage/db.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import { recordEvidence } from "../src/observability/evidence.js";

const planBase: Plan = {
  traceId: "trace-verify-1",
  userIntent: "ship feature",
  assumptions: [],
  actions: [],
  receiptSummary: "summary",
};

beforeEach(() => {
  process.env.APP_DB_PATH = ":memory:";
  resetDb();
});

it("passes verification when detail links exist", async () => {
  const plan = { ...planBase, actions: [] };
  const result: ExecutionResult = {
    traceId: plan.traceId,
    obsidian: { updatedNotes: [{ notePath: "Projects/Note.md" }] },
    todoist: { createdTasks: [] },
    linear: { createdIssues: [] },
    warnings: [],
  };
  const run = await logExecutionResult({
    plan,
    result,
    startedAt: "2024-07-01T10:00:00.000Z",
    finishedAt: "2024-07-01T10:00:01.000Z",
  });
  await recordEvidence({
    traceId: plan.traceId,
    kind: "langfuse",
    reference: "trace",
    status: "recorded",
  });
  await recordEvidence({
    traceId: plan.traceId,
    kind: "devtools",
    reference: "docs/generated/devtools/demo.har",
    status: "recorded",
  });
  const verification = await verifyExecution(plan.traceId, run.id);
  expect(verification.status).toBe("passing");
  const all = await listVerificationResults(plan.traceId);
  expect(all).toHaveLength(1);
});

it("fails verification when detail links missing", async () => {
  const plan = { ...planBase, traceId: "trace-verify-2" };
  const result: ExecutionResult = {
    traceId: plan.traceId,
    obsidian: { updatedNotes: [] },
    todoist: { createdTasks: [] },
    linear: { createdIssues: [] },
    warnings: [],
  };
  const run = await logExecutionResult({
    plan,
    result,
    startedAt: "2024-07-01T10:00:00.000Z",
    finishedAt: "2024-07-01T10:00:01.000Z",
  });
  const verification = await verifyExecution(plan.traceId, run.id);
  expect(verification.status).toBe("failing");
  const codes = verification.issues.map((issue) => issue.code);
  expect(codes).toContain("detail_links_missing");
  expect(codes).toContain("langfuse_trace_missing");
  expect(codes).toContain("devtools_artifact_missing");
});
