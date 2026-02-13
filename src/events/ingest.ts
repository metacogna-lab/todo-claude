import { EventEnvelopeSchema, type EventEnvelope } from "../schema/event.js";
import { getDb } from "../storage/db.js";
import { upsertPlanningContextFromEvent } from "../context/planning.js";

const insertEventStmt = () => getDb().query(`
  INSERT INTO events (
    event_id, trace_id, source, type, occurred_at, received_at, payload, context
  ) VALUES (
    $event_id, $trace_id, $source, $type, $occurred_at, $received_at, $payload, $context
  )
  ON CONFLICT(event_id) DO UPDATE SET
    trace_id=excluded.trace_id,
    source=excluded.source,
    type=excluded.type,
    occurred_at=excluded.occurred_at,
    received_at=excluded.received_at,
    payload=excluded.payload,
    context=excluded.context;
`);

export async function ingestEvent(envelopeInput: unknown): Promise<EventEnvelope> {
  const envelope = EventEnvelopeSchema.parse(envelopeInput);
  const payload = envelope.payload ? JSON.stringify(envelope.payload) : null;
  getDb().transaction((ev: EventEnvelope) => {
    insertEventStmt().run({
      $event_id: ev.event_id,
      $trace_id: ev.trace_id,
      $source: ev.source,
      $type: ev.type,
      $occurred_at: ev.occurred_at,
      $received_at: ev.received_at,
      $payload: payload,
      $context: JSON.stringify(ev.context),
    });
  })(envelope);
  await upsertPlanningContextFromEvent(envelope);
  return envelope;
}

export async function listEventsByTrace(traceId: string): Promise<EventEnvelope[]> {
  const rows = getDb().query(`
    SELECT * FROM events WHERE trace_id = ? ORDER BY occurred_at ASC
  `).all(traceId) as any[];
  return rows.map(row => ({
    event_id: row.event_id,
    trace_id: row.trace_id,
    source: row.source,
    type: row.type,
    occurred_at: row.occurred_at,
    received_at: row.received_at,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
    context: JSON.parse(row.context),
  }));
}

export async function getLatestEvent(traceId: string): Promise<EventEnvelope | null> {
  const row = getDb().query(`
    SELECT * FROM events WHERE trace_id = ? ORDER BY occurred_at DESC LIMIT 1
  `).get(traceId) as any;
  if (!row) return null;
  return {
    event_id: row.event_id,
    trace_id: row.trace_id,
    source: row.source,
    type: row.type,
    occurred_at: row.occurred_at,
    received_at: row.received_at,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
    context: JSON.parse(row.context),
  };
}
