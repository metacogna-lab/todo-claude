import { withLangfuseTrace } from "../observability/langfuse.js";
import { taskRegistry } from "./taskRegistry.js";
import type { Task } from "../schema/task.js";

export type CaptureThoughtInput = {
  text: string;
  labels?: string[];
  dryRun?: boolean;
};

export type CaptureThoughtResult = {
  task: Task;
  traceId: string;
};

export async function captureThought(input: CaptureThoughtInput): Promise<CaptureThoughtResult> {
  const trimmed = input.text.trim();
  if (!trimmed) {
    throw new Error("text is required");
  }

  const { result, traceId } = await withLangfuseTrace(
    "capture.thought",
    { labels: input.labels ?? [], dryRun: Boolean(input.dryRun) },
    async () => {
      if (!input.dryRun) {
        // Real workflow integration hooks in future iterations.
      }
      return taskRegistry.create({ title: trimmed, labels: input.labels });
    }
  );

  return { task: result, traceId };
}
