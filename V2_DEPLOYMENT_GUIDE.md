# BOL Seller Messenger V2 - Deployment Guide

## 🎯 Why V2?

The original repo had collaboration access issues on Vercel Hobby plan. This V2 repo has the correct Git author (bram.1592@gmail.com) and will deploy successfully.

---

## ✅ What's Included

All the same working code:
- ✅ BOL.nl product search & seller extraction
- ✅ Sponsored product filtering
- ✅ Message templates with 6 placeholders
- ✅ Settings management with localStorage
- ✅ Campaign history
- ✅ AdsPower browser automation
- ✅ SQLite database persistence
- ✅ Debug endpoint for troubleshooting

---

## 🚀 Deploy to Vercel

### Step 1: Import to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Find: **bol-seller-messenger-v2**
4. Click **"Import"**

### Step 2: Add Environment Variable

**BEFORE clicking "Deploy"**, add this environment variable:

- **Name:** `WORKFLOW_API_URL`
- **Value:** `https://unstoic-enid-unofficially.ngrok-free.dev`
- **Environments:** Check ALL (Production, Preview, Development)

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment
3. Note the Vercel URL (e.g., `bol-seller-messenger-v2.vercel.app`)

---

## 🧪 Test the Deployment

1. Open your new Vercel URL
2. Unlock with any password
3. Go to **Settings (⚙️)**
4. Add keyword: `powerbank`
5. Add message: `Beste {{sellerName}}, test`
6. Add sender info: Name `Test Team`, Email `test@test.nl`
7. Save
8. Go to main page
9. Select `powerbank`
10. Click **"🚀 Start Outreach"**
11. Wait 1-2 minutes

---

## ✅ Expected Results

You should see:

```
Seller 1
Telefoonplaats.nl · powerbank · 14:00:00
sent

Message: Beste Telefoonplaats.nl, test
```

**NOT:**
```
Local preview: seller workflow is not connected.
```

---

## 🔧 System Requirements

### Backend (Mac Mini)
- Node.js 18+
- AdsPower profile: `k1fgmwtq`
- Backend running: `cd workflow-service && node server.js`
- Listening on: `localhost:3100`

### Ngrok Tunnel
- Auth token configured
- Command: `ngrok http 3100`
- Public URL: `https://unstoic-enid-unofficially.ngrok-free.dev`

---

## 📊 Architecture

```
User Browser
    ↓
Vercel Frontend (bol-seller-messenger-v2.vercel.app)
    ↓
Ngrok Tunnel (https://unstoic-enid-unofficially.ngrok-free.dev)
    ↓
Backend (localhost:3100 on Mac Mini)
    ↓
AdsPower Browser
    ↓
BOL.nl
```

---

## 🐛 Troubleshooting

### Issue: "Local preview: seller workflow is not connected"

**Cause:** Vercel can't reach backend

**Fix:**
1. Check backend is running: `curl http://localhost:3100/health`
2. Check ngrok is running: `curl https://unstoic-enid-unofficially.ngrok-free.dev/health`
3. Verify env var in Vercel: Settings → Environment Variables
4. Redeploy if needed

### Issue: Ngrok returns HTML error page

**Cause:** Backend crashed or ngrok connection dropped

**Fix:**
```bash
# Restart backend
cd /Users/northsea/ClaudeProjects/bol-seller-messenger-v2/workflow-service
pkill -f "node server.js"
node server.js > /tmp/bol-workflow.log 2>&1 &

# Check health
curl http://localhost:3100/health
```

### Debug Endpoint

Visit: `https://your-vercel-url.vercel.app/api/debug-env`

Shows:
- Whether `WORKFLOW_API_URL` is set
- Its length and preview
- All environment variable keys

---

## 📁 Project Structure

```
bol-seller-messenger-v2/
├── app/                      # Next.js frontend
│   ├── page.tsx             # Main campaign UI
│   ├── settings/page.tsx    # Settings management
│   ├── history/page.tsx     # Campaign history
│   └── api/
│       ├── run/route.ts     # Campaign API (proxies to backend)
│       └── debug-env/       # Debug endpoint
├── workflow-service/         # Node.js backend
│   ├── server.js            # Express API server
│   ├── bol-automation.js    # BOL.nl automation logic
│   ├── database.js          # SQLite persistence
│   └── results.db           # Campaign data
└── public/                   # Static assets
```

---

## ✅ Differences from V1

- **Git author:** `bram.1592@gmail.com` (was: `northsea`)
- **Repo name:** `bol-seller-messenger-v2` (was: `bol-seller-messenger`)
- **Everything else:** Identical (same working code)

---

## 🎉 Success Criteria

System is working when:
1. ✅ Vercel deployment shows "Ready"
2. ✅ `/api/debug-env` shows `hasWorkflowApiUrl: true`
3. ✅ Campaign returns real seller names
4. ✅ No "Local preview" error

---

**Ready to deploy!** 🚀
