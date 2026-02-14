#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import process from "node:process";
import { Command } from "commander";

interface Options {
  worktrees: string;
  script: string;
  basePort: number;
  portStep: number;
}

const program = new Command();
program
  .description("Launches one Bun script inside each git worktree (phase) in parallel.")
  .option("-w, --worktrees <dir>", "Directory containing git worktrees", "worktrees")
  .option("-s, --script <name>", "package script to run via `bun run`", "dev:api")
  .option("-b, --base-port <number>", "Starting port number", (value: string) => Number(value), 4100)
  .option("-p, --port-step <number>", "Port increment between worktrees", (value: string) => Number(value), 1)
  .allowUnknownOption(true);

const parsed = program.parse(process.argv);
const opts = parsed.opts<Options>();
const extraArgs = parsed.args as string[];

if (Number.isNaN(opts.basePort) || Number.isNaN(opts.portStep)) {
  console.error("base-port and port-step must be numbers");
  process.exit(1);
}

const worktreesRoot = resolve(process.cwd(), opts.worktrees);

const prefixStream = (stream: NodeJS.ReadableStream, prefix: string) => {
  let buffer = "";
  stream.on("data", chunk => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim().length) continue;
      console.log(`[${prefix}] ${line}`);
    }
  });
  stream.on("end", () => {
    if (buffer.trim().length) {
      console.log(`[${prefix}] ${buffer}`);
    }
  });
};

const children = new Set<ChildProcessWithoutNullStreams>();

const shutdown = () => {
  console.log("\nReceived exit signal. Shutting down worktree processes...");
  for (const child of children) {
    child.kill();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const launch = async () => {
  const entries = await readdir(worktreesRoot, { withFileTypes: true });
  const dirs = entries.filter(entry => entry.isDirectory() && !entry.name.startsWith("."));
  if (!dirs.length) {
    console.error(`No worktrees found in ${worktreesRoot}`);
    process.exit(1);
  }

  console.log(
    `Launching ${dirs.length} worktrees via 'bun run ${opts.script}' (base port ${opts.basePort})...`,
  );

  dirs.sort((a, b) => a.name.localeCompare(b.name));

  dirs.forEach((dir, index) => {
    const port = opts.basePort + index * opts.portStep;
    const cwd = join(worktreesRoot, dir.name);
    const args = ["run", opts.script, "--", "--port", String(port), ...extraArgs];
    const child = spawn("bun", args, {
      cwd,
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;

    children.add(child);

    const label = dir.name;
    prefixStream(child.stdout, label);
    prefixStream(child.stderr, `${label}:err`);

    child.on("close", code => {
      children.delete(child);
      console.log(`[${label}] exited with code ${code ?? "null"}`);
      if (!children.size) {
        process.exit(code ?? 0);
      }
    });

    child.on("error", error => {
      console.error(`[${label}] failed to start:`, error);
    });
  });
};

launch().catch(error => {
  console.error("Failed to launch worktrees", error);
  process.exit(1);
});
