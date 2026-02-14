#!/usr/bin/env bun
import { execSync } from "node:child_process";
import process from "node:process";

function run(cmd: string) {
  console.log(`[phase-runner] ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  run("git status -sb");
  run("bun test");
  console.log("✅ Tests passed. Ready to merge.");
} catch (error) {
  console.error("❌ Phase runner detected an error", error);
  process.exitCode = 1;
}
