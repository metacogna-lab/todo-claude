import { z } from "zod";

export const EventContextSchema = z.object({
  user_id: z.string().min(1),
  workspace_id: z.string().optional(),
  project_hint: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  workflow: z.string().min(1),
  lane: z.enum(["fast", "heavy"]).optional(),
});

export const EventEnvelopeSchema = z.object({
  event_id: z.string().min(1),
  source: z.string().min(1),
  type: z.string().min(1),
  occurred_at: z.string().min(1),
  received_at: z.string().min(1),
  trace_id: z.string().min(1),
  payload: z.unknown().optional(),
  context: EventContextSchema,
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
