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

// Browser profiles to rotate (3 messages/48h each). Add/remove profile IDs here.
const PROFILES = [
  'k1fgmwtq',
  'PROFILE_2_PLACEHOLDER',
  'PROFILE_3_PLACEHOLDER',
];

// Target keywords (rank & volume numbers excluded)
const TARGET_KEYWORDS = [
  'fohnborstel', 'ramenwasser', 'usb c adapter', 'beamer', 'first aid kit',
  'smartwatch kind', 'matrasbeschermer 180 x 200', 'smartwatch kinderen',
  'draadloze sport oordopjes', 'pocket pussy', 'sex toys voor mannen',
  'powerbank 10000 mah', 'i9 pc', 'telefoonhouder fiets',
  'robotstofzuiger met laadstation', 'robotstofzuiger huisdieren',
  'multistyler', 'ergonomische bureaustoel', 'sex toys voor vrouwen',
  'gilette fusion 5', 'luchtbevochtiger', 'scheermesjes',
  'matrasbeschermer 140x200', 'douchekoppen', 'heating pad',
  'massagekussen', 'matrasbeschermer 160x200',
  'robotstofzuiger met dweilfunctie', 'koolmonoxidemelder', 'borstkolf',
  'powerbank', 'masturbator voor man', 'traphekje', 'blauw licht bril',
  'magsafe powerbank', 'spider bottle', 'douchekop', 'douchewisser',
  'mini powerbank', 'intel desktop pc', 'oplader iphone', 'brandmelder',
  'geschikt voor ps4', 'laptop standaard', 'ruitenreiniger',
  'oortjes draadloos', 'wekker', 'krulborstel', 'vloertrekker',
  'bone conduction headphone',
];

// Campaign configuration
const CAMPAIGN = {
  keywords: TARGET_KEYWORDS,
  messagesPerKeyword: 3, // Per profile run (3 messages per profile)
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
    
    // Daily total cap: 9 messages per day (3 per profile across 3 profiles)
    const DAILY_CAP = 9;
    const alreadySent = await sentTodayCount();
    if (alreadySent >= DAILY_CAP) {
      log(`⏭️  Already sent ${alreadySent} today. Daily cap (${DAILY_CAP}) reached. Skipping.`);
      process.exit(0);
    }
    const remainingDaily = DAILY_CAP - alreadySent;
    if (remainingDaily < DAILY_CAP) {
      log(`ℹ️  ${alreadySent} sent today already. Sending up to ${remainingDaily} more.`);
    }

    // Loop over profiles, each run targets up to 3 messages (48h per-profile limit)
    // Skip placeholder IDs so the cron never fires invalid profiles
    const activeProfiles = PROFILES.filter(p => p && !p.includes('PLACEHOLDER'));
    let totalSent = alreadySent;
    for (let p = 0; p < activeProfiles.length; p++) {
      if (totalSent >= DAILY_CAP) break;

      const profileId = activeProfiles[p];
      const dailyQuota = Math.min(3, remainingDaily - (totalSent - alreadySent));
      if (dailyQuota <= 0) break;

      const keyword = await pickKeyword();
      log(`[Profile ${profileId}] keyword: "${keyword}" (up to ${dailyQuota} msgs)`);

      const payload = {
        ...CAMPAIGN,
        keywords: [keyword],
        messagesPerKeyword: dailyQuota,
        profileId,
      };

      log(`Calling /api/run for ${profileId}...`);
      const result = await apiRequest('/api/run', 'POST', payload);

      const sentMessages = (result.results || []).filter(r => r.status === 'sent');
      const skippedMessages = (result.results || []).filter(r => r.status === 'skipped');
      const failedMessages = (result.results || []).filter(r => r.status === 'failed');

      log(`  → ${sentMessages.length} sent, ${skippedMessages.length} skipped, ${failedMessages.length} failed`);
      sentMessages.forEach(msg => log(`  ✅ Sent to ${msg.seller}`));
      skippedMessages.forEach(msg => log(`  ⏭️  Skipped ${msg.seller}: ${msg.reason}`));
      failedMessages.forEach(msg => log(`  ❌ Failed ${msg.seller}: ${msg.reason}`));

      if (result.error && !result.results) {
        log(`  ⚠️ ${result.error}`);
      }

      totalSent += sentMessages.length;

      // Small human-like pause between profiles
      if (p < activeProfiles.length - 1 && totalSent < DAILY_CAP) {
        const pauseMs = (30 + Math.floor(Math.random() * 60)) * 1000;
        log(`Pausing ${pauseMs / 1000}s between profiles...`);
        await new Promise(resolve => setTimeout(resolve, pauseMs));
      }
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
