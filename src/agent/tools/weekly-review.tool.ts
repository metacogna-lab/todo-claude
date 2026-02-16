/**
 * Weekly Review Tool - Claude Agent SDK Wrapper
 *
 * Wraps the weekly-review skill as a Claude Agent SDK tool for programmatic use.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../../logging/logger.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execAsync = promisify(exec);

export interface WeeklyReviewInput {
  dryRun?: boolean;
  archiveDailySummaries?: boolean;
}

export interface WeeklyReviewOutput {
  success: boolean;
  summaryPath?: string;
  weekNumber: string;
  dailySummariesProcessed: number;
  patternsIdentified: number;
  errors?: string[];
}

/**
 * Get current week number
 */
function getWeekNumber(date: Date = new Date()): { week: string; year: string } {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);

  return {
    week: weekNumber.toString().padStart(2, "0"),
    year: date.getFullYear().toString(),
  };
}

/**
 * Execute the weekly review workflow
 */
async function runWeeklyReview(input: WeeklyReviewInput = {}): Promise<WeeklyReviewOutput> {
  const { dryRun = false, archiveDailySummaries = true } = input;

  logger.info({ dryRun, archiveDailySummaries }, "Running weekly review");

  const projectRoot = "/Users/nullzero/Metacogna/claude-obsidian-todoist-linear";
  const env = dryRun ? { ...process.env, DRY_RUN: "true" } : process.env;

  const { week, year } = getWeekNumber();
  const weekNumber = `${year}-W${week}`;

  try {
    // Execute the weekly review script
    const { stdout, stderr } = await execAsync("bun run review:weekly", {
      cwd: projectRoot,
      env,
    });

    if (stderr && !stderr.includes("info")) {
      logger.warn({ stderr }, "Weekly review produced warnings");
    }

    logger.info({ stdout: stdout.substring(0, 500) }, "Weekly review output");

    // Construct expected summary path
    const summaryPath = `/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary/daily-summary/weekly-notes/${weekNumber}.md`;

    // Check if summary was created
    let summaryExists = false;
    try {
      await fs.access(summaryPath);
      summaryExists = true;
    } catch {
      // Summary doesn't exist yet
    }

    // Extract metrics from logs
    const dailySummariesMatch = stdout.match(/(\d+)\s+daily\s+summar/i);
    const dailySummariesProcessed = dailySummariesMatch ? parseInt(dailySummariesMatch[1]) : 0;

    const patternsMatch = stdout.match(/(\d+)\s+pattern/i);
    const patternsIdentified = patternsMatch ? parseInt(patternsMatch[1]) : 0;

    return {
      success: true,
      summaryPath: summaryExists ? summaryPath : undefined,
      weekNumber,
      dailySummariesProcessed,
      patternsIdentified,
    };

  } catch (error) {
    logger.error({ error }, "Weekly review failed");
    return {
      success: false,
      weekNumber,
      dailySummariesProcessed: 0,
      patternsIdentified: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Claude Agent SDK Tool Definition
 */
export const weeklyReviewTool = {
  name: "weekly_review",
  description: `Run the weekly review workflow to consolidate daily summaries, identify patterns, archive completed work, and generate weekly insights.

Use this tool when:
- End of each week (Friday recommended)
- Before monthly planning
- To identify productivity patterns
- For team status updates

Output includes:
- Weekly summary document path
- Week number
- Count of daily summaries processed
- Count of patterns identified`,

  input_schema: {
    type: "object" as const,
    properties: {
      dryRun: {
        type: "boolean",
        description: "If true, runs in dry-run mode without making changes. Default: false",
        default: false,
      },
      archiveDailySummaries: {
        type: "boolean",
        description: "If true, archives daily summaries to notes-archive. Default: true",
        default: true,
      },
    },
    required: [],
  },

  function: runWeeklyReview,
};

// Export both the tool and the function for flexibility
export { runWeeklyReview };
