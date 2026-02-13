import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { runClaudeCapture } from "../src/services/claudeCapture.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";

const obsidianUpsertMock = vi.fn(async () => ({ notePath: "Projects/Demo.md" }));

vi.mock("../src/agent/planner.js", () => ({
  generatePlan: vi.fn(),
}));

vi.mock("../src/execution/execute.js", () => ({
  executePlan: vi.fn(),
}));

vi.mock("../src/workflows/receipt.js", () => ({
  buildReceiptMarkdown: vi.fn(() => "## Receipt"),
}));

vi.mock("../src/connectors/obsidian.js", () => ({
  ObsidianRest: vi.fn().mockImplementation(() => ({ upsertNote: obsidianUpsertMock })),
  ObsidianVault: vi.fn().mockImplementation(() => ({ upsertNote: obsidianUpsertMock })),
}));

const { generatePlan } = await import("../src/agent/planner.js");
const { executePlan } = await import("../src/execution/execute.js");
const { buildReceiptMarkdown } = await import("../src/workflows/receipt.js");
const generatePlanMock = generatePlan as unknown as Mock;
const executePlanMock = executePlan as unknown as Mock;
const buildReceiptMarkdownMock = buildReceiptMarkdown as unknown as Mock;

const samplePlan: Plan = {
  traceId: "trace-123",
  userIntent: "demo",
  assumptions: [],
  actions: [
    {
      type: "obsidian.upsert_note",
      notePath: "Projects/Demo.md",
      title: "Demo",
      markdown: "## Summary",
      tags: [],
    },
  ],
  receiptSummary: "Done",
};

const sampleExecution: ExecutionResult = {
  traceId: "trace-123",
  obsidian: { updatedNotes: [] },
  todoist: { createdTasks: [] },
  linear: { createdIssues: [] },
  warnings: [],
};

const originalEnv = { ...process.env };

describe("runClaudeCapture", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
    obsidianUpsertMock.mockClear();
    generatePlanMock.mockResolvedValue(samplePlan);
    executePlanMock.mockResolvedValue(sampleExecution);
    buildReceiptMarkdownMock.mockReturnValue("## Receipt");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns plan and execution artifacts and writes receipt when configured", async () => {
    process.env.OBSIDIAN_VAULT_PATH = "/tmp/vault";
    process.env.DRY_RUN = "false";
    const result = await runClaudeCapture({ text: "Ship the feature" });
    expect(result.plan.traceId).toBe("trace-123");
    expect(result.execution.traceId).toBe("trace-123");
    expect(result.receipt).not.toBeNull();
    expect(result.receipt?.written).toBe(true);
    expect(obsidianUpsertMock).toHaveBeenCalledTimes(1);
  });

  it("returns receipt metadata but skips write when DRY_RUN is true", async () => {
    process.env.OBSIDIAN_VAULT_PATH = "/tmp/vault";
    process.env.DRY_RUN = "true";
    const result = await runClaudeCapture({ text: "Plan retro" });
    expect(result.receipt).not.toBeNull();
    expect(result.receipt?.written).toBe(false);
    expect(obsidianUpsertMock).not.toHaveBeenCalled();
  });

  it("skips receipt entirely when writeReceipt flag false", async () => {
    process.env.OBSIDIAN_VAULT_PATH = "/tmp/vault";
    const result = await runClaudeCapture({ text: "Skip receipt", writeReceipt: false });
    expect(result.receipt).toBeNull();
    expect(obsidianUpsertMock).not.toHaveBeenCalled();
  });
});
