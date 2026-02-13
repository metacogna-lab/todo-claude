import { logger } from "../logging/logger.js";
import { runClaudeCapture } from "../services/claudeCapture.js";

/**
 * Primary workflow:
 * - create plan (Claude)
 * - execute plan (deterministic)
 * - write receipt back to Obsidian (append to the first note, if present)
 */
export async function captureWorkflow(userText: string): Promise<void> {
  const result = await runClaudeCapture({ text: userText });
  logger.info({ traceId: result.plan.traceId, actions: result.plan.actions.length }, "Plan created");
  logger.info({ traceId: result.execution.traceId }, "Execution complete");

  if (!result.receipt) {
    logger.warn({ traceId: result.plan.traceId }, "No receipt generated");
    return;
  }

  if (!result.receipt.written) {
    logger.warn({ notePath: result.receipt.notePath }, "Receipt markdown generated but not written");
  }
}
