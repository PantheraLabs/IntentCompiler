import Database from "better-sqlite3";
import { join } from "path";
import { tmpdir } from "os";

// Create temporary database in system temp directory
const dbPath = join(tmpdir(), `intentcompiler-${Date.now()}.db`);
export const db = new Database(dbPath);

// Initialize tables
export function initializeDatabase() {
  // Workflows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      intent TEXT,
      context TEXT,
      steps TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Generated files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_files (
      id TEXT PRIMARY KEY,
      workflow_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      quality INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows (id)
    )
  `);

  // Repository analysis cache
  db.exec(`
    CREATE TABLE IF NOT EXISTS repo_cache (
      repo_url TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      language TEXT,
      tech_stack TEXT,
      readme TEXT,
      file_structure TEXT,
      has_ci BOOLEAN,
      has_docker BOOLEAN,
      existing_docs TEXT,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Generate a short, URL-friendly slug for shareable workflows
 */
export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Initialize database on import
initializeDatabase();

// Clean up on process exit
process.on("exit", () => {
  db.close();
  import("fs").then(({ unlinkSync }) => { try { unlinkSync(dbPath); } catch { /* ignore */ } });
});
