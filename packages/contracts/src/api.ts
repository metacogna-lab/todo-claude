import { z } from "zod";
import { EventEnvelopeSchema } from "./event.js";
import { PlanSchema } from "./plan.js";
import { ExecutionRunSchema } from "./execution.js";
import { LinkGraphSchema } from "./link.js";
import { EvalReportSchema } from "./evaluation.js";

export const TraceResponseSchema = z.object({
  event: EventEnvelopeSchema,
  plan: PlanSchema,
  run: ExecutionRunSchema,
  links: LinkGraphSchema,
  evaluations: z.array(EvalReportSchema)
});

export type TraceResponse = z.infer<typeof TraceResponseSchema>;
