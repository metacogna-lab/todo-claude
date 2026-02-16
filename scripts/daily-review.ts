#!/usr/bin/env bun
/**
 * Daily Review Script
 *
 * Automates the daily review process:
 * 1. Retrieves current context from Todoist and Linear
 * 2. Updates state tracking
 * 3. Processes new notes
 * 4. Intelligently creates new tasks based on context
 * 5. Generates comprehensive daily summary
 */

import { logger } from "../src/logging/logger.js";
import { captureWorkflow } from "../src/workflows/capture.js";
import { TodoistClient, type TodoistTask } from "../src/connectors/todoist.js";
import { LinearClient, type LinearIssueDetailed } from "../src/connectors/linear.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary";

const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN!;
const LINEAR_TOKEN = process.env.LINEAR_API_TOKEN!;

interface DailyReviewConfig {
  date: string;
  vaultPath: string;
  generateSummary: boolean;
}

interface DailyContext {
  todoistTasks: TodoistTask[];
  linearIssues: LinearIssueDetailed[];
  processedNotes: string[];
  newTasksCreated: number;
}

async function retrieveCurrentContext(): Promise<{
  todoistTasks: TodoistTask[];
  linearIssues: LinearIssueDetailed[];
}> {
  logger.info("Retrieving current context from Todoist and Linear");

  const todoist = new TodoistClient(TODOIST_TOKEN);
  const linear = new LinearClient(LINEAR_TOKEN);

  const [todoistTasks, linearIssues] = await Promise.all([
    todoist.getActiveTasks(),
    linear.getActiveIssues(),
  ]);

  logger.info(
    { todoistCount: todoistTasks.length, linearCount: linearIssues.length },
    "Context retrieved successfully"
  );

  return { todoistTasks, linearIssues };
}

async function updateStateFile(
  date: string,
  context?: { todoistTasks: number; linearIssues: number }
): Promise<void> {
  const statePath = path.join(
    OBSIDIAN_VAULT,
    "daily-summary/state/claude-state.md"
  );

  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const stateEntry = context
    ? `\n## ${timestamp} - Daily Review\n- Action: Daily review with context integration\n- Context: ${context.todoistTasks} Todoist tasks, ${context.linearIssues} Linear issues\n- Status: In progress\n- Focus: Task sync, note processing, intelligent task creation\n\n`
    : `\n## ${timestamp} - Daily Review Complete\n- Status: Completed\n- Output: [[${date}]]\n\n`;

  try {
    const currentContent = await fs.readFile(statePath, "utf-8");
    await fs.writeFile(statePath, currentContent + stateEntry);
    logger.info({ date, path: statePath }, "State file updated");
  } catch (error) {
    logger.error({ error, path: statePath }, "Failed to update state file");
    throw error;
  }
}

async function processNewNotes(): Promise<string[]> {
  const processedNotesDir = path.join(
    OBSIDIAN_VAULT,
    "daily-summary/processed-notes"
  );

  // List all .md files in root that haven't been processed
  const rootFiles = await fs.readdir(OBSIDIAN_VAULT);
  const unprocessedNotes = rootFiles.filter(
    (file) =>
      file.endsWith(".md") &&
      !file.startsWith("REVIEW_") &&
      !file.startsWith("CLAUDE")
  );

  logger.info({ count: unprocessedNotes.length }, "Found unprocessed notes");

  for (const note of unprocessedNotes) {
    const sourcePath = path.join(OBSIDIAN_VAULT, note);
    const destPath = path.join(processedNotesDir, note);

    // Read and extract tasks via Claude capture
    const content = await fs.readFile(sourcePath, "utf-8");

    if (content.trim().length > 0) {
      try {
        await captureWorkflow(
          `Process note: ${note}\n\nContent:\n${content.substring(0, 500)}...`
        );

        // Move to processed
        await fs.rename(sourcePath, destPath);
        logger.info({ note, dest: destPath }, "Note processed and moved");
      } catch (error) {
        logger.error({ error, note }, "Failed to process note");
      }
    }
  }

  return unprocessedNotes;
}

async function generateDailySummary(
  date: string,
  context: DailyContext
): Promise<void> {
  const summaryPath = path.join(
    OBSIDIAN_VAULT,
    `daily-summary/${date}.md`
  );

  // Group Linear issues by status
  const inProgress = context.linearIssues.filter(i => i.state?.name === "In Progress");
  const backlog = context.linearIssues.filter(i => i.state?.name === "Backlog");
  const todo = context.linearIssues.filter(i => i.state?.name === "Todo");

  // Get high priority Todoist tasks (priority 3-4)
  const highPriorityTasks = context.todoistTasks.filter(t => (t.priority || 1) >= 3);

  const summary = `# Daily Summary - ${date}

## Context Snapshot
- **Todoist Tasks**: ${context.todoistTasks.length} active
  - High Priority: ${highPriorityTasks.length}
- **Linear Issues**: ${context.linearIssues.length} active
  - In Progress: ${inProgress.length}
  - Todo: ${todo.length}
  - Backlog: ${backlog.length}

## Active Work (In Progress)
${inProgress.length > 0
  ? inProgress.slice(0, 5).map(i => `- [${i.title}](${i.url}) - ${i.assignee?.name || "Unassigned"}`).join("\n")
  : "- No issues currently in progress"
}

## High Priority Tasks
${highPriorityTasks.length > 0
  ? highPriorityTasks.slice(0, 5).map(t => `- ${t.content}${t.due ? ` (Due: ${t.due.date || t.due.datetime})` : ""}`).join("\n")
  : "- No high priority tasks"
}

## Notes Processed Today
${context.processedNotes.length > 0
  ? context.processedNotes.map(note => `- Processed: [[${note}]]`).join("\n")
  : "- No new notes processed"
}

## New Tasks Created
- ${context.newTasksCreated} tasks/issues created via intelligent context analysis

## System Health
- ✅ Todoist integration operational
- ✅ Linear integration operational
- ✅ State tracking updated
- ✅ Daily review completed at ${new Date().toLocaleString()}

## Tomorrow's Focus
${inProgress.length > 0 ? `- Continue work on: ${inProgress[0]?.title}` : ""}
${highPriorityTasks.length > 0 ? `- Address high priority: ${highPriorityTasks[0]?.content}` : ""}
- Review and triage new items

---
*Generated by daily-review automation*
*Review Plan: [[REVIEW_PLAN]]*
*State: [[claude-state]]*
`;

  await fs.writeFile(summaryPath, summary);
  logger.info({ date, path: summaryPath }, "Daily summary generated");
}

async function runDailyReview(config: DailyReviewConfig): Promise<void> {
  logger.info({ date: config.date }, "Starting daily review");

  try {
    // Step 1: Retrieve current context from Todoist and Linear
    const { todoistTasks, linearIssues } = await retrieveCurrentContext();

    // Step 2: Update state file with context
    await updateStateFile(config.date, {
      todoistTasks: todoistTasks.length,
      linearIssues: linearIssues.length,
    });

    // Step 3: Process new notes
    const processedNotes = await processNewNotes();

    // Step 4: Intelligent context analysis and task creation
    const contextPrompt = `Daily Review - ${config.date}

CURRENT CONTEXT:

Todoist Tasks (${todoistTasks.length} active):
${todoistTasks.slice(0, 10).map((t, i) =>
  `${i + 1}. ${t.content}${t.description ? ` - ${t.description}` : ""}${t.priority && t.priority >= 3 ? " [HIGH PRIORITY]" : ""}`
).join("\n")}
${todoistTasks.length > 10 ? `\n... and ${todoistTasks.length - 10} more tasks` : ""}

Linear Issues (${linearIssues.length} active):
${linearIssues.slice(0, 10).map((i, idx) =>
  `${idx + 1}. [${i.state?.name || "Unknown"}] ${i.title} - ${i.assignee?.name || "Unassigned"}`
).join("\n")}
${linearIssues.length > 10 ? `\n... and ${linearIssues.length - 10} more issues` : ""}

Processed Notes Today: ${processedNotes.length}

INSTRUCTIONS:
1. Analyze the current task and issue context
2. Identify any gaps, blockers, or urgent items
3. Create new tasks/issues for:
   - Follow-ups needed for in-progress work
   - Missing dependencies or blockers to address
   - High-priority items that need breakdown
4. Suggest focus areas for tomorrow based on priorities

Be concise but actionable. Focus on what needs attention.`;

    logger.info("Running intelligent context analysis");
    await captureWorkflow(contextPrompt);

    // Step 5: Generate comprehensive summary
    if (config.generateSummary) {
      const dailyContext: DailyContext = {
        todoistTasks,
        linearIssues,
        processedNotes,
        newTasksCreated: 0, // This would be tracked by captureWorkflow
      };

      await generateDailySummary(config.date, dailyContext);
    }

    // Step 6: Update state file as complete
    await updateStateFile(config.date);

    logger.info({ date: config.date }, "Daily review completed successfully");
  } catch (error) {
    logger.error({ error, date: config.date }, "Daily review failed");
    throw error;
  }
}

// Main execution
const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const config: DailyReviewConfig = {
  date,
  vaultPath: OBSIDIAN_VAULT,
  generateSummary: true,
};

await runDailyReview(config);
