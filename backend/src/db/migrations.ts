import { getDb } from './connection.js';

export function runMigrations(): void {
  const db = getDb();

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}
