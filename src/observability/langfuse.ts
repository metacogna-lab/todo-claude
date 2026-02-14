import { randomUUID } from "node:crypto";
import { startActiveObservation } from "@langfuse/tracing";
import { recordEvidence } from "./evidence.js";
import { ensureTelemetryStarted } from "./otel.js";

const hasLangfuseConfig = () =>
  Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
  Boolean(process.env.LANGFUSE_SECRET_KEY) &&
  Boolean(process.env.LANGFUSE_HOST);

export type TraceResult<T> = {
  result: T;
  traceId: string;
};

export async function withLangfuseTrace<T>(
  name: string,
  metadata: Record<string, unknown>,
  fn: () => Promise<T> | T
): Promise<TraceResult<T>> {
  const traceId = randomUUID();
  ensureTelemetryStarted();
  if (!hasLangfuseConfig()) {
    const result = await fn();
    return { result, traceId };
  }

  const result = await startActiveObservation(name, async span => {
    span.update({ input: metadata });
    const output = await fn();
    span.update({ output: "completed" });
    return output;
  });

  return { result, traceId };
}

export async function recordGraphQLOperationTrace(params: {
  operationName: string;
  durationMs: number;
  success: boolean;
}): Promise<void> {
  ensureTelemetryStarted();
  if (!hasLangfuseConfig()) return;
  await startActiveObservation(`graphql.${params.operationName}`, async span => {
    span.update({
      input: {
        durationMs: params.durationMs,
        success: params.success,
      },
    });
    span.update({ output: "recorded" });
  });
}

export async function recordLangfuseTrace(params: {
  traceId: string;
  name: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const status: "recorded" | "missing_config" = hasLangfuseConfig()
    ? "recorded"
    : "missing_config";
  await recordEvidence({
    traceId: params.traceId,
    kind: "langfuse",
    reference: params.name,
    status,
    metadata: params.metadata ?? {},
  });
}
