import { logger } from "../logging/logger.js";

let telemetryPromise: Promise<void> | null = null;

export function ensureTelemetryStarted(): void {
  if (telemetryPromise) return;
  const hasLangfuse =
    Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
    Boolean(process.env.LANGFUSE_SECRET_KEY) &&
    Boolean(process.env.LANGFUSE_HOST);
  if (!hasLangfuse) {
    logger.warn("Langfuse telemetry disabled (missing keys)");
    return;
  }

  telemetryPromise = (async () => {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { LangfuseSpanProcessor } = await import("@langfuse/otel");
    const sdk = new NodeSDK({
      spanProcessors: [new LangfuseSpanProcessor()],
    });
    await sdk.start();
    logger.info("Langfuse OpenTelemetry started");
  })().catch(error => {
    logger.warn({ err: error }, "Failed to start Langfuse OpenTelemetry");
    telemetryPromise = null;
  });
}
