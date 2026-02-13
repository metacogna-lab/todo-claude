import { generatePlan } from "../agent/planner.js";
import { executePlan } from "../execution/execute.js";
import { buildReceiptMarkdown } from "../workflows/receipt.js";
import { loadEnv, isDryRun } from "../config/env.js";
import type { Plan, ExecutionResult } from "../plan/schema.js";
import type { Env } from "../config/env.js";
import { ObsidianRest, ObsidianVault } from "../connectors/obsidian.js";
import { logger } from "../logging/logger.js";

export type ReceiptWriteResult = {
  notePath: string;
  receiptMarkdown: string;
  finalMarkdown: string;
  written: boolean;
};

export type ClaudeCaptureOptions = {
  text: string;
  writeReceipt?: boolean;
};

export type ClaudeCaptureResult = {
  plan: Plan;
  execution: ExecutionResult;
  receipt: ReceiptWriteResult | null;
};

type ClaudeCaptureDeps = {
  generatePlan: typeof generatePlan;
  executePlan: typeof executePlan;
  writeReceipt: (plan: Plan, execution: ExecutionResult, env: Env) => Promise<ReceiptWriteResult | null>;
};

const defaultDeps: ClaudeCaptureDeps = {
  generatePlan,
  executePlan,
  writeReceipt: maybeWriteReceipt,
};

export async function runClaudeCapture(
  options: ClaudeCaptureOptions,
  deps: Partial<ClaudeCaptureDeps> = {}
): Promise<ClaudeCaptureResult> {
  const env = loadEnv();
  const merged = { ...defaultDeps, ...deps };
  const plan = await merged.generatePlan(options.text);
  const execution = await merged.executePlan(plan);
  const receipt = options.writeReceipt === false ? null : await merged.writeReceipt(plan, execution, env);
  return { plan, execution, receipt };
}

export async function maybeWriteReceipt(plan: Plan, execution: ExecutionResult, env: Env): Promise<ReceiptWriteResult | null> {
  const noteAction = plan.actions.find(action => action.type === "obsidian.upsert_note");
  if (!noteAction) {
    logger.warn({ traceId: plan.traceId }, "No Obsidian note action in plan; skipping receipt write");
    return null;
  }

  const dryRun = isDryRun(env);
  const obsidian = env.OBSIDIAN_REST_URL
    ? new ObsidianRest(env.OBSIDIAN_REST_URL, env.OBSIDIAN_REST_TOKEN)
    : (env.OBSIDIAN_VAULT_PATH ? new ObsidianVault(env.OBSIDIAN_VAULT_PATH) : null);

  const receiptMd = buildReceiptMarkdown(plan, execution);
  const finalMarkdown = [
    `# ${noteAction.title}`,
    "",
    noteAction.markdown.trim(),
    "",
    receiptMd,
  ].join("\n");

  if (dryRun || !obsidian) {
    const reason = dryRun ? "dry_run_enabled" : "missing_obsidian_connector";
    logger.info({ notePath: noteAction.notePath, reason }, "Skipping receipt write");
    return {
      notePath: noteAction.notePath,
      receiptMarkdown: receiptMd,
      finalMarkdown,
      written: false,
    };
  }

  await obsidian.upsertNote(noteAction.notePath, finalMarkdown);
  logger.info({ notePath: noteAction.notePath }, "Receipt written to Obsidian");

  return {
    notePath: noteAction.notePath,
    receiptMarkdown: receiptMd,
    finalMarkdown,
    written: true,
  };
}
