import { z } from "zod";
import { TraceId, PlanId, RunId } from "./identity.js";
import { CONTRACT_VERSION } from "./version.js";

export const ExecutionRunSchema = z.object({
  version: z.literal(CONTRACT_VERSION),
  run_id: RunId,
  trace_id: TraceId,
  plan_id: PlanId,
  state: z.enum(["RECEIVED", "EXECUTING", "DONE", "FAILED"]),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
  retry_count: z.number()
});

export const ActionExecutionSchema = z.object({
  trace_id: TraceId,
  action_hash: z.string(),
  action_type: z.string(),
  executed_at: z.string(),
  result_json: z.unknown(),
  verified: z.boolean()
});

export type ExecutionRun = z.infer<typeof ExecutionRunSchema>;
export type ActionExecution = z.infer<typeof ActionExecutionSchema>;
