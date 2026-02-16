#!/usr/bin/env bun
/**
 * Retrieves today's context from Todoist and Linear
 * Usage: bun run scripts/get-context.ts
 */

import { TodoistClient } from "../src/connectors/todoist.js";
import { LinearClient } from "../src/connectors/linear.js";

const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN;
const LINEAR_TOKEN = process.env.LINEAR_API_TOKEN;
const LINEAR_ASSIGNEE = process.env.LINEAR_DEFAULT_ASSIGNEE_ID;

if (!TODOIST_TOKEN) {
  console.error("❌ TODOIST_API_TOKEN not set");
  process.exit(1);
}

if (!LINEAR_TOKEN) {
  console.error("❌ LINEAR_API_TOKEN not set");
  process.exit(1);
}

async function main() {
  console.log("📅 Retrieving context for today...\n");

  // Initialize clients
  const todoist = new TodoistClient(TODOIST_TOKEN);
  const linear = new LinearClient(LINEAR_TOKEN);

  try {
    // Fetch Todoist tasks
    console.log("🔵 Fetching Todoist tasks...");
    const tasks = await todoist.getActiveTasks();

    console.log(`\n📋 Todoist Tasks (${tasks.length} active)`);
    console.log("=".repeat(60));

    if (tasks.length === 0) {
      console.log("  No active tasks for today");
    } else {
      tasks.forEach((task, i) => {
        console.log(`\n${i + 1}. ${task.content}`);
        if (task.description) {
          console.log(`   ${task.description}`);
        }
        if (task.url) {
          console.log(`   🔗 ${task.url}`);
        }
      });
    }

    // Fetch Linear issues
    console.log("\n\n🔴 Fetching Linear issues...");
    // Note: LINEAR_ASSIGNEE needs to be a UUID, not a username
    // For now, fetching all active issues
    const issues = await linear.getActiveIssues();

    console.log(`\n🎯 Linear Issues (${issues.length} active)`);
    console.log("=".repeat(60));

    if (issues.length === 0) {
      console.log("  No active issues");
    } else {
      issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.title}`);
        if (issue.state?.name) {
          console.log(`   Status: ${issue.state.name}`);
        }
        if (issue.assignee?.name) {
          console.log(`   Assignee: ${issue.assignee.name}`);
        }
        if (issue.description) {
          const preview = issue.description.slice(0, 100);
          console.log(`   ${preview}${issue.description.length > 100 ? "..." : ""}`);
        }
        if (issue.url) {
          console.log(`   🔗 ${issue.url}`);
        }
      });
    }

    console.log("\n\n✅ Context retrieval complete!");
    console.log(`\nSummary: ${tasks.length} tasks, ${issues.length} issues`);

  } catch (error) {
    console.error("\n❌ Error retrieving context:");
    console.error(error);
    process.exit(1);
  }
}

main();
