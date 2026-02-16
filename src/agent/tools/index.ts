/**
 * Review Tools - Barrel Export
 *
 * Exports all review tools for easy import in agents.
 */

export { dailyReviewTool, runDailyReview } from "./daily-review.tool.js";
export { weeklyReviewTool, runWeeklyReview } from "./weekly-review.tool.js";
export { productReviewTool, runProductReview } from "./product-review.tool.js";

export type { DailyReviewInput, DailyReviewOutput } from "./daily-review.tool.js";
export type { WeeklyReviewInput, WeeklyReviewOutput } from "./weekly-review.tool.js";
export type {
  ProductReviewInput,
  ProductReviewOutput,
  ProductInsight,
  ReviewType,
} from "./product-review.tool.js";

/**
 * All review tools as an array for easy agent configuration
 */
export const reviewTools = [
  dailyReviewTool,
  weeklyReviewTool,
  productReviewTool,
];
