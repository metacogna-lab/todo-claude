import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGraphQLServer } from "../src/graphql/server.js";
import { taskRegistry } from "../src/services/taskRegistry.js";
import { resetMetrics } from "../src/observability/monitoring.js";
import * as ClaudeCaptureService from "../src/services/claudeCapture.js";
import * as WebSearchPlugin from "../src/plugins/webSearch.js";
import { recordEvaluationSnapshot } from "../src/evals/recorder.js";
import type { Plan, ExecutionResult } from "../src/plan/schema.js";
import type { VerificationResult } from "../src/schema/verification.js";
import type {
  ExecutionRunRecord,
  DetailSourceLink,
} from "../src/execution/store.js";
import { TraceResponseSchema } from "@assistant/contracts";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ingestEvent } from "../src/events/ingest.js";
import { resetDb } from "../src/storage/db.js";
import { randomUUID } from "node:crypto";

const mockResult = {
  plan: {
    traceId: "trace-mock",
    userIntent: "demo",
    assumptions: [],
    actions: [
      {
        type: "obsidian.upsert_note",
        notePath: "Projects/Demo.md",
        title: "Demo",
        markdown: "Summary",
        tags: [],
      },
    ],
    receiptSummary: "Receipt summary",
  },
  execution: {
    traceId: "trace-mock",
    obsidian: { updatedNotes: [] },
    todoist: { createdTasks: [] },
    linear: { createdIssues: [] },
    warnings: [],
  },
  receipt: {
    notePath: "Projects/Demo.md",
    receiptMarkdown: "Receipt",
    finalMarkdown: "# Demo",
    written: false,
  },
};

const runClaudeCaptureSpy = vi
  .spyOn(ClaudeCaptureService, "runClaudeCapture")
  .mockImplementation(async () => mockResult);

afterAll(() => {
  vi.restoreAllMocks();
});

async function graphqlRequest(
  server: ReturnType<typeof buildGraphQLServer>,
  query: string,
  variables?: Record<string, unknown>
) {
  const response = await server.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

describe("GraphQL server", () => {
  beforeEach(() => {
    taskRegistry.clear();
    resetMetrics();
  });

  it("captures a thought via mutation and exposes it via query", async () => {
    const server = buildGraphQLServer();
    const mutation = /* GraphQL */ `
      mutation Capture($input: CaptureThoughtInput!) {
        captureThought(input: $input) {
          traceId
          task {
            id
            title
            status
            labels
          }
        }
      }
    `;

    const variables = {
      input: { text: "GraphQL all the things", labels: ["obs"] },
    };
    const result = await graphqlRequest(server, mutation, variables);
    expect(result.errors).toBeUndefined();
    expect(result.data.captureThought.task.title).toBe(
      "GraphQL all the things"
    );
    expect(result.data.captureThought.traceId).toHaveLength(36);

    const query = /* GraphQL */ `
      query {
        tasks {
          title
          labels
        }
      }
    `;
    const listResult = await graphqlRequest(server, query);
    expect(listResult.errors).toBeUndefined();
    expect(listResult.data.tasks).toHaveLength(1);
    expect(listResult.data.tasks[0].labels).toContain("obs");
  });

  it("reports health metrics after operations", async () => {
    const server = buildGraphQLServer();
    await graphqlRequest(server, `query { tasks { id } }`);
    const health = await graphqlRequest(
      server,
      `query { health { status samples } }`
    );
    expect(health.errors).toBeUndefined();
    expect(health.data.health.samples).toBeGreaterThan(0);
  });

  it("delegates captureWithClaude mutation to orchestrator service", async () => {
    const server = buildGraphQLServer();
    const mutation = /* GraphQL */ `
      mutation ClaudeCapture($input: CaptureWithClaudeInput!) {
        captureWithClaude(input: $input) {
          plan {
            traceId
            actions {
              type
            }
          }
          execution {
            warnings
          }
          receipt {
            notePath
            written
          }
        }
      }
    `;
    const variables = { input: { text: "Ship release", writeReceipt: true } };
    const response = await graphqlRequest(server, mutation, variables);
    expect(response.errors).toBeUndefined();
    expect(response.data.captureWithClaude.plan.traceId).toBe("trace-mock");
    expect(response.data.captureWithClaude.receipt.notePath).toBe(
      "Projects/Demo.md"
    );
    expect(runClaudeCaptureSpy).toHaveBeenCalledWith({
      text: "Ship release",
      writeReceipt: true,
    });
  });

  it("supports webSearchResults query when plugin enabled", async () => {
    const server = buildGraphQLServer();
    const spy = vi.spyOn(WebSearchPlugin, "webSearch").mockResolvedValue({
      query: "bun js",
      answer: "Bun is a fast all-in-one JavaScript runtime",
      results: [
        {
          title: "Bun",
          url: "https://bun.sh",
          content: "Bun is a fast JavaScript runtime",
        },
      ],
    });
    const query = /* GraphQL */ `
      query Search($query: String!) {
        webSearch(query: $query) {
          query
          answer
          results {
            title
            url
          }
        }
      }
    `;
    const res = await graphqlRequest(server, query, { query: "bun js" });
    expect(res.errors).toBeUndefined();
    expect(res.data.webSearch.query).toBe("bun js");
    expect(res.data.webSearch.results[0].url).toContain("bun.sh");
    expect(spy).toHaveBeenCalled();
  });

  it("supports previewEdits without applying changes", async () => {
    const server = buildGraphQLServer();
    const query = /* GraphQL */ `
      mutation Preview($input: PreviewEditsInput!) {
        previewEdits(input: $input) {
          edits {
            path
            diff
          }
        }
      }
    `;
    const variables = {
      input: { instructions: "Add a heading", files: ["README.md"] },
    };
    const response = await graphqlRequest(server, query, variables);
    expect(response.errors).toBeUndefined();
    expect(response.data.previewEdits.edits).toBeInstanceOf(Array);
  });

  it("exposes trace contract snapshots", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "evals-"));
    process.env.EVALS_DIR = tempDir;
    process.env.OPENAI_API_KEY = "test-key";
    process.env.APP_DB_PATH = ":memory:";
    const plan: Plan = {
      traceId: "trace-contract-1",
      userIntent: "demo",
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
    const runId = randomUUID();
    const verification: VerificationResult = {
      id: randomUUID(),
      traceId: plan.traceId,
      runId,
      status: "passing",
      issues: [],
      createdAt: new Date().toISOString(),
    };
    const run: ExecutionRunRecord = {
      id: runId,
      traceId: plan.traceId,
      planUserIntent: plan.userIntent,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    const links: DetailSourceLink[] = [];
    resetDb();
    await ingestEvent({
      event_id: "evt-1",
      source: "manual",
      type: "capture",
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      trace_id: plan.traceId,
      payload: {},
      context: { user_id: "user-1", workflow: "capture" },
    });
    const snapshotFile = await recordEvaluationSnapshot({
      plan,
      execution,
      verification,
      run,
      links,
    });
    expect(snapshotFile).toBeTruthy();

    const server = buildGraphQLServer();
    const query = /* GraphQL */ `
      query TraceContract($traceId: String!) {
        traceContract(traceId: $traceId)
      }
    `;
    const res = await graphqlRequest(server, query, { traceId: plan.traceId });
    expect(res.errors).toBeUndefined();
    const contract = TraceResponseSchema.parse(res.data.traceContract);
    expect(contract.plan.traceId).toBe(plan.traceId);
  });

  it("lists and replays evaluation snapshots", async () => {
    const plan: Plan = {
      version: "1.0.0",
      traceId: "trace-gql-snap",
      userIntent: "demo plan",
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
    const runId = randomUUID();
    const verification: VerificationResult = {
      id: randomUUID(),
      traceId: plan.traceId,
      runId,
      status: "passing",
      issues: [],
      createdAt: new Date().toISOString(),
    };
    const run: ExecutionRunRecord = {
      id: runId,
      traceId: plan.traceId,
      planUserIntent: plan.userIntent,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    const links: DetailSourceLink[] = [];
    resetDb();
    await ingestEvent({
      event_id: "evt-2",
      source: "manual",
      type: "capture",
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      trace_id: plan.traceId,
      payload: {},
      context: { user_id: "user-2", workflow: "capture" },
    });
    await recordEvaluationSnapshot({
      plan,
      execution,
      verification,
      run,
      links,
    });

    const server = buildGraphQLServer();
    const listQuery = /* GraphQL */ `
      query EvaluationSnapshots($traceId: String!) {
        evaluationSnapshots(traceId: $traceId) {
          file
          path
          size
          createdAt
        }
      }
    `;
    const listRes = await graphqlRequest(server, listQuery, {
      traceId: plan.traceId,
    });
    expect(listRes.errors).toBeUndefined();
    const files = listRes.data.evaluationSnapshots;
    expect(files.length).toBeGreaterThan(0);
    const file = files[0]?.file;
    expect(typeof file).toBe("string");

    const replayQuery = /* GraphQL */ `
      query ReplaySnapshot($traceId: String!, $file: String!) {
        replayEvaluationSnapshot(traceId: $traceId, file: $file)
      }
    `;
    const replayRes = await graphqlRequest(server, replayQuery, {
      traceId: plan.traceId,
      file,
    });
    expect(replayRes.errors).toBeUndefined();
    const replayed = TraceResponseSchema.parse(
      replayRes.data.replayEvaluationSnapshot
    );
    expect(replayed.plan.traceId).toBe(plan.traceId);
  });
});
