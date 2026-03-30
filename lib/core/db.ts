/**
 * Simple SQLite database for IntentCompiler
 * File-based storage with better-sqlite3
 */

import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

// Database path in project root
const dbPath = path.join(process.cwd(), "data", "intentcompiler.db");

// Ensure data directory exists
try {
  mkdirSync(path.dirname(dbPath), { recursive: true });
} catch {}

// Initialize database
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Auto-initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT,
    intent TEXT,
    context TEXT,
    steps TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS instruction_files (
    id TEXT PRIMARY KEY,
    workflow_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    quality INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_workflows_slug ON workflows(slug)`);

/**
 * Query helper
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  const result = params.length ? stmt.all(...params) : stmt.all();
  return result as T[];
}

/**
 * Execute helper
 */
export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid?: number } {
  const stmt = db.prepare(sql);
  const result = params.length ? stmt.run(...params) : stmt.run();
  return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
}

/**
 * Single row helper
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Generate a short, URL-friendly slug
 */
export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}
