import { Command } from "commander";
import { captureWorkflow } from "./workflows/capture.js";
import { logger } from "./logging/logger.js";
import { startGraphQLServer } from "./graphql/server.js";
import { registerDevtoolsArtifact } from "./observability/devtools.js";
import { listTraceSnapshots, loadTraceSnapshot } from "./evals/recorder.js";
import { runDoctor } from "./services/doctor.js";
import { ensureTelemetryStarted } from "./observability/otel.js";

ensureTelemetryStarted();

const program = new Command();

program
  .name("claude-assistant")
  .description(
    "Claude Agent SDK assistant that syncs Obsidian, Todoist, and Linear."
  )
  .version("0.1.0");

program
  .command("capture")
  .description(
    "Capture a thought/request; create Obsidian note + Todoist tasks + Linear tickets."
  )
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
    try {
      await runDoctor();
      logger.info("Doctor checks completed");
    } catch (error) {
      logger.error({ err: error }, "Doctor detected issues");
      process.exitCode = 1;
    }
  });

program
  .command("api")
  .description("Start the GraphQL API server")
  .option("-p, --port <port>", "Port to bind", "4000")
  .action(async (options: { port: string }) => {
    await startGraphQLServer(Number(options.port));
  });

program
  .command("observability:devtools")
  .description("Register a DevTools artifact for a trace")
  .argument("<traceId>", "Trace identifier")
  .argument("<sourcePath>", "Path to the DevTools export")
  .option("--label <label>", "Optional label for the artifact")
  .action(
    async (
      traceId: string,
      sourcePath: string,
      options: { label?: string }
    ) => {
      const params: { traceId: string; sourcePath: string; label?: string } = {
        traceId,
        sourcePath,
      };
      if (options.label) params.label = options.label;
      const stored = await registerDevtoolsArtifact(params);
      logger.info({ traceId, stored }, "DevTools artifact registered");
    }
  );

program
  .command("observability:snapshots")
  .description("List recorded evaluation snapshots for a trace")
  .argument("<traceId>", "Trace identifier")
  .action(async (traceId: string) => {
    const snapshots = await listTraceSnapshots(traceId);
    if (!snapshots.length) {
      logger.warn({ traceId }, "No snapshots found");
      return;
    }
    snapshots.forEach((snapshot) => {
      logger.info(
        {
          traceId,
          file: snapshot.file,
          createdAt: snapshot.createdAt,
          size: snapshot.size,
        },
        "Snapshot"
      );
    });
    logger.info({ traceId, total: snapshots.length }, "Snapshot summary");
  });

program
  .command("observability:replay")
  .description("Replay a stored evaluation snapshot")
  .argument("<traceId>", "Trace identifier")
  .argument("<file>", "Snapshot file name")
  .action(async (traceId: string, file: string) => {
    const payload = await loadTraceSnapshot(traceId, file);
    if (!payload) {
      logger.error({ traceId, file }, "Snapshot not found");
      process.exitCode = 1;
      return;
    }
    logger.info(
      { traceId, file, plan: payload.plan.traceId },
      "Snapshot replayed"
    );
    console.log(JSON.stringify(payload, null, 2));
  });

try {
  await program.parseAsync(process.argv);
} catch (error) {
  logger.error({ err: error }, "CLI command failed");
  if (!process.exitCode) process.exitCode = 1;
}
