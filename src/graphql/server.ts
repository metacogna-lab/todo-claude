import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema.js";
import { createObservabilityPlugin } from "./plugins/observability.js";
import { logger } from "../logging/logger.js";
import { ensureTelemetryStarted } from "../observability/otel.js";
import { loadEnv } from "../config/env.js";

loadEnv();

ensureTelemetryStarted();

export function buildGraphQLServer() {
  return createYoga({
    schema,
    plugins: [createObservabilityPlugin()],
    graphqlEndpoint: "/graphql",
    maskedErrors: {
      errorMessage: "Internal error",
    },
    logging: {
      debug: (...args) => logger.debug(args),
      info: (...args) => logger.info(args),
      warn: (...args) => logger.warn(args),
      error: (...args) => logger.error(args),
    },
  });
}

export async function startGraphQLServer(port = Number(process.env.PORT ?? 4000)): Promise<void> {
  const yoga = buildGraphQLServer();

  const server = createServer(yoga);
  server.listen(port, () => {
    logger.info({ port }, "GraphQL server listening");
  });
}

const isExecutedDirectly = fileURLToPath(import.meta.url) === process.argv[1];
if (isExecutedDirectly) {
  startGraphQLServer().catch(error => {
    logger.error({ err: error }, "GraphQL server failed to start");
    process.exitCode = 1;
  });
}
