#!/usr/bin/env node

/**
 * Automated Daily BOL Seller Outreach
 * Sends up to 3 messages per day to unique sellers
 */

const https = require('https');

// Configuration
const API_URL = 'https://bol-seller-messenger.vercel.app';
const LOG_FILE = '/tmp/bol-daily-outreach.log';
const REQUEST_TIMEOUT = 310000; // 5m10s - must exceed serverless 5-min limit so we get the response

// Campaign configuration
const CAMPAIGN = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje', 'oplader', 'headset'],
  messagesPerKeyword: 3, // Send up to 3 messages per run
  messageTemplates: [
    {
      enabled: true,
      content: `Hallo {{sellerName}},

Ik ben op zoek naar {{productTitle}} en kwam jullie product tegen op BOL.com.

Kunnen jullie mij meer informatie geven over:
- Levertijd
- Garantievoorwaarden
- Eventuele kortingsmogelijkheden bij grotere aantallen

Met vriendelijke groet,
{{senderName}}
{{senderEmail}}
{{senderPhone}}`
    }
  ],
  senderNames: ['Mark van der Berg', 'Lisa Janssen', 'Tom de Vries', 'Emma Bakker'],
  senderEmails: ['contact@rankpartners.org'],
  senderPhones: ['0612345678', '0687654321'],
  subject: 'Vraag over uw product op BOL.com',
  sponsoredOnly: false,
  messageSpreadMinutes: 0
};

// Logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  // Append to log file
  const fs = require('fs');
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Make API request
function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT
    };
    
    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after ' + (REQUEST_TIMEOUT / 1000) + ' seconds'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Check if the daily cap was already reached (3/day)
async function sentTodayCount() {
  try {
    const result = await apiRequest('/api/history?limit=300', 'GET');
    const logs = result.logs || result.campaigns || [];
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter(l => (l.timestamp || '').slice(0, 10) === today && l.status === 'sent').length;
  } catch (e) {
    log(`⚠️ Could not check today's history: ${e.message}`);
    return 0;
  }
}

// Pick random keyword that hasn't been used recently
async function pickKeyword() {
  // For simplicity, rotate through keywords
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const index = dayOfYear % CAMPAIGN.keywords.length;
  return CAMPAIGN.keywords[index];
}

// Run daily outreach
async function runDailyOutreach() {
  try {
    log('=== Starting Daily Outreach ===');
    
    // Random human-like delay: 2-25 minutes so send time varies every day
    // (never same minute; cron fires at round hour, this adds jitter)
    const delayMs = (2 + Math.floor(Math.random() * 23)) * 60000;
    const scheduledFor = new Date(Date.now() + delayMs).toISOString();
    log(`Random delay: ${delayMs / 60000} min (sending ~${scheduledFor})`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Guard: daily cap of 3 messages (prevents duplicates from cron overlap)
    const alreadySent = await sentTodayCount();
    if (alreadySent >= 3) {
      log(`⏭️  Already sent ${alreadySent} today. Daily cap (3) reached. Skipping.`);
      process.exit(0);
    } else if (alreadySent > 0) {
      log(`ℹ️  ${alreadySent} sent today already. Will send ${3 - alreadySent} more.`);
    }
    
    // Pick keyword for today
    const keyword = await pickKeyword();
    log(`Selected keyword: ${keyword}`);
    
    // Prepare campaign payload
    const payload = {
      ...CAMPAIGN,
      keywords: [keyword] // Only one keyword
    };
    
    log('Sending API request to /api/run...');
    log(`Timeout set to ${REQUEST_TIMEOUT / 1000} seconds (single attempt, no retries)`);
    
    // Single attempt - retrying starts a SECOND campaign and duplicates sends
    const result = await apiRequest('/api/run', 'POST', payload);
    
    if (result.results && result.results.length > 0) {
      const sentMessages = result.results.filter(r => r.status === 'sent');
      const skippedMessages = result.results.filter(r => r.status === 'skipped');
      const failedMessages = result.results.filter(r => r.status === 'failed');
      
      log(`Results: ${sentMessages.length} sent, ${skippedMessages.length} skipped, ${failedMessages.length} failed`);
      
      if (sentMessages.length > 0) {
        sentMessages.forEach(msg => {
          log(`✅ Sent to ${msg.seller}: ${msg.subject}`);
        });
      }
      
      if (skippedMessages.length > 0) {
        skippedMessages.forEach(msg => {
          log(`⏭️  Skipped ${msg.seller}: ${msg.reason}`);
        });
      }
      
      if (failedMessages.length > 0) {
        failedMessages.forEach(msg => {
          log(`❌ Failed ${msg.seller}: ${msg.reason}`);
        });
      }
    } else {
      log('⚠️  No results returned from API');
    }
    
    log('=== Daily Outreach Complete ===');
    process.exit(0);
    
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    log(error.stack);
    process.exit(1);
  }
}

// Execute
runDailyOutreach();
