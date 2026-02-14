import { z } from "zod";

export const ObservabilityEvidenceSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().min(1),
  kind: z.enum(["langfuse", "devtools"]),
  reference: z.string().min(1),
  status: z.enum(["recorded", "missing_config", "failed"]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().min(1),
});

export type ObservabilityEvidence = z.infer<typeof ObservabilityEvidenceSchema>;
