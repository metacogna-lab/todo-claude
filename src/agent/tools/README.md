# Claude Agent SDK Tools - Review System

This directory contains Claude Agent SDK tool wrappers for the review system skills.

## Overview

Each review skill (daily-review, weekly-review, product-review) is wrapped as a TypeScript tool that can be:
1. Used programmatically in Agent SDK applications
2. Invoked via Claude Skills (`/daily-review`, etc.)
3. Called directly as functions

## Available Tools

### 1. Daily Review Tool

**Tool Name**: `daily_review`

**Purpose**: Process notes, sync tasks, generate daily summary

**Input**:
```typescript
{
  dryRun?: boolean;          // Default: false
  generateSummary?: boolean;  // Default: true
}
```

**Output**:
```typescript
{
  success: boolean;
  summaryPath?: string;      // Path to generated summary
  processedNotes: number;    // Count of notes processed
  tasksCreated: number;      // Count of tasks created
  errors?: string[];         // Any errors encountered
}
```

**Usage**:
```typescript
import { dailyReviewTool, runDailyReview } from "./tools/daily-review.tool.js";

// Via tool (in agent)
const result = await agent.run("Run daily review");

// Direct function call
const result = await runDailyReview({
  dryRun: false,
  generateSummary: true,
});
```

---

### 2. Weekly Review Tool

**Tool Name**: `weekly_review`

**Purpose**: Consolidate daily summaries, identify patterns, generate weekly insights

**Input**:
```typescript
{
  dryRun?: boolean;              // Default: false
  archiveDailySummaries?: boolean; // Default: true
}
```

**Output**:
```typescript
{
  success: boolean;
  summaryPath?: string;          // Path to weekly summary
  weekNumber: string;            // YYYY-WWW format
  dailySummariesProcessed: number;
  patternsIdentified: number;
  errors?: string[];
}
```

**Usage**:
```typescript
import { weeklyReviewTool, runWeeklyReview } from "./tools/weekly-review.tool.js";

// Via tool (in agent)
const result = await agent.run("Run weekly review");

// Direct function call
const result = await runWeeklyReview({
  dryRun: false,
  archiveDailySummaries: true,
});
```

---

### 3. Product Review Tool

**Tool Name**: `product_review`

**Purpose**: Analyze weekly notes for AI/ML/LLM productization opportunities

**Input**:
```typescript
{
  type: "monthly" | "quarterly";  // Required
  dryRun?: boolean;              // Default: false
  focusCategories?: Array<
    "DevTools" | "Privacy" | "Enterprise" | "Defence" | "Research"
  >;
}
```

**Output**:
```typescript
{
  success: boolean;
  reviewPath?: string;           // Path to product review
  period: string;                // YYYY-MM or YYYY-QQ
  insightsFound: number;
  opportunitiesIdentified: number;
  insights?: ProductInsight[];   // Extracted insights
  errors?: string[];
}

interface ProductInsight {
  category: "DevTools" | "Privacy" | "Enterprise" | "Defence" | "Research";
  opportunity: string;
  marketSize: "Small" | "Medium" | "Large" | "Enterprise";
  readinessLevel: "Research" | "Prototype" | "MVP" | "Production";
}
```

**Usage**:
```typescript
import { productReviewTool, runProductReview } from "./tools/product-review.tool.js";

// Via tool (in agent)
const result = await agent.run("Run monthly product review");

// Direct function call
const result = await runProductReview({
  type: "monthly",
  dryRun: false,
  focusCategories: ["DevTools", "Privacy"],
});
```

---

## Agent Integration

### Quick Setup

```typescript
import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { reviewTools } from "./agent/tools/index.js";

const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  tools: reviewTools, // Includes all three review tools
  model: "claude-sonnet-4-5",
});

// Agent can now use review tools automatically
const result = await agent.run("Run daily review and summarize the results");
```

### Individual Tool Setup

```typescript
import { dailyReviewTool } from "./agent/tools/daily-review.tool.js";

const agent = new Agent({
  tools: [dailyReviewTool],
});
```

### Programmatic Workflow

```typescript
import {
  runDailyReview,
  runWeeklyReview,
  runProductReview,
} from "./agent/tools/index.js";

async function fullReviewWorkflow() {
  // Run daily review
  console.log("Running daily review...");
  const dailyResult = await runDailyReview();

  if (!dailyResult.success) {
    console.error("Daily review failed:", dailyResult.errors);
    return;
  }

  console.log(`✓ Processed ${dailyResult.processedNotes} notes`);
  console.log(`✓ Created ${dailyResult.tasksCreated} tasks`);

  // Check if it's end of week
  const isEndOfWeek = new Date().getDay() === 5; // Friday

  if (isEndOfWeek) {
    console.log("Running weekly review...");
    const weeklyResult = await runWeeklyReview();

    if (weeklyResult.success) {
      console.log(`✓ Week ${weeklyResult.weekNumber} summary created`);
      console.log(`✓ Processed ${weeklyResult.dailySummariesProcessed} daily summaries`);
    }
  }

  // Check if it's end of month
  const now = new Date();
  const isEndOfMonth = now.getDate() === 1; // 1st of month

  if (isEndOfMonth) {
    console.log("Running monthly product review...");
    const productResult = await runProductReview({ type: "monthly" });

    if (productResult.success) {
      console.log(`✓ Product review for ${productResult.period} created`);
      console.log(`✓ Found ${productResult.insightsFound} insights`);
      console.log(`✓ Identified ${productResult.opportunitiesIdentified} opportunities`);
    }
  }
}

// Execute
await fullReviewWorkflow();
```

---

## Advanced Usage

### Custom Agent with Review Tools

```typescript
import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { reviewTools } from "./agent/tools/index.js";

const reviewAgent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-5",
  tools: reviewTools,
  systemPrompt: `You are a product intelligence analyst specializing in AI/ML/LLM markets.

When analyzing notes for product reviews:
1. Focus on market signals and customer pain points
2. Identify competitive gaps and opportunities
3. Assess technical feasibility and readiness
4. Provide actionable strategic recommendations

Use the review tools to:
- Daily: Process incoming notes and extract insights
- Weekly: Identify patterns and themes across the week
- Monthly/Quarterly: Generate comprehensive product intelligence reports`,
});

// Agent will automatically use review tools when appropriate
const result = await reviewAgent.run(`
  Analyze this week's notes and identify the top 3 productization opportunities.
  Focus on DevTools and Privacy sectors.
`);
```

### Error Handling

```typescript
import { runProductReview } from "./agent/tools/index.js";

async function robustProductReview() {
  try {
    const result = await runProductReview({
      type: "monthly",
      focusCategories: ["DevTools", "Privacy"],
    });

    if (!result.success) {
      console.error("Product review failed:");
      result.errors?.forEach(error => console.error(`  - ${error}`));
      return;
    }

    if (result.insights && result.insights.length > 0) {
      console.log("\nProduct Insights:");
      result.insights.forEach((insight, i) => {
        console.log(`\n${i + 1}. ${insight.category}: ${insight.opportunity}`);
        console.log(`   Market: ${insight.marketSize}`);
        console.log(`   Readiness: ${insight.readinessLevel}`);
      });
    } else {
      console.log("No insights found this period.");
      console.log("Ensure weekly notes exist and contain market signals.");
    }

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
```

### Dry Run Mode

Test reviews without making changes:

```typescript
// Dry run - no files created, no API calls
const result = await runProductReview({
  type: "monthly",
  dryRun: true,
});

console.log("Dry run completed:");
console.log(`Would analyze ${result.period}`);
console.log(`Would create review at: ${result.reviewPath}`);
```

---

## Integration with Existing Workflows

### With Capture Workflow

```typescript
import { captureWorkflow } from "../../workflows/capture.js";
import { runDailyReview } from "../tools/daily-review.tool.js";

async function captureAndReview(thought: string) {
  // First, capture the thought (creates notes/tasks)
  await captureWorkflow(thought);

  // Then, run daily review to process it
  const result = await runDailyReview();

  return result;
}
```

### With GraphQL API

```typescript
import { productReviewTool } from "../tools/product-review.tool.js";

// In GraphQL resolver
const resolvers = {
  Mutation: {
    runProductReview: async (_: any, args: { type: "monthly" | "quarterly" }) => {
      const result = await productReviewTool.function(args);
      return result;
    },
  },
};
```

---

## Testing

### Unit Tests

```typescript
import { expect, test } from "bun:test";
import { runDailyReview } from "./daily-review.tool.js";

test("daily review runs successfully in dry-run mode", async () => {
  const result = await runDailyReview({ dryRun: true });

  expect(result.success).toBe(true);
  expect(result.errors).toBeUndefined();
});

test("daily review generates summary", async () => {
  const result = await runDailyReview({
    dryRun: true,
    generateSummary: true,
  });

  expect(result.summaryPath).toBeDefined();
});
```

### Integration Tests

```typescript
test("full review workflow", async () => {
  // Run daily review
  const daily = await runDailyReview({ dryRun: true });
  expect(daily.success).toBe(true);

  // Run weekly review
  const weekly = await runWeeklyReview({ dryRun: true });
  expect(weekly.success).toBe(true);

  // Run product review
  const product = await runProductReview({
    type: "monthly",
    dryRun: true,
  });
  expect(product.success).toBe(true);
});
```

---

## Environment Variables

All tools respect the following environment variables:

```bash
# Dry run mode (no changes made)
DRY_RUN=true

# Obsidian vault path
OBSIDIAN_VAULT_PATH=/path/to/vault

# Todoist integration
TODOIST_API_TOKEN=your-token

# Linear integration
LINEAR_API_KEY=your-key

# Langfuse observability
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_SECRET_KEY=your-secret-key

# Product review focus
FOCUS_CATEGORIES=DevTools,Privacy,Enterprise
```

---

## Troubleshooting

### Tool Not Working

1. **Check dependencies**:
   ```bash
   bun install
   ```

2. **Verify scripts exist**:
   ```bash
   ls -l scripts/*.ts
   ```

3. **Test script directly**:
   ```bash
   bun run review:daily
   ```

4. **Check logs**:
   ```bash
   tail -f /tmp/claude-daily-review.log
   ```

### Agent Not Using Tools

1. **Verify tool registration**:
   ```typescript
   console.log(agent.tools.map(t => t.name));
   // Should include: daily_review, weekly_review, product_review
   ```

2. **Check tool descriptions**:
   - Ensure descriptions clearly indicate when to use each tool
   - Add more specific keywords to match user queries

3. **Explicit tool invocation**:
   ```typescript
   const result = await agent.run("Use the daily_review tool");
   ```

---

## Related Documentation

- **[Skills](../../.claude/skills/SKILLS.md)** - Skill definitions and usage
- **[Review Plan](../../../claude-summary/REVIEW_PLAN.md)** - Complete methodology
- **[Agent SDK Docs](https://github.com/anthropics/claude-agent-sdk)** - Official SDK documentation

---

*Tools created: 2026-02-15*
*Version: 1.0*
*Compatible with: Claude Agent SDK v0.2.41+*
