import { performance } from "node:perf_hooks";

export type GraphQLMetric = {
  operationName: string;
  durationMs: number;
  success: boolean;
  timestamp: string;
};

export type HealthSnapshot = {
  status: "healthy" | "degraded" | "failing";
  successRate: number;
  avgDurationMs: number;
  samples: number;
  lastUpdatedAt?: string;
};

const graphQLMetrics: GraphQLMetric[] = [];
const MAX_METRICS = 200;

export function recordGraphQLMetric(metric: Omit<GraphQLMetric, "timestamp">): GraphQLMetric {
  const entry: GraphQLMetric = { ...metric, timestamp: new Date().toISOString() };
  graphQLMetrics.push(entry);
  while (graphQLMetrics.length > MAX_METRICS) graphQLMetrics.shift();
  return entry;
}

export function summarizeHealth(): HealthSnapshot {
  if (!graphQLMetrics.length) {
    return {
      status: "degraded",
      successRate: 0,
      avgDurationMs: 0,
      samples: 0,
    };
  }

  const successCount = graphQLMetrics.filter(m => m.success).length;
  const avgDurationMs =
    graphQLMetrics.reduce((acc, metric) => acc + metric.durationMs, 0) / graphQLMetrics.length;
  const successRate = successCount / graphQLMetrics.length;
  const status: HealthSnapshot["status"] =
    successRate > 0.95 ? "healthy" : successRate > 0.8 ? "degraded" : "failing";

  return {
    status,
    successRate: Number(successRate.toFixed(3)),
    avgDurationMs: Number(avgDurationMs.toFixed(2)),
    samples: graphQLMetrics.length,
    lastUpdatedAt: graphQLMetrics.at(-1)?.timestamp,
  };
}

export function resetMetrics(): void {
  graphQLMetrics.length = 0;
}

export function timed<T>(operationName: string, fn: () => Promise<T> | T): Promise<T> {
  const start = performance.now();
  return Promise.resolve(fn())
    .then(result => {
      recordGraphQLMetric({
        operationName,
        durationMs: performance.now() - start,
        success: true,
      });
      return result;
    })
    .catch(error => {
      recordGraphQLMetric({
        operationName,
        durationMs: performance.now() - start,
        success: false,
      });
      throw error;
    });
}
