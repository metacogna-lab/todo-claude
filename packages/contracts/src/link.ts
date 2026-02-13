import { z } from "zod";
import { TraceId } from "./identity.js";
import { CONTRACT_VERSION } from "./version.js";

export const LinkGraphSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  trace_id: TraceId,
  obsidian_note_path: z.string().optional(),
  todoist_task_ids: z.array(z.string()),
  linear_issue_ids: z.array(z.string())
});

export type LinkGraph = z.infer<typeof LinkGraphSchema>;
