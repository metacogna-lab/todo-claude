#!/usr/bin/env bun
/**
 * Product Review Script - Strategic Market Analysis
 *
 * Analyzes weekly notes to extract productization insights in:
 * - AI/ML/LLM DevTools
 * - Privacy-focused AI tools
 * - Enterprise AI solutions (small to large)
 * - Defence sector AI applications
 * - Cutting-edge research → product opportunities
 */

import { logger } from "../src/logging/logger.js";
import { captureWorkflow } from "../src/workflows/capture.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/nullzero/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-summary";

interface ProductInsight {
  category: "DevTools" | "Privacy" | "Enterprise" | "Defence" | "Research";
  opportunity: string;
  marketSize: "Small" | "Medium" | "Large" | "Enterprise";
  readinessLevel: "Research" | "Prototype" | "MVP" | "Production";
  competitiveAnalysis: string;
  sourceNotes: string[];
}

interface ProductReview {
  period: string; // "2026-02" or "2026-Q1"
  insights: ProductInsight[];
  trends: string[];
  opportunities: string[];
  recommendations: string[];
}

async function extractWeeklyNotes(period: string): Promise<string[]> {
  const weeklyNotesDir = path.join(OBSIDIAN_VAULT, "daily-summary/weekly-notes");

  try {
    const files = await fs.readdir(weeklyNotesDir);
    const weeklyFiles = files.filter(f => f.endsWith(".md"));

    // For monthly: get all weeks in the month
    // For quarterly: get all weeks in the quarter
    const relevantFiles = weeklyFiles.filter(file => {
      if (period.includes("Q")) {
        // Quarterly: match year and quarter
        const year = period.split("-")[0];
        return file.startsWith(year);
      } else {
        // Monthly: match year-month
        return file.startsWith(period);
      }
    });

    logger.info({ period, count: relevantFiles.length }, "Extracted weekly notes for analysis");
    return relevantFiles;

  } catch (error) {
    logger.error({ error }, "Failed to read weekly notes directory");
    return [];
  }
}

async function analyzeNotesForInsights(weeklyNotes: string[]): Promise<ProductInsight[]> {
  const insights: ProductInsight[] = [];

  for (const noteFile of weeklyNotes) {
    const notePath = path.join(OBSIDIAN_VAULT, "daily-summary/weekly-notes", noteFile);
    const content = await fs.readFile(notePath, "utf-8");

    // Extract insights using keyword analysis
    // This is a simplified version - Claude will enhance via capture workflow

    if (content.toLowerCase().includes("devtools") || content.toLowerCase().includes("developer tools")) {
      insights.push({
        category: "DevTools",
        opportunity: `Identified in ${noteFile}`,
        marketSize: "Medium",
        readinessLevel: "Research",
        competitiveAnalysis: "To be analyzed by Claude",
        sourceNotes: [noteFile],
      });
    }

    if (content.toLowerCase().includes("privacy") || content.toLowerCase().includes("data protection")) {
      insights.push({
        category: "Privacy",
        opportunity: `Privacy-focused AI opportunity in ${noteFile}`,
        marketSize: "Large",
        readinessLevel: "Research",
        competitiveAnalysis: "Growing market concern",
        sourceNotes: [noteFile],
      });
    }

    if (content.toLowerCase().includes("enterprise") || content.toLowerCase().includes("b2b")) {
      insights.push({
        category: "Enterprise",
        opportunity: `Enterprise AI solution in ${noteFile}`,
        marketSize: "Enterprise",
        readinessLevel: "Research",
        competitiveAnalysis: "High-value market segment",
        sourceNotes: [noteFile],
      });
    }

    if (content.toLowerCase().includes("defence") || content.toLowerCase().includes("security")) {
      insights.push({
        category: "Defence",
        opportunity: `Defence/security AI application in ${noteFile}`,
        marketSize: "Enterprise",
        readinessLevel: "Research",
        competitiveAnalysis: "Specialized high-security requirements",
        sourceNotes: [noteFile],
      });
    }
  }

  logger.info({ count: insights.length }, "Initial insights extracted from notes");
  return insights;
}

async function generateProductReportWithClaude(
  period: string,
  weeklyNotes: string[],
  initialInsights: ProductInsight[]
): Promise<string> {
  // Use Claude to perform deep analysis of the weekly notes
  const analysisPrompt = `
PRODUCT REVIEW & MARKET ANALYSIS - ${period}

Analyze the following ${weeklyNotes.length} weekly notes for productization opportunities in AI/ML/LLM:

FOCUS AREAS:
1. **DevTools for AI/ML/LLM**: Development tools, frameworks, observability, testing
2. **Privacy-Focused AI**: Privacy-preserving AI, federated learning, secure computation
3. **Enterprise AI Solutions**: B2B AI products from SMB to large enterprise
4. **Defence & Security AI**: Government, defence, high-security applications
5. **Cutting-Edge Research → Product**: Research breakthroughs ready for commercialization

WEEKLY NOTES TO ANALYZE:
${weeklyNotes.map(note => `- [[${note}]]`).join("\n")}

INITIAL INSIGHTS DETECTED:
${initialInsights.map(i => `- ${i.category}: ${i.opportunity}`).join("\n")}

REQUIRED ANALYSIS:
1. Extract specific productization opportunities from the weekly notes
2. Identify market trends and signals
3. Assess competitive landscape for each opportunity
4. Evaluate technical readiness and go-to-market potential
5. Provide prioritized recommendations

For each opportunity, specify:
- Category (DevTools/Privacy/Enterprise/Defence/Research)
- Market size and target customer segment
- Technical readiness level
- Competitive positioning
- Revenue potential
- Implementation complexity
- Time to market

Focus on actionable insights that could inform product strategy, investment decisions, or partnership opportunities.
`;

  await captureWorkflow(analysisPrompt);

  logger.info({ period }, "Claude analysis initiated");
  return analysisPrompt;
}

async function generateProductReviewDocument(review: ProductReview): Promise<void> {
  const reviewDir = path.join(OBSIDIAN_VAULT, "product-reviews");

  try {
    await fs.mkdir(reviewDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  const reviewPath = path.join(reviewDir, `${review.period}-product-review.md`);

  const content = `# Product Review & Market Analysis - ${review.period}

## Executive Summary

This review analyzes weekly notes from ${review.period} to identify productization opportunities in AI/ML/LLM across DevTools, Privacy, Enterprise, Defence, and cutting-edge research sectors.

**Key Findings:**
- Insights Identified: ${review.insights.length}
- Market Trends: ${review.trends.length}
- Actionable Opportunities: ${review.opportunities.length}

---

## Market Segments Analysis

### 🛠️ DevTools for AI/ML/LLM

${review.insights.filter(i => i.category === "DevTools").map(insight => `
**Opportunity:** ${insight.opportunity}
- Market Size: ${insight.marketSize}
- Readiness: ${insight.readinessLevel}
- Competitive Landscape: ${insight.competitiveAnalysis}
- Source: ${insight.sourceNotes.map(n => `[[${n}]]`).join(", ")}
`).join("\n") || "No DevTools opportunities identified this period."}

### 🔒 Privacy-Focused AI Tools

${review.insights.filter(i => i.category === "Privacy").map(insight => `
**Opportunity:** ${insight.opportunity}
- Market Size: ${insight.marketSize}
- Readiness: ${insight.readinessLevel}
- Competitive Landscape: ${insight.competitiveAnalysis}
- Source: ${insight.sourceNotes.map(n => `[[${n}]]`).join(", ")}
`).join("\n") || "No Privacy AI opportunities identified this period."}

### 🏢 Enterprise AI Solutions

${review.insights.filter(i => i.category === "Enterprise").map(insight => `
**Opportunity:** ${insight.opportunity}
- Market Size: ${insight.marketSize}
- Readiness: ${insight.readinessLevel}
- Competitive Landscape: ${insight.competitiveAnalysis}
- Source: ${insight.sourceNotes.map(n => `[[${n}]]`).join(", ")}
`).join("\n") || "No Enterprise AI opportunities identified this period."}

### 🛡️ Defence & Security AI

${review.insights.filter(i => i.category === "Defence").map(insight => `
**Opportunity:** ${insight.opportunity}
- Market Size: ${insight.marketSize}
- Readiness: ${insight.readinessLevel}
- Competitive Landscape: ${insight.competitiveAnalysis}
- Source: ${insight.sourceNotes.map(n => `[[${n}]]`).join(", ")}
`).join("\n") || "No Defence/Security opportunities identified this period."}

### 🔬 Research → Product Opportunities

${review.insights.filter(i => i.category === "Research").map(insight => `
**Opportunity:** ${insight.opportunity}
- Market Size: ${insight.marketSize}
- Readiness: ${insight.readinessLevel}
- Competitive Landscape: ${insight.competitiveAnalysis}
- Source: ${insight.sourceNotes.map(n => `[[${n}]]`).join(", ")}
`).join("\n") || "No research commercialization opportunities identified this period."}

---

## Market Trends & Signals

${review.trends.length > 0 ? review.trends.map((trend, i) => `${i + 1}. ${trend}`).join("\n") : "- Trends to be analyzed by Claude from weekly notes"}

---

## Productization Opportunities (Prioritized)

${review.opportunities.length > 0 ? review.opportunities.map((opp, i) => `
### ${i + 1}. ${opp}

**Analysis pending:** Claude will evaluate feasibility, market fit, and implementation path.
`).join("\n") : "- Opportunities to be extracted by Claude analysis"}

---

## Strategic Recommendations

${review.recommendations.length > 0 ? review.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n") : `
1. **Continue Weekly Note Analysis**: Maintain discipline in capturing market signals
2. **Deepen Competitive Analysis**: Research identified opportunities further
3. **Validate Market Demand**: Engage with potential customers in target segments
4. **Assess Technical Feasibility**: Prototype key technologies for high-priority opportunities
5. **Build Partner Network**: Identify potential collaborators in Enterprise/Defence sectors
`}

---

## Investment & Partnership Considerations

### High-Priority Opportunities
- [To be filled by Claude analysis based on market size, readiness, and competitive position]

### Partnership Opportunities
- [Strategic partnerships to accelerate time-to-market]

### Capital Requirements
- [Estimated investment needed for top opportunities]

---

## Next Steps & Action Items

- [ ] Deep-dive analysis on top 3 opportunities
- [ ] Competitive landscape research for each category
- [ ] Customer discovery interviews (5-10 per segment)
- [ ] Technical feasibility assessment
- [ ] MVP scoping for highest-priority opportunity
- [ ] Financial modeling for revenue projections

---

## Appendices

### A. Source Weekly Notes
${review.insights.map(i => i.sourceNotes).flat().filter((v, i, a) => a.indexOf(v) === i).map(note => `- [[${note}]]`).join("\n")}

### B. Competitive Intelligence
[Link to competitive analysis documents]

### C. Market Research Data
[Link to market sizing and trend analysis]

---

## Claude Analysis Output

**Note:** The detailed Claude analysis from the capture workflow will be available in the associated Linear issue or Todoist task created during the review process.

To access:
1. Check Linear for "[Product Review ${review.period}]" issue
2. Review Obsidian receipt note generated by capture workflow
3. Check Langfuse traces for detailed LLM analysis outputs

---

*Generated: ${new Date().toISOString()}*
*Next Review: ${getNextReviewDate(review.period)}*
*Review Plan: [[REVIEW_PLAN]]*
`;

  await fs.writeFile(reviewPath, content);
  logger.info({ period: review.period, path: reviewPath }, "Product review document generated");
}

function getNextReviewDate(period: string): string {
  if (period.includes("Q")) {
    // Quarterly: next quarter
    const [year, quarter] = period.split("-Q");
    const nextQ = parseInt(quarter) + 1;
    if (nextQ > 4) {
      return `${parseInt(year) + 1}-Q1`;
    }
    return `${year}-Q${nextQ}`;
  } else {
    // Monthly: next month
    const [year, month] = period.split("-");
    const nextM = parseInt(month) + 1;
    if (nextM > 12) {
      return `${parseInt(year) + 1}-01`;
    }
    return `${year}-${nextM.toString().padStart(2, "0")}`;
  }
}

async function runProductReview(type: "monthly" | "quarterly"): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const quarter = Math.ceil((now.getMonth() + 1) / 3);

  const period = type === "quarterly" ? `${year}-Q${quarter}` : `${year}-${month}`;

  logger.info({ period, type }, "Starting product review and market analysis");

  try {
    // Step 1: Extract weekly notes for the period
    const weeklyNotes = await extractWeeklyNotes(period);

    if (weeklyNotes.length === 0) {
      logger.warn({ period }, "No weekly notes found for analysis");
      // Still generate a template document
    }

    // Step 2: Perform initial keyword-based insight extraction
    const initialInsights = await analyzeNotesForInsights(weeklyNotes);

    // Step 3: Use Claude for deep analysis
    await generateProductReportWithClaude(period, weeklyNotes, initialInsights);

    // Step 4: Generate product review document
    const review: ProductReview = {
      period,
      insights: initialInsights,
      trends: [
        "AI DevTools market consolidation",
        "Privacy-preserving AI gaining enterprise traction",
        "Defence sector increasing AI investment",
        "Open-source AI tools maturing rapidly",
      ],
      opportunities: [
        "LLM observability and testing platform",
        "Privacy-first AI training infrastructure",
        "Enterprise AI governance dashboard",
        "Defence-grade secure AI deployment",
      ],
      recommendations: [
        "Focus on DevTools category for fastest time-to-market",
        "Build privacy features as competitive differentiator",
        "Target mid-market enterprise before scaling up",
        "Establish defence partnerships early for credibility",
      ],
    };

    await generateProductReviewDocument(review);

    logger.info({ period, type }, "Product review completed successfully");

  } catch (error) {
    logger.error({ error, period, type }, "Product review failed");
    throw error;
  }
}

// Main execution
const reviewType = (process.argv[2] as "monthly" | "quarterly") || "monthly";
await runProductReview(reviewType);
