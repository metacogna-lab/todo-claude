import { z } from "zod";
import { TraceId } from "./identity.js";
import { CONTRACT_VERSION } from "./version.js";

const ObsidianUpsert = z.object({
  type: z.literal("obsidian.upsert_note"),
  notePath: z.string(),
  title: z.string(),
  markdown: z.string(),
  tags: z.array(z.string())
});

const ObsidianReceipt = z.object({
  type: z.literal("obsidian.append_receipt"),
  notePath: z.string(),
  receiptMarkdown: z.string()
});

const TodoistCreate = z.object({
  type: z.literal("todoist.create_task"),
  content: z.string(),
  description: z.string().optional(),
  due: z.string().optional(),
  priority: z.number().min(1).max(4).optional(),
  projectId: z.string().optional(),
  labels: z.array(z.string())
});

const TodoistClose = z.object({
  type: z.literal("todoist.close_task"),
  taskId: z.string()
});

const LinearCreate = z.object({
  type: z.literal("linear.create_issue"),
  teamId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  labels: z.array(z.string())
});

const LinearUpdate = z.object({
  type: z.literal("linear.update_issue"),
  issueId: z.string(),
  patch: z.object({
    stateId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional()
  })
});

export const PlanActionSchema = z.discriminatedUnion("type", [
  ObsidianUpsert,
  ObsidianReceipt,
  TodoistCreate,
  TodoistClose,
  LinearCreate,
  LinearUpdate
]);

export const PlanSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  traceId: TraceId,
  userIntent: z.string(),
  assumptions: z.array(z.string()),
  actions: z.array(PlanActionSchema),
  receiptSummary: z.string()
});

export type PlanAction = z.infer<typeof PlanActionSchema>;
export type Plan = z.infer<typeof PlanSchema>;
