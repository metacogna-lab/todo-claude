import { randomUUID } from "node:crypto";
import { z } from "zod";

export const TaskStatusEnum = z.enum(["todo", "active", "blocked", "done"]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: TaskStatusEnum.default("todo"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  labels: z.array(z.string()).default([]),
});

export type Task = z.infer<typeof TaskSchema>;

export type TaskInput = Pick<Task, "title"> & Partial<Pick<Task, "labels" | "status">>;

export function buildTask(input: TaskInput): Task {
  const nowIso = new Date().toISOString();
  return TaskSchema.parse({
    id: randomUUID(),
    createdAt: nowIso,
    updatedAt: nowIso,
    status: input.status ?? "todo",
    labels: input.labels ?? [],
    title: input.title,
  });
}
