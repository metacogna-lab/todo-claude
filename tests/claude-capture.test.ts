import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runClaudeCapture } from "../src/services/claudeCapture.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

function deps(overrides: Partial<any> = {}) {
  return {
    generatePlan: vi.fn(async () => samplePlan),
    executePlan: vi.fn(async () => sampleExecution),
    ...overrides,
  };
}

describe("runClaudeCapture", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns plan and execution artifacts and writes receipt when configured", async () => {
    const vault = mkdtempSync(join(tmpdir(), "vault-"));
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key", OBSIDIAN_VAULT_PATH: vault, DRY_RUN: "false" };

    const result = await runClaudeCapture({ text: "Ship the feature" }, deps());
    expect(result.plan.traceId).toBe("trace-123");
    expect(result.execution.traceId).toBe("trace-123");
    expect(result.receipt?.written).toBe(true);
    const note = readFileSync(join(vault, "Projects", "Demo.md"), "utf-8");
    expect(note).toContain("## Summary");
  });

  it("returns receipt metadata but skips write when DRY_RUN is true", async () => {
    const vault = mkdtempSync(join(tmpdir(), "vault-"));
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key", OBSIDIAN_VAULT_PATH: vault, DRY_RUN: "true" };

    const result = await runClaudeCapture({ text: "Plan retro" }, deps());
    expect(result.receipt).not.toBeNull();
    expect(result.receipt?.written).toBe(false);
  });

  it("skips receipt entirely when writeReceipt flag false", async () => {
    const vault = mkdtempSync(join(tmpdir(), "vault-"));
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key", OBSIDIAN_VAULT_PATH: vault };

    const result = await runClaudeCapture({ text: "Skip receipt", writeReceipt: false }, deps());
    expect(result.receipt).toBeNull();
  });
});
