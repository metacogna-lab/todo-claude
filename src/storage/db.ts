import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Database } from "bun:sqlite";

let db: Database | null = null;

function init(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      received_at TEXT NOT NULL,
      payload TEXT,
      context TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS planning_contexts (
      trace_id TEXT PRIMARY KEY,
      workflow TEXT NOT NULL,
      source TEXT NOT NULL,
      event_type TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function getDb(): Database {
  if (db) return db;
  const dbPath = process.env.APP_DB_PATH ?? resolve(process.cwd(), "data/app.db");
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }
  db = new Database(dbPath);
  init(db);
  return db;
}

export function resetDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
