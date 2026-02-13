import { randomUUID } from "node:crypto";
import { getDb } from "../storage/db.js";
import { VerificationResultSchema, VerificationIssueSchema, type VerificationResult } from "../schema/verification.js";
import { listDetailSourceLinks } from "../execution/store.js";

const insertVerificationStmt = () => getDb().query(`
  INSERT INTO verification_results (
    id, trace_id, run_id, status, issues, created_at
  ) VALUES (
    $id, $trace_id, $run_id, $status, $issues, $created_at
  );
`);

type VerificationRule = (params: { traceId: string; runId: string }) => Promise<string | null>;

const rules: VerificationRule[] = [
  async ({ traceId }) => {
    const links = await listDetailSourceLinks(traceId);
    if (!links.length) return "detail_links_missing";
    return null;
  },
];

export async function verifyExecution(traceId: string, runId: string): Promise<VerificationResult> {
  const issues: string[] = [];
  for (const rule of rules) {
    const issue = await rule({ traceId, runId });
    if (issue) issues.push(issue);
  }

  const result = VerificationResultSchema.parse({
    id: randomUUID(),
    traceId,
    runId,
    status: issues.length ? "failing" : "passing",
    issues: issues.map(code => VerificationIssueSchema.parse({ code, message: describeIssue(code) })),
    createdAt: new Date().toISOString(),
  });

  insertVerificationStmt().run({
    $id: result.id,
    $trace_id: result.traceId,
    $run_id: result.runId,
    $status: result.status,
    $issues: JSON.stringify(result.issues),
    $created_at: result.createdAt,
  });

  return result;
}

function describeIssue(code: string): string {
  switch (code) {
    case "detail_links_missing":
      return "Detail source links missing for trace; receipts/external IDs not recorded.";
    default:
      return "Unknown verification issue";
  }
}

export async function listVerificationResults(traceId?: string): Promise<VerificationResult[]> {
  const db = getDb();
  const rows = traceId
    ? db.query(`SELECT * FROM verification_results WHERE trace_id = ? ORDER BY created_at DESC`).all(traceId)
    : db.query(`SELECT * FROM verification_results ORDER BY created_at DESC`).all();
  return rows.map(row =>
    VerificationResultSchema.parse({
      id: row.id,
      traceId: row.trace_id,
      runId: row.run_id,
      status: row.status,
      issues: JSON.parse(row.issues),
      createdAt: row.created_at,
    })
  );
}
