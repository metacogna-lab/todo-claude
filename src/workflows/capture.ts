import { generatePlan } from "../agent/planner.js";
import { executePlan } from "../execution/execute.js";
import { buildReceiptMarkdown } from "./receipt.js";
import { loadEnv, isDryRun } from "../config/env.js";
import { logger } from "../logging/logger.js";
import { ObsidianRest, ObsidianVault } from "../connectors/obsidian.js";

/**
 * Primary workflow:
 * - create plan (Claude)
 * - execute plan (deterministic)
 * - write receipt back to Obsidian (append to the first note, if present)
 */
export async function captureWorkflow(userText: string): Promise<void> {
  const env = loadEnv();
  const dryRun = isDryRun(env);

  const plan = await generatePlan(userText);
  logger.info({ traceId: plan.traceId, actions: plan.actions.length }, "Plan created");

  const exec = await executePlan(plan);
  logger.info({ traceId: exec.traceId }, "Execution complete");

  // Write receipt into the first Obsidian note action, if any.
  const noteAction = plan.actions.find(a => a.type === "obsidian.upsert_note");
  if (!noteAction) {
    logger.warn({ traceId: plan.traceId }, "No Obsidian note action in plan; skipping receipt write");
    return;
  }

  if (dryRun) {
    logger.info({ traceId: plan.traceId }, "DRY_RUN enabled: skipping receipt write");
    return;
  }

  const obsidian = env.OBSIDIAN_REST_URL
    ? new ObsidianRest(env.OBSIDIAN_REST_URL, env.OBSIDIAN_REST_TOKEN)
    : (env.OBSIDIAN_VAULT_PATH ? new ObsidianVault(env.OBSIDIAN_VAULT_PATH) : null);

  if (!obsidian) {
    logger.warn({ traceId: plan.traceId }, "No Obsidian connector configured; cannot write receipt");
    return;
  }

  // Append receipt by re-upserting note (simple scaffold). You can implement read-then-append later.
  const receiptMd = buildReceiptMarkdown(plan, exec);
  const updatedMarkdown = [
    // original content is already in the plan; this keeps execution deterministic
    `# ${noteAction.title}`,
    "",
    noteAction.markdown.trim(),
    "",
    receiptMd
  ].join("\n");

  await obsidian.upsertNote(noteAction.notePath, updatedMarkdown);
  logger.info({ notePath: noteAction.notePath }, "Receipt written to Obsidian");
}
