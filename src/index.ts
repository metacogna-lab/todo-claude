import { Command } from "commander";
import { captureWorkflow } from "./workflows/capture.js";
import { logger } from "./logging/logger.js";
import { startGraphQLServer } from "./graphql/server.js";

const program = new Command();

program
  .name("claude-assistant")
  .description("Claude Agent SDK assistant that syncs Obsidian, Todoist, and Linear.")
  .version("0.1.0");

program
  .command("capture")
  .description("Capture a thought/request; create Obsidian note + Todoist tasks + Linear tickets.")
  .argument("<text...>", "Text to capture")
  .action(async (textParts: string[]) => {
    const text = textParts.join(" ").trim();
    if (!text) throw new Error("Empty text");
    await captureWorkflow(text);
  });

program
  .command("doctor")
  .description("Validate environment configuration and show quick hints.")
  .action(async () => {
    const required = ["OPENAI_API_KEY"];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
      logger.error({ missing }, "Missing required env vars");
      process.exitCode = 1;
      return;
    }
    logger.info("Env looks OK. Next: configure OBSIDIAN_VAULT_PATH, TODOIST_API_TOKEN, LINEAR_API_TOKEN.");
  });

program
  .command("api")
  .description("Start the GraphQL API server")
  .option("-p, --port <port>", "Port to bind", "4000")
  .action(async (options: { port: string }) => {
    await startGraphQLServer(Number(options.port));
  });

await program.parseAsync(process.argv);
