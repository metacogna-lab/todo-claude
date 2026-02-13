import { randomUUID } from "node:crypto";
import { Langfuse } from "langfuse";
import { logger } from "../logging/logger.js";

let cachedClient: Langfuse | null | undefined;

export function getLangfuseClient(): Langfuse | null {
  if (cachedClient !== undefined) return cachedClient;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const host = process.env.LANGFUSE_HOST;

  if (!publicKey || !secretKey) {
    logger.warn("Langfuse keys missing; traces disabled");
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Langfuse({
    publicKey,
    secretKey,
    baseUrl: host,
  });

  return cachedClient;
}

export type TraceResult<T> = {
  result: T;
  traceId: string;
};

export async function withLangfuseTrace<T>(
  name: string,
  metadata: Record<string, unknown>,
  fn: () => Promise<T> | T
): Promise<TraceResult<T>> {
  const langfuse = getLangfuseClient();
  const traceId = randomUUID();

  if (!langfuse) {
    const result = await fn();
    return { result, traceId };
  }

  try {
    await langfuse.trace({
      id: traceId,
      name,
      metadata,
    });
  } catch (error) {
    logger.warn({ err: error }, "Langfuse trace creation failed");
  }

  const result = await fn();
  return { result, traceId };
}

export async function recordGraphQLOperationTrace(params: {
  operationName: string;
  durationMs: number;
  success: boolean;
}): Promise<void> {
  const langfuse = getLangfuseClient();
  if (!langfuse) return;

  try {
    await langfuse.trace({
      id: randomUUID(),
      name: `graphql.${params.operationName}`,
      metadata: {
        durationMs: params.durationMs,
        success: params.success,
      },
    });
  } catch (error) {
    logger.warn({ err: error }, "GraphQL trace emit failed");
  }
}
