import { z } from "zod";

export const ExecutionRunSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  planUserIntent: z.string().min(1),
  startedAt: z.string().min(1),
  finishedAt: z.string().min(1),
  summary: z.string().optional(),
  actionsCount: z.number().int().nonnegative(),
});

export type ExecutionRunRecord = z.infer<typeof ExecutionRunSchema>;

export const ActionRecordSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  actionType: z.string().min(1),
  status: z.enum(["pending", "success", "skipped"]),
  payload: z.record(z.unknown()),
});

export type ActionRecord = z.infer<typeof ActionRecordSchema>;

export const DetailSourceLinkSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  sourceType: z.enum(["obsidian", "todoist", "linear"]),
  externalId: z.string().min(1),
  uri: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().min(1),
});

export type DetailSourceLink = z.infer<typeof DetailSourceLinkSchema>;
