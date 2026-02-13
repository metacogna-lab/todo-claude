import { beforeEach, describe, expect, it } from "vitest";
import { buildGraphQLServer } from "../src/graphql/server.js";
import { taskRegistry } from "../src/services/taskRegistry.js";
import { resetMetrics } from "../src/observability/monitoring.js";

async function graphqlRequest(server: ReturnType<typeof buildGraphQLServer>, query: string, variables?: Record<string, unknown>) {
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

    const variables = { input: { text: "GraphQL all the things", labels: ["obs"] } };
    const result = await graphqlRequest(server, mutation, variables);
    expect(result.errors).toBeUndefined();
    expect(result.data.captureThought.task.title).toBe("GraphQL all the things");
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
    const health = await graphqlRequest(server, `query { health { status samples } }`);
    expect(health.errors).toBeUndefined();
    expect(health.data.health.samples).toBeGreaterThan(0);
  });
});
