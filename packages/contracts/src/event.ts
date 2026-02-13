import { z } from "zod";
import { TraceId } from "./identity.js";
import { CONTRACT_VERSION } from "./version.js";

export const EventEnvelopeSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  event_id: z.string(),
  source: z.enum(["manual", "linear", "todoist", "obsidian"]),
  type: z.string(),
  occurred_at: z.string(),
  received_at: z.string(),
  trace_id: TraceId,
  payload: z.unknown(),
  context: z.object({
    user_id: z.string(),
    workspace_id: z.string().optional(),
    workflow: z.string().optional(),
    priority: z.enum(["low", "normal", "high"]).optional()
  })
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
