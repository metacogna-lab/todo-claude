import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { runDoctorChecks } from "../src/services/doctor.js";

const originalEnv = { ...process.env };

describe("doctor resource checks", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reports pass when key connectors configured", async () => {
    process.env.OPENAI_API_KEY = "test";
    process.env.OBSIDIAN_VAULT_PATH = "obsidian://open?vault=test";
    process.env.TODOIST_API_TOKEN = "todo-test";
    process.env.LINEAR_API_TOKEN = "linear-test";
    process.env.LANGFUSE_PUBLIC_KEY = "pk";
    process.env.LANGFUSE_SECRET_KEY = "sk";
    process.env.LANGFUSE_HOST = "https://cloud.langfuse.com";
    process.env.TAVILY_API_KEY = "tvly";
    process.env.EVALS_DIR = "/tmp";

    const checks = await runDoctorChecks();
    const statusMap = Object.fromEntries(checks.map(check => [check.name, check.status]));
    expect(statusMap["OPENAI_API_KEY"]).toBe("pass");
    expect(statusMap["Obsidian vault"]).toBe("pass");
    expect(statusMap["Todoist"]).toBe("pass");
    expect(statusMap["Linear"]).toBe("pass");
    expect(statusMap["Langfuse"]).toBe("pass");
    expect(statusMap["Web Search"]).toBe("pass");
  });

  it("warns when keys missing", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OBSIDIAN_VAULT_PATH;
    delete process.env.TODOIST_API_TOKEN;
    delete process.env.LINEAR_API_TOKEN;
    delete process.env.LANGFUSE_PUBLIC_KEY;
    delete process.env.LANGFUSE_SECRET_KEY;
    delete process.env.LANGFUSE_HOST;
    delete process.env.TAVILY_API_KEY;

    await expect(runDoctorChecks()).rejects.toThrow();
  });
});
