import { z } from "zod";

export const VerificationStatusSchema = z.enum(["passing", "failing"]);

export const VerificationIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export const VerificationResultSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  runId: z.string().uuid(),
  status: VerificationStatusSchema,
  issues: z.array(VerificationIssueSchema),
  createdAt: z.string().min(1),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;
