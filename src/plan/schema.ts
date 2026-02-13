import { z } from "zod";

export const ObsidianUpsertAction = z.object({
  type: z.literal("obsidian.upsert_note"),
  // path relative to vault root, e.g. "Projects/Q1 Roadmap.md"
  notePath: z.string().min(1),
  title: z.string().min(1),
  markdown: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const TodoistCreateTaskAction = z.object({
  type: z.literal("todoist.create_task"),
  content: z.string().min(1),
  description: z.string().optional(),
  due: z.string().optional(), // ISO date or datetime
  priority: z.number().int().min(1).max(4).optional(), // Todoist p1..p4 (API uses 1-4)
  projectId: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

export const TodoistCloseTaskAction = z.object({
  type: z.literal("todoist.close_task"),
  taskId: z.string().min(1),
});

export const LinearCreateIssueAction = z.object({
  type: z.literal("linear.create_issue"),
  teamId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(), // markdown
  assigneeId: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

export const LinearUpdateIssueAction = z.object({
  type: z.literal("linear.update_issue"),
  issueId: z.string().min(1),
  patch: z.object({
    stateId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const PlanAction = z.discriminatedUnion("type", [
  ObsidianUpsertAction,
  TodoistCreateTaskAction,
  TodoistCloseTaskAction,
  LinearCreateIssueAction,
  LinearUpdateIssueAction,
]);

export const PlanSchema = z.object({
  version: z.literal("1.0.0").default("1.0.0"),
  traceId: z.string().min(8),
  userIntent: z.string().min(1),
  assumptions: z.array(z.string()).default([]),
  actions: z.array(PlanAction).min(1),
  // A short summary suitable for the receipt note
  receiptSummary: z.string().min(1),
});

export type Plan = z.infer<typeof PlanSchema>;

export const ExecutionResultSchema = z.object({
  traceId: z.string(),
  obsidian: z.object({
    updatedNotes: z.array(z.object({
      notePath: z.string(),
      // optional for REST based implementations
      uri: z.string().optional(),
    })).default([]),
  }).default({ updatedNotes: [] }),
  todoist: z.object({
    createdTasks: z.array(z.object({
      id: z.string(),
      content: z.string(),
      url: z.string().optional(),
    })).default([]),
  }).default({ createdTasks: [] }),
  linear: z.object({
    createdIssues: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string().optional(),
    })).default([]),
  }).default({ createdIssues: [] }),
  warnings: z.array(z.string()).default([]),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
