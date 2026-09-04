# BOL Seller Messenger - Complete Setup Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Vercel (Production)                                            │
│  https://bol-seller-messenger.vercel.app                        │
│                                                                 │
│  ┌──────────────┐                                              │
│  │  Next.js App │                                              │
│  │  /api/run    │                                              │
│  └──────┬───────┘                                              │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ HTTPS via Ngrok Tunnel
          │ (WORKFLOW_API_URL env var)
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mac Mini (Local)                                               │
│  http://localhost:3100                                          │
│                                                                 │
│  ┌──────────────────────┐                                      │
│  │  Workflow Service    │                                      │
│  │  Express + AdsPower  │                                      │
│  └──────────┬───────────┘                                      │
│             │                                                   │
│             ▼                                                   │
│  ┌──────────────────────┐         ┌─────────────────────┐     │
│  │  AdsPower MCP        │────────▶│  Browser Profiles   │     │
│  │  localhost:50326     │         │  (Anti-detect)      │     │
│  └──────────────────────┘         └──────────┬──────────┘     │
└─────────────────────────────────────────────┼──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │  BOL.nl      │
                                      │  Sellers     │
                                      └──────────────┘
```

## Services Running

### 1. Workflow Service (Port 3100)
**Status:** ✅ Running
**Location:** `/Users/northsea/ClaudeProjects/bol-seller-messenger/workflow-service`
**Profile:** `k1fgmwtq` (delia.roijen@gmail.com)

**Endpoints:**
- `GET /health` - Health check
- `GET /api/profiles` - List available AdsPower profiles
- `POST /api/run` - Execute outreach campaign

**Start/Stop:**
```bash
cd /Users/northsea/ClaudeProjects/bol-seller-messenger/workflow-service
npm start                    # Start service
pkill -f "node server.js"   # Stop service
```

### 2. Ngrok Tunnel
**Status:** ✅ Running
**Public URL:** `https://unstoic-enid-unofficially.ngrok-free.dev`
**Local:** `http://localhost:3100`

**Check Status:**
```bash
curl http://localhost:4040/api/tunnels
```

**Restart:**
```bash
pkill ngrok
ngrok http 3100 --log=stdout > /tmp/ngrok.log 2>&1 &
```

### 3. AdsPower MCP
**Status:** ✅ Connected
**Port:** `50326`
**Profile ID:** `k1fgmwtq`
**Proxy:** NL Mobile (77.63.77.185)

## Current Implementation Status

### ✅ Completed
- [x] Next.js frontend with password gate
- [x] Campaign setup form with Dutch defaults
- [x] Run log with result display
- [x] Express workflow service
- [x] AdsPower API client
- [x] Ngrok tunnel to expose service
- [x] Vercel deployment with environment variable
- [x] Profile detection and selection

### 🚧 In Progress
- [ ] Real BOL.nl browser automation
  - [ ] Connect to browser via WebSocket
  - [ ] Navigate to BOL.nl
  - [ ] Search for keywords
  - [ ] Filter third-party sellers
  - [ ] Extract contact forms
  - [ ] Fill and submit forms

### 📋 TODO
- [ ] Result persistence (database/file)
- [ ] Rate limiting (20 messages/day)
- [ ] Error handling and retry logic
- [ ] Multiple profile rotation
- [ ] Scheduling and queue management

## Testing

### Test Workflow Service Locally
```bash
curl -X POST http://localhost:3100/api/run \
  -H 'Content-Type: application/json' \
  -d '{
    "keywords": ["robotstofzuiger"],
    "count": 1,
    "messages": ["Hallo, bieden jullie kortingen aan bij bulkbestellingen?"],
    "names": ["Jan de Vries"],
    "emails": ["jan@vries.nl"],
    "subjects": ["Vraag"],
    "phone": "0624530190"
  }'
```

### Test Via Vercel
1. Visit `https://bol-seller-messenger.vercel.app`
2. Enter any password to unlock
3. Click "Start outreach"
4. Check results (should show "sent" status, not "skipped")

## Environment Variables

### Vercel (.env on Vercel)
```
WORKFLOW_API_URL=https://unstoic-enid-unofficially.ngrok-free.dev
```

### Workflow Service (.env)
```
PORT=3100
ADSPOWER_PORT=50326
ADSPOWER_API_KEY=746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329
ADSPOWER_PROFILE_ID=k1fgmwtq
```

## Troubleshooting

### Service not responding
```bash
# Check if service is running
curl http://localhost:3100/health

# Check logs
tail -f /tmp/bol-workflow.log

# Restart service
cd /Users/northsea/ClaudeProjects/bol-seller-messenger/workflow-service
pkill -f "node server.js"
npm start > /tmp/bol-workflow.log 2>&1 &
```

### Ngrok tunnel expired
```bash
# Check ngrok status
curl http://localhost:4040/api/tunnels

# Get new URL
grep "public_url" /tmp/ngrok.log

# Update Vercel env var
vercel env rm WORKFLOW_API_URL production
vercel env add WORKFLOW_API_URL production
# Enter new ngrok URL

# Redeploy
cd /Users/northsea/ClaudeProjects/bol-seller-messenger
vercel --prod --yes
```

### AdsPower not responding
```bash
# Check if AdsPower is running on port 50326
curl http://localhost:50326/api/v1/user/list?api_key=746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329

# List profiles
curl http://localhost:3100/api/profiles
```

## Next Steps

1. **Implement Browser Automation**
   - Add Puppeteer/Playwright connection via WebSocket
   - Build BOL.nl navigation and scraping logic
   - Implement contact form automation

2. **Add Persistence**
   - Store results in SQLite/PostgreSQL
   - Track daily message limits
   - Log all interactions

3. **Production Hardening**
   - Use Cloudflare Tunnel instead of ngrok (more stable)
   - Add API authentication
   - Implement request validation
   - Add monitoring and alerts

4. **Auto-start Services**
   - Create LaunchAgent for Mac Mini services
   - Auto-restart on failure
   - Health check monitoring
