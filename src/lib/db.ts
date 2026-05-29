import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'idea-developer.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Access logs
    db.exec(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_access_logs_visitor ON access_logs(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);
    `);

    // Idea threads: each is like a "repo"
    db.exec(`
      CREATE TABLE IF NOT EXISTS idea_threads (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT (datetime('now'))
      );
    `);

    // Submissions: each is a "commit" in an idea thread
    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL DEFAULT '',
        visitor_id TEXT NOT NULL,
        parent_id TEXT,
        version INTEGER DEFAULT 1,
        branch TEXT DEFAULT 'main',
        idea TEXT NOT NULL,
        questions_json TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        checklist_json TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'mock',
        category TEXT DEFAULT 'uncategorized',
        pinned INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        tool_type TEXT DEFAULT 'idea',
        ip TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_sub_visitor ON submissions(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_sub_idea ON submissions(idea_id, version);
      CREATE INDEX IF NOT EXISTS idx_sub_created ON submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_sub_tool_type ON submissions(tool_type);
    `);

    // Migration: add missing columns to existing submissions table
    const cols = db
      .prepare('PRAGMA table_info(submissions)')
      .all() as { name: string }[];
    const colNames = new Set(cols.map((c) => c.name));
    const addCols: [string, string][] = [
      ['idea_id', "ALTER TABLE submissions ADD COLUMN idea_id TEXT DEFAULT ''"],
      ['parent_id', 'ALTER TABLE submissions ADD COLUMN parent_id TEXT'],
      ['version', 'ALTER TABLE submissions ADD COLUMN version INTEGER DEFAULT 1'],
      ['branch', "ALTER TABLE submissions ADD COLUMN branch TEXT DEFAULT 'main'"],
      ['category', "ALTER TABLE submissions ADD COLUMN category TEXT DEFAULT 'uncategorized'"],
      ['pinned', 'ALTER TABLE submissions ADD COLUMN pinned INTEGER DEFAULT 0'],
      ['deleted', 'ALTER TABLE submissions ADD COLUMN deleted INTEGER DEFAULT 0'],
      ['tool_type', "ALTER TABLE submissions ADD COLUMN tool_type TEXT DEFAULT 'idea'"],
    ];
    for (const [name, sql] of addCols) {
      if (!colNames.has(name)) {
        try { db.exec(sql); } catch { /* ignore */ }
      }
    }

    // Backfill idea_id for old records
    const missing = db
      .prepare("SELECT COUNT(*) as c FROM submissions WHERE idea_id = '' OR idea_id IS NULL")
      .get() as { c: number };
    if (missing.c > 0) {
      db.prepare(
        "UPDATE submissions SET idea_id = 'idea-' || visitor_id || '-' || substr(id, 1, 13) WHERE idea_id = '' OR idea_id IS NULL",
      ).run();
    }

    // Create idea_threads from existing submissions
    const hasThreads = db
      .prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='idea_threads'")
      .get() as { c: number };
    if (hasThreads.c === 0) {
      db.exec(`
        CREATE TABLE idea_threads (
          id TEXT PRIMARY KEY,
          visitor_id TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT (datetime('now'))
        );
      `);
    }
    const missingThreads = db
      .prepare(
        `SELECT DISTINCT idea_id, visitor_id, idea FROM submissions
         WHERE idea_id NOT IN (SELECT id FROM idea_threads) AND idea_id != ''`,
      )
      .all() as { idea_id: string; visitor_id: string; idea: string }[];
    for (const t of missingThreads) {
      db.prepare(
        'INSERT OR IGNORE INTO idea_threads (id, visitor_id, title) VALUES (?, ?, ?)',
      ).run(t.idea_id, t.visitor_id, t.idea.slice(0, 80));
    }
  }
  return db;
}

export interface SubmissionRow {
  id: string;
  idea_id: string;
  visitor_id: string;
  parent_id: string | null;
  version: number;
  branch: string;
  idea: string;
  questions_json: string;
  answers_json: string;
  checklist_json: string;
  mode: string;
  category: string;
  pinned: number;
  deleted: number;
  tool_type: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}
