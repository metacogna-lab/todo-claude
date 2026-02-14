import { describe, it, expect, beforeEach } from "vitest";
import { logExecutionResult, listDetailSourceLinks, toContractExecutionRun, toContractLinkGraph } from "../src/execution/store.js";
import { PlanSchema } from "../src/plan/schema.js";
import type { ExecutionResult } from "../src/plan/schema.js";
import { resetDb } from "../src/storage/db.js";
import { assertSchema, ExecutionRunSchema as ContractExecutionRunSchema, LinkGraphSchema as ContractLinkGraphSchema } from "@assistant/contracts";

const plan = PlanSchema.parse({
  version: "1.0.0",
  traceId: "trace-contract-123",
  userIntent: "test",
  assumptions: [],
  actions: [{ type: "todoist.create_task", content: "Do it", labels: [] }],
  receiptSummary: "done",
});

const execution: ExecutionResult = {
  traceId: plan.traceId,
  obsidian: { updatedNotes: [] },
  todoist: { createdTasks: [{ id: "td1", content: "Do it", url: "https://todoist" }] },
  linear: { createdIssues: [] },
  warnings: [],
};

beforeEach(() => {
  resetDb();
});

describe("contracts enforcement", () => {
  it("stores runs and links that satisfy contract schemas", async () => {
    const run = await logExecutionResult({
      plan,
      result: execution,
      startedAt: "2024-07-01T10:00:00.000Z",
      finishedAt: "2024-07-01T10:00:05.000Z",
    });
    const contractRun = toContractExecutionRun(run);
    expect(() => assertSchema(ContractExecutionRunSchema, contractRun)).not.toThrow();

    const links = await listDetailSourceLinks(plan.traceId);
    const contractLinks = toContractLinkGraph(plan.traceId, links);
    expect(() => assertSchema(ContractLinkGraphSchema, contractLinks)).not.toThrow();
  });
});
