import fs from "node:fs/promises";
import path from "node:path";
import { httpJson } from "./http.js";

/**
 * Obsidian integration options:
 * 1) Local vault filesystem writes (recommended for personal automation).
 * 2) REST plugin endpoint (if you prefer networked/remote writes).
 */

export type ObsidianUpsertResult = { notePath: string; uri?: string };

export class ObsidianVault {
  constructor(private vaultPath: string) {}

  async upsertNote(notePath: string, markdown: string): Promise<ObsidianUpsertResult> {
    const abs = path.resolve(this.vaultPath, notePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, markdown, "utf-8");

    // Obsidian URI format varies; we provide a best-effort local vault open link.
    const fileName = path.basename(notePath);
    const uri = `obsidian://open?path=${encodeURIComponent(notePath)}&file=${encodeURIComponent(fileName)}`;
    return { notePath, uri };
  }
}

export class ObsidianRest {
  constructor(private baseUrl: string, private token?: string) {}

  async upsertNote(notePath: string, markdown: string): Promise<ObsidianUpsertResult> {
    // This is intentionally generic because community plugin endpoints vary.
    // You can adapt this to your plugin of choice.
    const url = `${this.baseUrl.replace(/\/$/, "")}/note`;
    await httpJson<any>({
      method: "PUT",
      url,
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
      body: { path: notePath, content: markdown },
    });
    const uri = `obsidian://open?path=${encodeURIComponent(notePath)}`;
    return { notePath, uri };
  }
}
