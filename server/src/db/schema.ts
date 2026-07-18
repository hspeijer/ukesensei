import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/ukesensei.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      scale_key TEXT NOT NULL,
      root TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      tuning_key TEXT NOT NULL DEFAULT 'standard',
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      duration_sec REAL NOT NULL,
      pitch_accuracy REAL NOT NULL DEFAULT 0,
      timing_on_time_percent REAL NOT NULL DEFAULT 0,
      overall_score REAL NOT NULL DEFAULT 0,
      notes_json TEXT NOT NULL DEFAULT '[]',
      chords_json TEXT,
      analysis_status TEXT NOT NULL DEFAULT 'pending',
      has_audio INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
  `);

  const columns = db.prepare('PRAGMA table_info(sessions)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'chords_json')) {
    db.exec('ALTER TABLE sessions ADD COLUMN chords_json TEXT');
  }
}
