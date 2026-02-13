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

    CREATE TABLE IF NOT EXISTS execution_runs (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      plan_user_intent TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      summary TEXT,
      actions_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_records (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES execution_runs(id)
    );

    CREATE TABLE IF NOT EXISTS detail_source_links (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      external_id TEXT NOT NULL,
      uri TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_results (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      status TEXT NOT NULL,
      issues TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES execution_runs(id)
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
