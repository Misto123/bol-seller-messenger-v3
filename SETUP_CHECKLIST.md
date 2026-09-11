# 🚀 Supabase Setup - Quick Checklist

## ✅ What I've Done

1. ✅ Installed Supabase client library
2. ✅ Created database schema (`supabase-schema.sql`)
3. ✅ Built Supabase client (`lib/supabase-db.ts`)
4. ✅ Updated all code to use Supabase instead of SQLite
5. ✅ Removed "session-only" warning banner
6. ✅ Pushed to GitHub (commit `c3906cdf`)
7. ✅ Added credentials to `.env.local`

---

## 📋 What YOU Need to Do (3 Steps - 5 Minutes)

### Step 1: Run Database Schema (2 min)

1. Go to: https://yevbyifrvawltdcxfrvx.supabase.co
2. Login with: `smad1967@fastimap.com` / Password: `R!bq8pzNR{sp`
3. Click **SQL Editor** (left sidebar)
4. Click **New query**
5. Open `supabase-schema.sql` from your project
6. Copy ALL the SQL code
7. Paste into Supabase SQL Editor
8. Click **Run** (or press Cmd+Enter)
9. You should see: ✅ "Success. No rows returned"

### Step 2: Get Anon Key (1 min)

1. In Supabase, click **Settings** (left sidebar, bottom)
2. Click **API**
3. Copy the **anon public** key (starts with `eyJ...`)
4. Keep this tab open for Step 3

### Step 3: Add to Vercel (2 min)

1. Go to: https://vercel.com/bram-1592s-projects/bol-seller-messenger-v3/settings/environment-variables
2. Add **first variable**:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://yevbyifrvawltdcxfrvx.supabase.co`
   - Environment: Select **All** (Production, Preview, Development)
   - Click **Save**

3. Add **second variable**:
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: [Paste the anon key you copied in Step 2]
   - Environment: Select **All**
   - Click **Save**

4. **Redeploy**:
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**
   - Wait ~45 seconds

---

## ✅ Done! Test It

After redeployment completes:

1. Visit: https://bol-seller-messenger-v3.vercel.app/history
2. Password: `rereeu`
3. You should see stats cards (all zeros if no campaigns yet)
4. No warning banner should appear
5. Run a test campaign - history will now persist permanently!

---

## 🎯 What You'll Get

**Before (SQLite):**
- ❌ History lost on Vercel
- ❌ Session-only data
- ❌ Warning banner

**After (Supabase):**
- ✅ Permanent storage
- ✅ History persists forever
- ✅ No warning banner
- ✅ Free tier: 500MB database
- ✅ Scalable to millions of messages

---

## 📞 Need Help?

If you get stuck on any step, let me know which step and I'll walk you through it!

The most common issue is forgetting to redeploy after adding env vars.

---

**Estimated Total Time:** 5 minutes  
**Difficulty:** Easy 🟢
