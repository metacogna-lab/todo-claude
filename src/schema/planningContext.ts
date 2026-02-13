import { z } from "zod";
import { PlanAction } from "../plan/schema.js";

export const PlanningContextSchema = z.object({
  traceId: z.string().min(1),
  workflow: z.string().min(1),
  source: z.string().min(1),
  eventType: z.string().min(1),
  detailSourceCapabilities: z.array(z.string()).default([]),
  environmentDefaults: z.object({
    defaultTeamId: z.string().optional(),
    defaultProjectId: z.string().optional(),
    defaultAssigneeId: z.string().optional(),
  }).default({}),
  historicalSignals: z.object({
    previousActions: z.array(PlanAction).optional(),
    relatedTraces: z.array(z.string()).optional(),
  }).optional(),
  createdAt: z.string().min(1),
});

export type PlanningContext = z.infer<typeof PlanningContextSchema>;
