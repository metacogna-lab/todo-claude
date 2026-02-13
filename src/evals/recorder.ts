import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { getLatestEvent } from "../events/ingest.js";
import type { Plan, ExecutionResult } from "../plan/schema.js";
import type { VerificationResult } from "../schema/verification.js";
import { loadEnv } from "../config/env.js";
import { logger } from "../logging/logger.js";

const snapshotBase = () => resolve(process.cwd(), loadEnv().EVALS_DIR ?? "data/evals");

export type EvaluationSnapshotInput = {
  plan: Plan;
  execution: ExecutionResult;
  verification: VerificationResult;
};

export async function recordEvaluationSnapshot(input: EvaluationSnapshotInput): Promise<string | null> {
  try {
    const baseDir = snapshotBase();
    const traceDir = resolve(baseDir, input.plan.traceId);
    await mkdir(traceDir, { recursive: true });
    const event = await getLatestEvent(input.plan.traceId);
    const payload = {
      traceId: input.plan.traceId,
      plan: input.plan,
      execution: input.execution,
      verification: input.verification,
      event,
    };
    const file = resolve(traceDir, `${Date.now()}-${randomUUID()}.json`);
    await writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
    return file;
  } catch (error) {
    logger.warn({ err: error }, "Failed to record evaluation snapshot");
    return null;
  }
}
