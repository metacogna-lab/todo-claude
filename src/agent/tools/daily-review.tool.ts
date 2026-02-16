/**
 * Daily Review Tool - Claude Agent SDK Wrapper
 *
 * Wraps the daily-review skill as a Claude Agent SDK tool for programmatic use.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../../logging/logger.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execAsync = promisify(exec);

export interface DailyReviewInput {
  dryRun?: boolean;
  generateSummary?: boolean;
}

export interface DailyReviewOutput {
  success: boolean;
  summaryPath?: string;
  processedNotes: number;
  tasksCreated: number;
  errors?: string[];
}

/**
 * Execute the daily review workflow
 */
async function runDailyReview(input: DailyReviewInput = {}): Promise<DailyReviewOutput> {
  const { dryRun = false, generateSummary = true } = input;

  logger.info({ dryRun, generateSummary }, "Running daily review");

  const projectRoot = "/Users/nullzero/Metacogna/claude-obsidian-todoist-linear";
  const env = dryRun ? { ...process.env, DRY_RUN: "true" } : process.env;

  try {
    // Execute the daily review script
    const { stdout, stderr } = await execAsync("bun run review:daily", {
      cwd: projectRoot,
      env,
    });

    if (stderr && !stderr.includes("info")) {
      logger.warn({ stderr }, "Daily review produced warnings");
    }

    logger.info({ stdout: stdout.substring(0, 500) }, "Daily review output");

    // Parse output to extract metrics
    const date = new Date().toISOString().split("T")[0];
    const summaryPath = `/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/daily-summary/${date}.md`;

    // Check if summary was created
    let summaryExists = false;
    try {
      await fs.access(summaryPath);
      summaryExists = true;
    } catch {
      // Summary doesn't exist yet
    }

    // Extract metrics from logs (simplified - actual implementation would parse structured logs)
    const processedNotes = (stdout.match(/processed/gi) || []).length;
    const tasksCreated = (stdout.match(/task|issue/gi) || []).length;

    return {
      success: true,
      summaryPath: summaryExists ? summaryPath : undefined,
      processedNotes,
      tasksCreated,
    };

  } catch (error) {
    logger.error({ error }, "Daily review failed");
    return {
      success: false,
      processedNotes: 0,
      tasksCreated: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Claude Agent SDK Tool Definition
 */
export const dailyReviewTool = {
  name: "daily_review",
  description: `Run the daily review workflow to process notes, sync tasks across Todoist/Linear, and generate a daily summary.

Use this tool when:
- Starting or ending the workday
- After capturing multiple notes
- To sync tasks across systems
- To prepare for weekly review

Output includes:
- Daily summary document path
- Count of processed notes
- Count of tasks created`,

  input_schema: {
    type: "object" as const,
    properties: {
      dryRun: {
        type: "boolean",
        description: "If true, runs in dry-run mode without making changes. Default: false",
        default: false,
      },
      generateSummary: {
        type: "boolean",
        description: "If true, generates the daily summary document. Default: true",
        default: true,
      },
    },
    required: [],
  },

  function: runDailyReview,
};

// Export both the tool and the function for flexibility
export { runDailyReview };
