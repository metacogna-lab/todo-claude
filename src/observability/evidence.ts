import { randomUUID } from "node:crypto";
import { getDb } from "../storage/db.js";
import {
  ObservabilityEvidenceSchema,
  type ObservabilityEvidence,
} from "../schema/observability.js";

export type EvidenceStatus = "recorded" | "missing_config" | "failed";
export type EvidenceKind = ObservabilityEvidence["kind"];

export type RecordEvidenceInput = {
  traceId: string;
  kind: EvidenceKind;
  reference: string;
  status: EvidenceStatus;
  metadata?: Record<string, unknown>;
};

export async function recordEvidence(
  input: RecordEvidenceInput
): Promise<ObservabilityEvidence> {
  const db = getDb();
  const payload = ObservabilityEvidenceSchema.parse({
    id: randomUUID(),
    traceId: input.traceId,
    kind: input.kind,
    reference: input.reference,
    status: input.status,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });

  db.query(
    `
    INSERT INTO observability_evidence (
      id, trace_id, kind, reference, status, metadata, created_at
    ) VALUES (
      $id, $trace_id, $kind, $reference, $status, $metadata, $created_at
    );
  `
  ).run({
    $id: payload.id,
    $trace_id: payload.traceId,
    $kind: payload.kind,
    $reference: payload.reference,
    $status: payload.status,
    $metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    $created_at: payload.createdAt,
  });

  return payload;
}

type EvidenceRow = {
  id: string;
  trace_id: string;
  kind: EvidenceKind;
  reference: string;
  status: EvidenceStatus;
  metadata: string | null;
  created_at: string;
};

export async function listEvidence(
  traceId: string,
  kind?: EvidenceKind
): Promise<ObservabilityEvidence[]> {
  const db = getDb();
  const rows = kind
    ? db
        .query<EvidenceRow>(
          `SELECT * FROM observability_evidence WHERE trace_id = ? AND kind = ? ORDER BY created_at ASC`
        )
        .all(traceId, kind)
    : db
        .query<EvidenceRow>(
          `SELECT * FROM observability_evidence WHERE trace_id = ? ORDER BY created_at ASC`
        )
        .all(traceId);

  return rows.map((row: EvidenceRow) =>
    ObservabilityEvidenceSchema.parse({
      id: row.id,
      traceId: row.trace_id,
      kind: row.kind,
      reference: row.reference,
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    })
  );
}

export async function hasRecordedEvidence(
  traceId: string,
  kind: EvidenceKind
): Promise<boolean> {
  const db = getDb();
  const row = db
    .query(
      `SELECT 1 FROM observability_evidence WHERE trace_id = ? AND kind = ? AND status = 'recorded' ORDER BY created_at DESC LIMIT 1`
    )
    .get(traceId, kind);
  return Boolean(row);
}
