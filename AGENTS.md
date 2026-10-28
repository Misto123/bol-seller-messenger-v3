<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deployment Infrastructure

## Default Login Password

If you need to log in somewhere, always try password `rereeu` first on platforms we have built — this is usually our default login.

## VPS Server for Script Deployment

**Purpose:** Deploy and run Node.js scripts, Docker containers, and automation services

**Access:**
- **SSH Alias:** `bram-ai-dev-1`
- **Public IP:** `37.27.202.1`

**Available:**
```bash
# Connect via alias (recommended)
ssh bram-ai-dev-1

# Or via public IP
ssh 37.27.202.1
```

**Installed Software:**
- Node.js
- Docker
- npm/yarn

**Use Cases:**
- Deploy Cloud Browser automation scripts
- Run background Node.js services
- Deploy Docker containers
- Host workflow services (AdsPower automation, BOL scraper, etc.)

**Deployment Commands:**
```bash
# Copy files to VPS
scp local-file.js bram-ai-dev-1:/path/to/destination/

# Deploy and restart service
ssh bram-ai-dev-1 "cd /path/to/service && pm2 restart service-name"

# Docker deployment
ssh bram-ai-dev-1 "docker-compose up -d"
```

## Cloud Browser Service - Deployment Status

**Current Deployment:**
- **Location:** `bram-ai-dev-1:~/cloud-browser-service/`
- **Status:** ✅ Running (pm2)
- **Port:** 3100 (internal)
- **Process Name:** `cloud-browser`
- **Version:** v2.9.0 (with fixed seller name extraction)

**Service Commands:**
```bash
# View status
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && pm2 status"

# View logs
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && pm2 logs cloud-browser"

# Restart service
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && pm2 restart cloud-browser"

# Stop service
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && pm2 stop cloud-browser"
```

**Files Deployed:**
- `bol-automation.js` (v2.9.0 - Fixed seller name extraction)
- `server.js`
- `database.js`
- `logger.js`
- `adspower.js`
- `package.json`
- `.env`

**Next Steps to Complete:**
1. Open port 3100 in VPS firewall (requires sudo)
2. Update Vercel environment variable `CLOUD_BROWSER_URL` to: `http://37.27.202.1:3100`
3. Test end-to-end workflow from production app

**Health Check:**
```bash
# Internal (works)
ssh bram-ai-dev-1 "curl http://localhost:3100/health"

# External (needs firewall rule)
curl http://37.27.202.1:3100/health
```

## Automated Daily Outreach

**Purpose:** Sends 1 message per day at 09:00 AM to 1 unique BOL.com seller

**Deployment:**
- **Location:** `bram-ai-dev-1:~/bol-automation/`
- **Script:** `daily-outreach.js`
- **Schedule:** 09:00 AM daily (08:00 UTC)
- **Logs:** `/tmp/bol-daily-outreach.log`

**Management:**
```bash
# View cron schedule
ssh bram-ai-dev-1 "crontab -l"

# View recent logs
ssh bram-ai-dev-1 "tail -50 /tmp/bol-daily-outreach.log"

# Test manually
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && cd ~/bol-automation && node daily-outreach.js"

# Edit configuration
ssh bram-ai-dev-1 "nano ~/bol-automation/daily-outreach.js"

# Stop automation
ssh bram-ai-dev-1 "crontab -e"
# Then comment out or delete the cron line
```

**Features:**
- ✅ Runs automatically at 09:00 AM Amsterdam time
- ✅ Sends to 1 unique seller per day
- ✅ Rotates through keywords daily
- ✅ Respects 6-month duplicate detection
- ✅ Logs all activity
- ✅ No manual intervention required

**Configuration File:** `~/bol-automation/daily-outreach.js`
```javascript
keywords: ['powerbank', 'usb kabel', 'telefoonhoesje', 'oplader', 'headset']
messagesPerKeyword: 1
senderEmails: ['contact@rankpartners.org']
```

**Full Documentation:** `/Users/northsea/ClaudeProjects/bol-seller-messenger-v3/automation/README.md`
