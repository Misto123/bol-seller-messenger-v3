# Recurring Campaigns - Implementation Guide

## Overview

The BOL Seller Messenger v2.7.0 has recurring campaign **settings UI ready**, but needs a scheduler to actually run campaigns automatically. Here are your options:

---

## ✅ Option 1: Vercel Cron (RECOMMENDED)

**Why this is best:**
- Cloud-based (runs even when Mac is off)
- Built into Vercel (already deployed there)
- Free on Hobby plan (1 cron per day), Pro has unlimited
- Reliable and scalable
- Automatic logs

### Implementation Steps

#### 1. Create Cron API Route

Create `/app/api/cron/recurring-campaigns/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all recurring campaign settings from Supabase
    // 2. Check which campaigns should run today
    // 3. For each campaign:
    //    - Check if end date has passed
    //    - Check if interval days have passed since last run
    //    - If yes, trigger campaign via /api/run
    // 4. Update last_run_date in database
    
    return NextResponse.json({ 
      success: true,
      message: 'Recurring campaigns processed'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
```

#### 2. Add vercel.json to project root

```json
{
  "crons": [
    {
      "path": "/api/cron/recurring-campaigns",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Schedule format: `minute hour day month weekday`
- `0 9 * * *` = Every day at 9:00 AM UTC
- `0 */6 * * *` = Every 6 hours
- `0 0 * * 0` = Every Sunday at midnight

#### 3. Add CRON_SECRET to Vercel

```bash
vercel env add CRON_SECRET production
# Enter a random secret: e.g., "my-super-secret-cron-key-12345"
```

#### 4. Deploy

```bash
git add vercel.json app/api/cron/recurring-campaigns/route.ts
git commit -m "Add Vercel Cron for recurring campaigns"
vercel --prod
```

#### 5. Test

```bash
# Manually trigger the cron
curl -X GET "https://bol-seller-messenger.vercel.app/api/cron/recurring-campaigns" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Pros:**
- ✅ Runs in the cloud
- ✅ Reliable
- ✅ Free (Hobby plan: 1/day, Pro: unlimited)
- ✅ Easy to set up

**Cons:**
- ⚠️ Hobby plan limited to 1 cron job per day
- ⚠️ Need Pro plan ($20/mo) for multiple daily runs

---

## Option 2: Local Mac Cron

**Good for:** Testing, personal use, when Mac is always on

### Implementation Steps

#### 1. Create a runner script

```bash
# Create script
cat > ~/bol-recurring-campaigns.sh << 'EOF'
#!/bin/bash
cd /Users/northsea/ClaudeProjects/bol-seller-messenger-v3
node scripts/run-recurring-campaigns.js >> ~/bol-cron.log 2>&1
EOF

chmod +x ~/bol-recurring-campaigns.sh
```

#### 2. Create Node.js runner

`/Users/northsea/ClaudeProjects/bol-seller-messenger-v3/scripts/run-recurring-campaigns.js`:

```javascript
const https = require('https');

const url = 'https://bol-seller-messenger.vercel.app/api/cron/recurring-campaigns';
const secret = process.env.CRON_SECRET;

https.get(url, {
  headers: {
    'Authorization': `Bearer ${secret}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(new Date().toISOString(), 'Response:', data);
  });
}).on('error', (err) => {
  console.error(new Date().toISOString(), 'Error:', err.message);
});
```

#### 3. Add to crontab

```bash
# Edit crontab
crontab -e

# Add this line (runs every day at 9 AM)
0 9 * * * /Users/northsea/bol-recurring-campaigns.sh
```

**Pros:**
- ✅ Free
- ✅ Full control
- ✅ Easy to test locally

**Cons:**
- ❌ Only runs when Mac is on
- ❌ Won't run if Mac is sleeping
- ❌ Not suitable for production

---

## Option 3: External Cron Services

### EasyCron (https://www.easycron.com)
- Free tier: 100 jobs
- Webhook-based
- Simple UI

### Cron-job.org (https://cron-job.org)
- Free unlimited
- Reliable
- Simple setup

**Setup:**
1. Create account
2. Add job: `https://bol-seller-messenger.vercel.app/api/cron/recurring-campaigns`
3. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
4. Set schedule: `0 9 * * *`
5. Done

**Pros:**
- ✅ Free
- ✅ Cloud-based
- ✅ Reliable
- ✅ Simple

**Cons:**
- ⚠️ Another service to manage
- ⚠️ Need to trust third-party

---

## Option 4: Supabase Edge Functions + pg_cron

**Setup:**
1. Use Supabase's built-in pg_cron
2. Schedule SQL function to call webhook
3. Trigger Vercel API

**Pros:**
- ✅ Built into Supabase (already using it)
- ✅ Reliable
- ✅ Free

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires SQL knowledge

---

## 📊 Recommendation Matrix

| Use Case | Recommended Option | Why |
|----------|-------------------|-----|
| Production (Mac on 24/7) | Local Cron | Free, reliable, fast |
| Production (Mac not always on) | Vercel Cron | Cloud-based, built-in |
| Quick testing | Local Cron | Easy to debug |
| Budget-conscious | Cron-job.org | Free unlimited |
| Enterprise | Vercel Cron (Pro) | Most reliable |

---

## 🎯 My Recommendation

**Use Vercel Cron** because:
1. Already using Vercel
2. Cloud-based (works 24/7)
3. Free for daily runs
4. Easy to implement
5. Built-in logs

**Implementation time:** ~30 minutes

Want me to implement it now?

---

## Current State

**v2.7.0 Status:**
- ✅ Recurring campaign UI complete
- ✅ Settings saved to localStorage
- ✅ Dashboard indicator ready
- ⏳ Automatic execution pending

**What's needed:**
1. Create `/api/cron/recurring-campaigns` route
2. Add `vercel.json` with cron config
3. Set CRON_SECRET env var
4. Deploy

Then recurring campaigns will run automatically! 🎯
