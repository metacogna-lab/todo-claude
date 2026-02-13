import { describe, it, expect } from "vitest";
import { PlanSchema } from "../src/plan/schema.js";

describe("Plan schema", () => {
  it("validates a minimal plan", () => {
    const plan = {
      traceId: "abc12345",
      userIntent: "test",
      assumptions: [],
      actions: [
        { type: "todoist.create_task", content: "Do the thing", labels: [] }
      ],
      receiptSummary: "Created one task"
    };
    const parsed = PlanSchema.parse(plan);
    expect(parsed.actions.length).toBe(1);
  });
});
