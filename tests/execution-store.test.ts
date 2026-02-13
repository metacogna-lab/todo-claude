import { describe, it, expect, beforeEach } from "vitest";
import { logExecutionResult, listExecutionRuns, listDetailSourceLinks } from "../src/execution/store.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import { resetDb } from "../src/storage/db.js";

const plan: Plan = {
  traceId: "trace-store-1",
  userIntent: "ship feature",
  assumptions: [],
  actions: [
    {
      type: "obsidian.upsert_note",
      notePath: "Projects/Test.md",
      title: "Test note",
      markdown: "## body",
      tags: [],
    },
    {
      type: "todoist.create_task",
      content: "Do thing",
      description: "desc",
      due: undefined,
      priority: 1,
      projectId: "__DEFAULT_PROJECT__",
      labels: [],
    },
    {
      type: "linear.create_issue",
      teamId: "__DEFAULT_TEAM__",
      title: "Issue",
      description: "desc",
      assigneeId: "__DEFAULT_ASSIGNEE__",
      labels: [],
    },
  ],
  receiptSummary: "created note + tasks",
};

const result: ExecutionResult = {
  traceId: "trace-store-1",
  obsidian: { updatedNotes: [{ notePath: "Projects/Test.md", uri: "obsidian://test" }] },
  todoist: { createdTasks: [{ id: "todo-1", content: "Do thing", url: "https://todo" }] },
  linear: { createdIssues: [{ id: "ln-1", title: "Issue", url: "https://linear" }] },
  warnings: [],
};

beforeEach(() => {
  process.env.APP_DB_PATH = ":memory:";
  resetDb();
});

describe("execution store", () => {
  it("logs runs and links for artifacts", async () => {
    const startedAt = "2024-07-01T10:00:00.000Z";
    const finishedAt = "2024-07-01T10:00:10.000Z";

    await logExecutionResult({ plan, result, startedAt, finishedAt });

    const runs = await listExecutionRuns(plan.traceId);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.actionsCount).toBe(plan.actions.length);

    const links = await listDetailSourceLinks(plan.traceId);
    expect(links).toHaveLength(3);
    const sources = links.map(l => l.sourceType).sort();
    expect(sources).toEqual(["linear", "obsidian", "todoist"]);
  });
});
