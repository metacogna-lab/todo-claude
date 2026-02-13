import { createSchema } from "graphql-yoga";
import { taskRegistry } from "../services/taskRegistry.js";
import { deriveIntegrationProfile } from "../services/integrationProfile.js";
import { summarizeHealth } from "../observability/monitoring.js";
import { captureThought } from "../services/captureThought.js";
import { runClaudeCapture } from "../services/claudeCapture.js";
import type { IntegrationProfile, Task } from "../schema/index.js";
import type { Plan } from "../plan/schema.js";
import { webSearch } from "../plugins/webSearch.js";
import { previewEdits } from "../skills/codePreview.js";

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

  interface PlanAction {
    type: String!
  }

  type ObsidianUpsertPlanAction implements PlanAction {
    type: String!
    notePath: String!
    title: String!
    markdown: String!
    tags: [String!]!
  }

  type TodoistCreateTaskPlanAction implements PlanAction {
    type: String!
    content: String!
    description: String
    due: String
    priority: Int
    projectId: String
    labels: [String!]!
  }

  type LinearCreateIssuePlanAction implements PlanAction {
    type: String!
    teamId: String!
    title: String!
    description: String
    assigneeId: String
    labels: [String!]!
  }

  type Plan {
    traceId: String!
    userIntent: String!
    assumptions: [String!]!
    actions: [PlanAction!]!
    receiptSummary: String!
  }

  type ObsidianNoteMutation {
    notePath: String!
    uri: String
  }

  type TodoistCreatedTask {
    id: ID!
    content: String!
    url: String
  }

  type LinearCreatedIssue {
    id: ID!
    title: String!
    url: String
  }

  type ExecutionObsidianResult {
    updatedNotes: [ObsidianNoteMutation!]!
  }

  type ExecutionTodoistResult {
    createdTasks: [TodoistCreatedTask!]!
  }

  type ExecutionLinearResult {
    createdIssues: [LinearCreatedIssue!]!
  }

  type ExecutionResult {
    traceId: String!
    obsidian: ExecutionObsidianResult!
    todoist: ExecutionTodoistResult!
    linear: ExecutionLinearResult!
    warnings: [String!]!
  }

  type ReceiptInfo {
    notePath: String!
    receiptMarkdown: String!
    finalMarkdown: String!
    written: Boolean!
  }

  input CaptureWithClaudeInput {
    text: String!
    writeReceipt: Boolean
  }

  type CaptureWithClaudePayload {
    plan: Plan!
    execution: ExecutionResult!
    receipt: ReceiptInfo
  }

  type WebSearchResult {
    query: String!
    answer: String
    results: [WebSearchSnippet!]!
  }

  type WebSearchSnippet {
    title: String!
    url: String!
  }

  input PreviewEditsInput {
    instructions: String!
    files: [String!]
  }

  type PreviewEditsPayload {
    edits: [CodeEditSnippet!]!
  }

  type CodeEditSnippet {
    path: String!
    diff: String!
  }

  type Query {
    health: HealthSnapshot!
    integrationProfile: IntegrationProfile!
    tasks: [Task!]!
    webSearch(query: String!): WebSearchResult!
  }

  type Mutation {
    captureThought(input: CaptureThoughtInput!): CaptureThoughtPayload!
    captureWithClaude(input: CaptureWithClaudeInput!): CaptureWithClaudePayload!
    previewEdits(input: PreviewEditsInput!): PreviewEditsPayload!
  }
`;

const resolvers = {
  Query: {
    health: () => summarizeHealth(),
    integrationProfile: (): IntegrationProfile => deriveIntegrationProfile(),
    tasks: (): Task[] => taskRegistry.list(),
    webSearch: async (_parent: unknown, args: { query: string }) => {
      return webSearch(args.query);
    },
  },
  Mutation: {
    captureThought: async (_parent: unknown, args: { input: { text: string; labels?: string[]; dryRun?: boolean } }) => {
      return captureThought(args.input);
    },
    captureWithClaude: async (_parent: unknown, args: { input: { text: string; writeReceipt?: boolean } }) => {
      return runClaudeCapture(args.input);
    },
    previewEdits: async (_parent: unknown, args: { input: { instructions: string; files?: string[] } }) => {
      return previewEdits(args.input);
    },
  },
  PlanAction: {
    __resolveType(obj: Plan["actions"][number]) {
      if (obj.type === "obsidian.upsert_note") return "ObsidianUpsertPlanAction";
      if (obj.type === "todoist.create_task") return "TodoistCreateTaskPlanAction";
      if (obj.type === "linear.create_issue") return "LinearCreateIssuePlanAction";
      return null;
    },
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});
