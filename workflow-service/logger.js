import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'logs.db');

export class Logger {
  constructor() {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS outreach_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        seller TEXT NOT NULL,
        keyword TEXT,
        subject TEXT,
        message TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_run_id ON outreach_log(run_id);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON outreach_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_status ON outreach_log(status);
    `);
  }

  logResult(runId, result) {
    const stmt = this.db.prepare(`
      INSERT INTO outreach_log (
        run_id, seller, keyword, subject, message, 
        name, email, phone, timestamp, status, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      runId,
      result.seller,
      result.keyword,
      result.subject,
      result.message,
      result.name,
      result.email,
      result.phone,
      result.timestamp,
      result.status,
      result.reason
    );
  }

  getRecentLogs(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM outreach_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  getLogsByRunId(runId) {
    const stmt = this.db.prepare(`
      SELECT * FROM outreach_log 
      WHERE run_id = ? 
      ORDER BY created_at ASC
    `);
    return stmt.all(runId);
  }

  getStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
        DATE(created_at) as date
      FROM outreach_log
      WHERE DATE(created_at) = DATE('now')
      GROUP BY DATE(created_at)
    `);
    return stmt.get() || { total: 0, sent: 0, failed: 0, skipped: 0 };
  }

  close() {
    this.db.close();
  }
}

export const logger = new Logger();
