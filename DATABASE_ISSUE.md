# ⚠️ IMPORTANT: Database Limitation on Vercel

## Current Issue
The SQLite database approach **does not work on Vercel** because:
1. Vercel's filesystem is **read-only** (except `/tmp`)
2. `/tmp` is **ephemeral** - data is lost between function invocations
3. SQLite needs persistent file storage

## Impact
- ❌ Message history is **not saved** on Vercel deployment
- ❌ History page shows no data
- ✅ Everything else works (campaigns run, messages sent)
- ✅ Works perfectly in local development

## Solutions

### Option 1: Use Vercel Postgres (Recommended)
**Pros:**
- Persistent storage
- Scales automatically
- Built-in connection pooling
- Works on Hobby plan

**Cons:**
- Requires Vercel Postgres setup (~2 min)
- Additional $0.29/month after free tier

**Setup:**
```bash
# In Vercel dashboard:
1. Go to Storage tab
2. Create Postgres database
3. Add POSTGRES_URL to environment variables
```

### Option 2: Use External Database
Use any PostgreSQL/MySQL provider:
- Supabase (free tier)
- PlanetScale (free tier)
- Railway (free tier)
- Neon (free tier)

### Option 3: Use Vercel Blob for Screenshots + External DB
Store screenshots in Vercel Blob, use external DB for metadata.

### Option 4: Accept Limitation (Quick Fix)
Remove database features, keep localStorage-only settings, and show campaign results only during active session (no persistent history).

## Recommended Immediate Fix

I'll implement **Option 1** or **Option 2** with Supabase (completely free).

Which would you prefer?

1. **Vercel Postgres** (paid after free tier, easiest setup)
2. **Supabase** (completely free, 500MB storage)
3. **Remove history feature** (quick fix, no persistent data)

Let me know and I'll implement it immediately.
