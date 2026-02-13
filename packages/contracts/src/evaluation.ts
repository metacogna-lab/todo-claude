import { z } from "zod";
import { TraceId, EvalId, PlanId } from "./identity.js";
import { CONTRACT_VERSION } from "./version.js";

export const EvalReportSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  eval_id: EvalId,
  trace_id: TraceId,
  plan_id: PlanId,
  overall_score: z.number().min(0).max(5),
  verdict: z.enum(["PASS", "WARN", "FAIL"]),
  category_scores: z.object({
    intent_alignment: z.number(),
    action_minimalism: z.number(),
    determinism_idempotency: z.number(),
    detail_source_correctness: z.number(),
    cross_system_integrity: z.number(),
    verification_coverage: z.number(),
    failure_handling_clarity: z.number()
  }),
  flags: z.object({
    FATAL_SCHEMA: z.boolean(),
    FATAL_SECURITY: z.boolean(),
    FATAL_CONNECTOR: z.boolean(),
    DRIFT: z.boolean(),
    NON_DETERMINISTIC: z.boolean()
  })
});

export type EvalReport = z.infer<typeof EvalReportSchema>;
