import { beforeEach, describe, expect, it } from "vitest";

const baseEvent = {
  event_id: "evt-123",
  source: "cli",
  type: "capture.requested",
  occurred_at: "2024-07-01T10:00:00.000Z",
  received_at: "2024-07-01T10:00:01.000Z",
  trace_id: "trace-test-123",
  payload: { text: "Plan a feature" },
  context: {
    user_id: "user-1",
    workflow: "capture",
    project_hint: "alpha",
    priority: "high" as const,
  },
};

beforeEach(async () => {
  process.env.APP_DB_PATH = ":memory:";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.LINEAR_DEFAULT_TEAM_ID = "team-123";
  process.env.TODOIST_DEFAULT_PROJECT_ID = "proj-456";
  process.env.TODOIST_DEFAULT_LABELS = "alpha,beta";
  process.env.LINEAR_DEFAULT_ASSIGNEE_ID = "user-linear";
  delete process.env.OBSIDIAN_VAULT_PATH; // optional

  const db = await import("../src/storage/db.js");
  db.resetDb();
});

describe("event ingestion + planning context", () => {
  it("stores events and builds deterministic planning context snapshots", async () => {
    const { ingestEvent, listEventsByTrace } = await import("../src/events/ingest.js");
    const { getPlanningContext } = await import("../src/context/planning.js");

    await ingestEvent(baseEvent);

    const stored = await listEventsByTrace(baseEvent.trace_id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.event_id).toBe(baseEvent.event_id);

    const context = await getPlanningContext(baseEvent.trace_id);
    expect(context).not.toBeNull();
    expect(context?.traceId).toBe(baseEvent.trace_id);
    expect(context?.workflow).toBe("capture");
    expect(context?.environmentDefaults.defaultTeamId).toBe("team-123");
    expect(context?.detailSourceCapabilities).toContain("linear");
  });

  it("rebuilds planning context when defaults change", async () => {
    const { ingestEvent } = await import("../src/events/ingest.js");
    const { getPlanningContext, rebuildPlanningContext } = await import("../src/context/planning.js");

    await ingestEvent(baseEvent);
    let context = await getPlanningContext(baseEvent.trace_id);
    expect(context?.environmentDefaults.defaultProjectId).toBe("proj-456");

    process.env.TODOIST_DEFAULT_PROJECT_ID = "proj-789";
    context = await rebuildPlanningContext(baseEvent.trace_id);
    expect(context?.environmentDefaults.defaultProjectId).toBe("proj-789");
  });
});
