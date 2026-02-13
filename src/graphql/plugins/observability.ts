import type { Plugin } from "@graphql-yoga/node";
import { performance } from "node:perf_hooks";
import { recordGraphQLMetric } from "../../observability/monitoring.js";
import { recordGraphQLOperationTrace } from "../../observability/langfuse.js";

export function createObservabilityPlugin(): Plugin {
  return {
    onExecute({ args }) {
      const started = performance.now();
      const operationName = args.operationName ?? "anonymous";

      return {
        async onExecuteDone({ result }) {
          const durationMs = performance.now() - started;
          const success = !result.errors?.length;

          recordGraphQLMetric({
            operationName,
            durationMs,
            success,
          });

          await recordGraphQLOperationTrace({
            operationName,
            durationMs,
            success,
          });
        },
      };
    },
  };
}
