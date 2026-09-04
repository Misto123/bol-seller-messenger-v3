import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ResultsDatabase {
  constructor() {
    this.db = new Database(join(__dirname, 'results.db'));
    this.initializeSchema();
  }

  initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        total_count INTEGER NOT NULL,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        skipped_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
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
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      );

      CREATE INDEX IF NOT EXISTS idx_campaigns_started ON campaigns(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_results_campaign ON results(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_results_timestamp ON results(timestamp DESC);
    `);
  }

  createCampaign(totalCount) {
    const stmt = this.db.prepare(
      'INSERT INTO campaigns (started_at, total_count) VALUES (?, ?)'
    );
    const result = stmt.run(new Date().toISOString(), totalCount);
    return result.lastInsertRowid;
  }

  addResult(campaignId, result) {
    const stmt = this.db.prepare(`
      INSERT INTO results (
        campaign_id, seller, keyword, subject, message, 
        name, email, phone, timestamp, status, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      campaignId,
      result.seller,
      result.keyword || null,
      result.subject || null,
      result.message || null,
      result.name || null,
      result.email || null,
      result.phone || null,
      result.timestamp,
      result.status,
      result.reason || null
    );
  }

  completeCampaign(campaignId) {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_count
      FROM results WHERE campaign_id = ?
    `).get(campaignId);

    this.db.prepare(`
      UPDATE campaigns 
      SET completed_at = ?, sent_count = ?, failed_count = ?, skipped_count = ?
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      stats.sent_count,
      stats.failed_count,
      stats.skipped_count,
      campaignId
    );
  }

  getAllResults(limit = 100, offset = 0) {
    return this.db.prepare(`
      SELECT 
        r.*,
        c.started_at as campaign_started
      FROM results r
      JOIN campaigns c ON r.campaign_id = c.id
      ORDER BY r.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  getCampaignHistory(limit = 20) {
    return this.db.prepare(`
      SELECT * FROM campaigns
      ORDER BY started_at DESC
      LIMIT ?
    `).all(limit);
  }

  getCampaignResults(campaignId) {
    return this.db.prepare(`
      SELECT * FROM results
      WHERE campaign_id = ?
      ORDER BY timestamp ASC
    `).all(campaignId);
  }

  markCampaignCompleted(campaignId) {
    const stmt = this.db.prepare('UPDATE campaigns SET completed_at = ?, status = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), 'completed', campaignId);
  }

  markCampaignFailed(campaignId, reason) {
    const stmt = this.db.prepare('UPDATE campaigns SET completed_at = ?, status = ?, error = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), 'failed', reason, campaignId);
  }

  getStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM results').get();
    const byStatus = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM results 
      GROUP BY status
    `).all();
    const campaigns = this.db.prepare('SELECT COUNT(*) as count FROM campaigns').get();

    return {
      totalMessages: total.count,
      totalCampaigns: campaigns.count,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
    };
  }
}

export const resultsDb = new ResultsDatabase();
