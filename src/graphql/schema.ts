import { createSchema } from "graphql-yoga";
import { taskRegistry } from "../services/taskRegistry.js";
import { deriveIntegrationProfile } from "../services/integrationProfile.js";
import { summarizeHealth } from "../observability/monitoring.js";
import { captureThought } from "../services/captureThought.js";
import type { IntegrationProfile, Task } from "../schema/index.js";

const typeDefs = /* GraphQL */ `
  enum TaskStatus {
    todo
    active
    blocked
    done
  }

  type Task {
    id: ID!
    title: String!
    status: TaskStatus!
    labels: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  enum IntegrationStatus {
    configured
    missing
    partial
  }

  type IntegrationProfile {
    id: ID!
    obsidianVaultPath: String
    todoistProjectId: String
    linearTeamId: String
    status: IntegrationStatus!
    createdAt: String!
    updatedAt: String!
  }

  type HealthSnapshot {
    status: String!
    successRate: Float!
    avgDurationMs: Float!
    samples: Int!
    lastUpdatedAt: String
  }

  input CaptureThoughtInput {
    text: String!
    labels: [String!]
    dryRun: Boolean
  }

  type CaptureThoughtPayload {
    task: Task!
    traceId: String!
  }

  type Query {
    health: HealthSnapshot!
    integrationProfile: IntegrationProfile!
    tasks: [Task!]!
  }

  type Mutation {
    captureThought(input: CaptureThoughtInput!): CaptureThoughtPayload!
  }
`;

const resolvers = {
  Query: {
    health: () => summarizeHealth(),
    integrationProfile: (): IntegrationProfile => deriveIntegrationProfile(),
    tasks: (): Task[] => taskRegistry.list(),
  },
  Mutation: {
    captureThought: async (_parent: unknown, args: { input: { text: string; labels?: string[]; dryRun?: boolean } }) => {
      return captureThought(args.input);
    },
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});
