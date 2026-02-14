import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { logger } from "../logging/logger.js";

type WebhookSource = "todoist" | "linear" | "obsidian";

const routeMap: Record<string, WebhookSource> = {
  "/webhooks/todoist": "todoist",
  "/webhooks/linear": "linear",
  "/webhooks/obsidian": "obsidian",
};

function triggerReload(source: WebhookSource, payload: unknown): void {
  logger.info({ source, payload }, "Received webhook; triggering reload");
}

async function parseBody(req: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return null;
  const raw = Buffer.concat(chunks).toString("utf-8");
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function startWebhookServer(port = Number(process.env.WEBHOOK_PORT ?? 4100)): void {
  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }
    const route = routeMap[req.url];
    if (!route) {
      res.writeHead(404).end("Not found");
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405).end("Method not allowed");
      return;
    }
    try {
      const payload = await parseBody(req);
      triggerReload(route, payload);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } catch (error) {
      logger.error({ err: error }, "Webhook handler failed");
      res.writeHead(500).end("Internal error");
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "Webhook server listening");
  });
}
