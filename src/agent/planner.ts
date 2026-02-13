import { query } from "@anthropic-ai/claude-agent-sdk";
import { PlanSchema, type Plan } from "../plan/schema.js";
import { logger } from "../logging/logger.js";
import { loadEnv } from "../config/env.js";

/**
 * Claude is used ONLY to generate a plan with structured output.
 * Execution is deterministic and performed by our connectors.
 */
export async function generatePlan(userText: string): Promise<Plan> {
  const env = loadEnv();

  // JSON Schema for structured outputs (Agent SDK supports outputFormat json_schema)
  // We derive a JSON schema from Zod-ish manually to avoid extra deps.
  // NOTE: keep in sync with PlanSchema.
  const jsonSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      traceId: { type: "string" },
      userIntent: { type: "string" },
      assumptions: { type: "array", items: { type: "string" } },
      actions: {
        type: "array",
        minItems: 1,
        items: {
          oneOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { const: "obsidian.upsert_note" },
                notePath: { type: "string" },
                title: { type: "string" },
                markdown: { type: "string" },
                tags: { type: "array", items: { type: "string" } }
              },
              required: ["type", "notePath", "title", "markdown"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { const: "todoist.create_task" },
                content: { type: "string" },
                description: { type: "string" },
                due: { type: "string" },
                priority: { type: "integer", minimum: 1, maximum: 4 },
                projectId: { type: "string" },
                labels: { type: "array", items: { type: "string" } }
              },
              required: ["type", "content"]
            },
            {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { const: "linear.create_issue" },
                teamId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                assigneeId: { type: "string" },
                labels: { type: "array", items: { type: "string" } }
              },
              required: ["type", "teamId", "title"]
            }
          ]
        }
      },
      receiptSummary: { type: "string" }
    },
    required: ["traceId", "userIntent", "actions", "receiptSummary"]
  } as const;

  const system = [
    "You are a planning agent for a personal assistant.",
    "You MUST output JSON that conforms to the provided JSON schema.",
    "Your job: translate the user's request into a deterministic execution plan using ONLY the supported action types:",
    "- obsidian.upsert_note",
    "- todoist.create_task",
    "- linear.create_issue",
    "",
    "Rules:",
    "1) Prefer creating ONE Obsidian note that captures context + links. Use a stable notePath.",
    "2) Create Todoist tasks for actionable personal work items.",
    "3) Create Linear issues only for scoped team/engineering work. If unsure, put it in Todoist, not Linear.",
    "4) Use ISO-8601 dates when you infer due dates. If not given, omit due.",
    "5) Include a concise receiptSummary for audit logs.",
    "6) Add tags/labels if the user hints at projects; otherwise keep it minimal.",
    "",
    "When you need defaults you don't know (e.g., Linear teamId), still produce the action with placeholders:",
    "- teamId: "__DEFAULT_TEAM__"",
    "- projectId: "__DEFAULT_PROJECT__"",
    "- assigneeId: "__DEFAULT_ASSIGNEE__"",
    "",
    "Never invent credentials. Never include secrets."
  ].join("\n");

  logger.info({ userText }, "Generating plan with Claude Agent SDK");

  // We do NOT allow tools here; we only want structured output.
  const q = query({
    prompt: userText,
    options: {
      model: env.CLAUDE_MODEL,
      systemPrompt: system,
      allowedTools: [],
      outputFormat: { type: "json_schema", schema: jsonSchema }
    }
  });

  let resultJson: any | null = null;

  for await (const msg of q) {
    if (msg.type === "result") {
      // Agent SDK result message carries the final structured output
      // @ts-expect-error - runtime shape from SDK
      resultJson = msg.result ?? msg;
    }
  }

  if (!resultJson) throw new Error("No plan produced by the Agent SDK");

  // Some SDK variants nest the JSON under { output: ... }
  const candidate = (resultJson.output ?? resultJson) as unknown;

  const parsed = PlanSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Plan failed schema validation: ${issues}\nPlan: ${JSON.stringify(candidate, null, 2)}`);
  }

  return parsed.data;
}
