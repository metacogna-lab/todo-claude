import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { logger } from "../logging/logger.js";

export type PreviewEditsInput = {
  instructions: string;
  files?: string[];
};

export type CodeEditSnippet = {
  path: string;
  diff: string;
};

export async function previewEdits(input: PreviewEditsInput): Promise<{ edits: CodeEditSnippet[] }> {
  if (!input.instructions.trim()) throw new Error("instructions are required");

  const targets = input.files?.length ? input.files : ["README.md"];
  const edits: CodeEditSnippet[] = [];

  for (const file of targets) {
    try {
      const path = resolve(process.cwd(), file);
      const current = await readFile(path, "utf-8");
      const diff = buildDiffPlaceholder(current);
      edits.push({ path: file, diff });
    } catch (error) {
      logger.warn({ file, error }, "Failed to preview edits");
    }
  }

  return { edits };
}

function buildDiffPlaceholder(existing: string): string {
  const lines = existing.split("\n").slice(0, 5).join("\n");
  return `--- preview\n+++ suggestion\n@@\n${lines}\n# ... apply instructions manually ...\n`;
}
