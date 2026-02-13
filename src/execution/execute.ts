import { type ExecutionResult, ExecutionResultSchema, type Plan } from "../plan/schema.js";
import { logger } from "../logging/logger.js";
import { defaultLabels, globalTags, isDryRun, loadEnv } from "../config/env.js";
import { ObsidianRest, ObsidianVault } from "../connectors/obsidian.js";
import { TodoistClient } from "../connectors/todoist.js";
import { LinearClient } from "../connectors/linear.js";
import { logExecutionResult } from "./store.js";

function isoLooksDateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function resolveDefaults(plan: Plan) {
  const env = loadEnv();
  return {
    todoistProjectId: env.TODOIST_DEFAULT_PROJECT_ID,
    linearTeamId: env.LINEAR_DEFAULT_TEAM_ID,
    linearAssigneeId: env.LINEAR_DEFAULT_ASSIGNEE_ID,
  };
}

export async function executePlan(plan: Plan): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();
  const env = loadEnv();
  const dryRun = isDryRun(env);
  const defaults = resolveDefaults(plan);
  const tags = globalTags(env);
  const defaultTodoistLabels = defaultLabels(env);

  const result: ExecutionResult = {
    traceId: plan.traceId,
    obsidian: { updatedNotes: [] },
    todoist: { createdTasks: [] },
    linear: { createdIssues: [] },
    warnings: [],
  };

  // Connectors
  const obsidian = env.OBSIDIAN_REST_URL
    ? new ObsidianRest(env.OBSIDIAN_REST_URL, env.OBSIDIAN_REST_TOKEN)
    : (env.OBSIDIAN_VAULT_PATH ? new ObsidianVault(env.OBSIDIAN_VAULT_PATH) : null);

  if (!obsidian) {
    result.warnings.push("No Obsidian connector configured. Set OBSIDIAN_VAULT_PATH or OBSIDIAN_REST_URL.");
  }

  const todoist = env.TODOIST_API_TOKEN ? new TodoistClient(env.TODOIST_API_TOKEN) : null;
  if (!todoist) result.warnings.push("No Todoist token configured. Set TODOIST_API_TOKEN to create tasks.");

  const linear = env.LINEAR_API_TOKEN ? new LinearClient(env.LINEAR_API_TOKEN) : null;
  if (!linear) result.warnings.push("No Linear token configured. Set LINEAR_API_TOKEN to create issues.");

  for (const action of plan.actions) {
    if (action.type === "obsidian.upsert_note") {
      const note = [
        `# ${action.title}`,
        "",
        ...(action.tags.length || tags.length
          ? [`Tags: ${[...new Set([...tags, ...action.tags])].map(t => `#${t.replace(/\s+/g, "-")}`).join(" ")}`, ""]
          : []),
        action.markdown.trim(),
        ""
      ].join("\n");

      if (dryRun || !obsidian) {
        logger.info({ notePath: action.notePath }, "DRY_RUN or no Obsidian configured: would upsert note");
        continue;
      }
      const r = await obsidian.upsertNote(action.notePath, note);
      result.obsidian.updatedNotes.push(r);
      continue;
    }

    if (action.type === "todoist.create_task") {
      const project_id =
        action.projectId && action.projectId !== "__DEFAULT_PROJECT__"
          ? action.projectId
          : defaults.todoistProjectId;

      const labels = [...new Set([...defaultTodoistLabels, ...tags, ...action.labels])];

      if (dryRun || !todoist) {
        logger.info({ content: action.content }, "DRY_RUN or no Todoist configured: would create task");
        continue;
      }

      const body: any = {
        content: action.content,
        description: action.description,
        project_id,
        priority: action.priority,
        labels: labels.length ? labels : undefined,
      };

      if (action.due) {
        if (isoLooksDateOnly(action.due)) body.due_date = action.due;
        else body.due_datetime = action.due;
      }

      const task = await todoist.createTask(body);
      result.todoist.createdTasks.push({ id: task.id, content: task.content, url: task.url });
      continue;
    }

    if (action.type === "linear.create_issue") {
      const teamId =
        action.teamId === "__DEFAULT_TEAM__"
          ? (defaults.linearTeamId ?? "")
          : action.teamId;

      if (!teamId) {
        result.warnings.push(`Linear issue skipped (missing teamId). Configure LINEAR_DEFAULT_TEAM_ID.`);
        continue;
      }

      const assigneeId =
        action.assigneeId === "__DEFAULT_ASSIGNEE__"
          ? defaults.linearAssigneeId
          : action.assigneeId;

      const labels = [...new Set([...tags, ...action.labels])];
      const description = [
        action.description?.trim() ?? "",
        "",
        `---`,
        `traceId: ${plan.traceId}`,
        `source: claude-agent-sdk`,
      ].join("\n").trim();

      if (dryRun || !linear) {
        logger.info({ title: action.title }, "DRY_RUN or no Linear configured: would create issue");
        continue;
      }

      const issue = await linear.issueCreate({
        teamId,
        title: action.title,
        description,
        assigneeId,
        // labelIds intentionally not implemented in scaffold; needs label lookup (add later).
      });

      result.linear.createdIssues.push({ id: issue.id, title: issue.title, url: issue.url });
      continue;
    }
  }

  // Validate result shape (useful for downstream reporting/tests)
  const parsed = ExecutionResultSchema.parse(result);
  const finishedAt = new Date().toISOString();
  await logExecutionResult({
    plan,
    result: parsed,
    startedAt,
    finishedAt,
  });
  return parsed;
}
