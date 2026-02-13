import { z } from "zod";

export const TraceId = z.string().min(8);
export const PlanId = z.string().min(8);
export const RunId = z.string().min(8);
export const EvalId = z.string().min(8);

export type TraceId = z.infer<typeof TraceId>;
export type PlanId = z.infer<typeof PlanId>;
export type RunId = z.infer<typeof RunId>;
export type EvalId = z.infer<typeof EvalId>;
