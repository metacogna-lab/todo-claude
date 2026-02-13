import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  CLAUDE_MODEL: z.string().optional(),

  OBSIDIAN_VAULT_PATH: z.string().optional(),
  OBSIDIAN_REST_URL: z.string().url().optional(),
  OBSIDIAN_REST_TOKEN: z.string().optional(),

  TODOIST_API_TOKEN: z.string().optional(),
  TODOIST_DEFAULT_PROJECT_ID: z.string().optional(),
  TODOIST_DEFAULT_LABELS: z.string().optional(),

  LINEAR_API_TOKEN: z.string().optional(),
  LINEAR_DEFAULT_TEAM_ID: z.string().optional(),
  LINEAR_DEFAULT_ASSIGNEE_ID: z.string().optional(),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().optional(),

  DRY_RUN: z.string().optional(),
  RECEIPTS_FOLDER: z.string().optional(),
  GLOBAL_TAGS: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export function isDryRun(env: Env): boolean {
  return (env.DRY_RUN ?? "false").toLowerCase() === "true";
}

export function globalTags(env: Env): string[] {
  return (env.GLOBAL_TAGS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export function defaultLabels(env: Env): string[] {
  return (env.TODOIST_DEFAULT_LABELS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}
