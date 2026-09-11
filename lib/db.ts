import path from 'path';
import fs from 'fs';

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

// Only import better-sqlite3 in local development
let Database: any = null;
if (!isVercel) {
  Database = require('better-sqlite3');
}

// On Vercel, use in-memory storage (session-only)
// In development, use SQLite
const dbPath = path.join(process.cwd(), 'data', 'history.db');

export interface MessageLog {
  id?: number;
  shop_name: string;
  product_title: string;
  keyword: string;
  message: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  screenshot_path: string | null;
  adspower_profile: string;
  ip_address: string | null;
  status: 'sent' | 'failed' | 'skipped';
  error_message: string | null;
  timestamp: string;
}

let db: any = null;
let memoryStore: MessageLog[] = []; // In-memory fallback for Vercel

export function getDb() {
  if (isVercel) {
    // On Vercel, return null to trigger in-memory mode
    console.log('[DB] Running on Vercel - using in-memory storage (session only)');
    return null;
  }
  
  if (!db && Database) {
    // Local development - use SQLite
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`[DB] Using SQLite database at: ${dbPath}`);
    db = new Database(dbPath);
    
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        product_title TEXT NOT NULL,
        keyword TEXT NOT NULL,
        message TEXT NOT NULL,
        subject TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        sender_phone TEXT,
        screenshot_path TEXT,
        adspower_profile TEXT NOT NULL,
        ip_address TEXT,
        status TEXT NOT NULL,
        error_message TEXT,
        timestamp TEXT NOT NULL
      )
    `);

    // Create index on timestamp for faster queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON message_logs(timestamp DESC)
    `);
  }
  return db;
}

export function insertMessageLog(log: MessageLog): number {
  if (isVercel) {
    // In-memory storage on Vercel
    const id = memoryStore.length + 1;
    memoryStore.push({ ...log, id });
    console.log(`[DB] Stored in memory (ID: ${id})`);
    return id;
  }
  
  const db = getDb();
  if (!db) return 0;
  
  const stmt = db.prepare(`
    INSERT INTO message_logs (
      shop_name, product_title, keyword, message, subject,
      sender_name, sender_email, sender_phone,
      screenshot_path, adspower_profile, ip_address,
      status, error_message, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    log.shop_name,
    log.product_title,
    log.keyword,
    log.message,
    log.subject,
    log.sender_name,
    log.sender_email,
    log.sender_phone || null,
    log.screenshot_path || null,
    log.adspower_profile,
    log.ip_address || null,
    log.status,
    log.error_message || null,
    log.timestamp
  );
  
  return result.lastInsertRowid as number;
}

export function getMessageLogs(limit: number = 100, offset: number = 0): MessageLog[] {
  if (isVercel) {
    // Return in-memory data on Vercel (newest first)
    return memoryStore
      .slice()
      .reverse()
      .slice(offset, offset + limit);
  }
  
  const db = getDb();
  if (!db) return [];
  
  const stmt = db.prepare(`
    SELECT * FROM message_logs
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(limit, offset) as MessageLog[];
}

export function getMessageLogStats() {
  if (isVercel) {
    // Calculate stats from in-memory data
    return {
      total: memoryStore.length,
      sent: memoryStore.filter(l => l.status === 'sent').length,
      failed: memoryStore.filter(l => l.status === 'failed').length,
      skipped: memoryStore.filter(l => l.status === 'skipped').length,
    };
  }
  
  const db = getDb();
  if (!db) return { total: 0, sent: 0, failed: 0, skipped: 0 };
  
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
    FROM message_logs
  `);
  
  return stmt.get() as { total: number; sent: number; failed: number; skipped: number };
}
