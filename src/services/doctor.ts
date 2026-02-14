import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { loadEnv } from "../config/env.js";
import { logger } from "../logging/logger.js";

export type DoctorStatus = "pass" | "warn" | "fail";

export type DoctorCheck = {
  name: string;
  status: DoctorStatus;
  details: string;
};

const format = (status: DoctorStatus, name: string, details: string): DoctorCheck => ({
  name,
  status,
  details,
});

async function checkPathExists(path?: string): Promise<boolean> {
  if (!path) return false;
  try {
    await access(path, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function runDoctorChecks(): Promise<DoctorCheck[]> {
  const results: DoctorCheck[] = [];
  const env = loadEnv();

  results.push(format("pass", "OPENAI_API_KEY", "Detected OpenAI credentials"));

  if (env.OBSIDIAN_VAULT_PATH) {
    const exists = await checkPathExists(env.OBSIDIAN_VAULT_PATH);
    results.push(
      exists
        ? format("pass", "Obsidian vault", `Writable vault at ${env.OBSIDIAN_VAULT_PATH}`)
        : format("fail", "Obsidian vault", `Vault path ${env.OBSIDIAN_VAULT_PATH} not accessible`)
    );
  } else if (env.OBSIDIAN_REST_URL) {
    results.push(format("warn", "Obsidian REST", "REST endpoint configured; ensure token + plugin are running"));
  } else {
    results.push(format("warn", "Obsidian connector", "Set OBSIDIAN_VAULT_PATH or OBSIDIAN_REST_URL to write receipts"));
  }

  results.push(
    env.TODOIST_API_TOKEN
      ? format("pass", "Todoist", "API token configured")
      : format("warn", "Todoist", "TODOIST_API_TOKEN missing; tasks will not be created")
  );

  results.push(
    env.LINEAR_API_TOKEN
      ? format("pass", "Linear", "API token configured")
      : format("warn", "Linear", "LINEAR_API_TOKEN missing; issues will not be created")
  );

  const hasLangfuse =
    Boolean(env.LANGFUSE_PUBLIC_KEY) &&
    Boolean(env.LANGFUSE_SECRET_KEY) &&
    Boolean(env.LANGFUSE_HOST);
  results.push(
    hasLangfuse
      ? format("pass", "Langfuse", "Span reporting enabled")
      : format("warn", "Langfuse", "Langfuse keys missing; traces will not be enforced")
  );

  const evalsDir = env.EVALS_DIR ?? "data/evals";
  const evalsWritable = await checkPathExists(evalsDir).catch(() => false);
  results.push(
    evalsWritable
      ? format("pass", "EVALS_DIR", `Snapshots stored in ${evalsDir}`)
      : format("warn", "EVALS_DIR", `Directory ${evalsDir} not accessible; replay tooling may fail`)
  );

  results.push(
    process.env.TAVILY_API_KEY
      ? format("pass", "Web Search", "TAVILY_API_KEY configured")
      : format("warn", "Web Search", "TAVILY_API_KEY missing; webSearch resolver disabled")
  );

  return results;
}

export async function runDoctor(): Promise<void> {
  const checks = await runDoctorChecks();
  checks.forEach(check => {
    logger.info({ check: check.name, status: check.status }, check.details);
  });
  const failures = checks.filter(check => check.status === "fail");
  if (failures.length) {
    throw new Error(`Doctor detected ${failures.length} failing check(s)`);
  }
}
