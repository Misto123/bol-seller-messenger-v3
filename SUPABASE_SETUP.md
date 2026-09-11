# Supabase Setup Guide

## ✅ Supabase Database Configured

**Project:** BOL messenger v3  
**URL:** https://yevbyifrvawltdcxfrvx.supabase.co  
**Organization:** SMAD

---

## Step 1: Run Database Schema

### Option A: Using Supabase Dashboard (Recommended)
1. Go to https://yevbyifrvawltdcxfrvx.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify: You should see "Success. No rows returned"

### Option B: Using Supabase CLI
```bash
# Install CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref yevbyifrvawltdcxfrvx

# Run migrations
supabase db push
```

---

## Step 2: Get API Keys

The API keys are already in the credentials, but you can verify them:

1. Go to https://yevbyifrvawltdcxfrvx.supabase.co/project/yevbyifrvawltdcxfrvx/settings/api
2. Copy the **Project URL** (should match: `https://yevbyifrvawltdcxfrvx.supabase.co`)
3. Copy the **anon/public** key

**Current Keys (from your credentials):**
- URL: `https://yevbyifrvawltdcxfrvx.supabase.co`
- Anon Key: Check in Settings → API

---

## Step 3: Add Environment Variables to Vercel

1. Go to https://vercel.com/bram-1592s-projects/bol-seller-messenger-v3/settings/environment-variables
2. Add these two variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://yevbyifrvawltdcxfrvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase>
```

3. Make sure to select **All Environments** (Production, Preview, Development)
4. Click **Save**

---

## Step 4: Redeploy

After adding environment variables:

1. Go to Vercel dashboard → Deployments
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to GitHub (auto-deploys)

---

## Verification

After deployment, test the API:

```bash
curl https://bol-seller-messenger-v3.vercel.app/api/history
```

Should return:
```json
{
  "success": true,
  "logs": [],
  "stats": {
    "total": 0,
    "sent": 0,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## What Changed

### Before (SQLite + In-Memory)
- ❌ No persistent storage on Vercel
- ❌ History lost on function restart
- ✅ Worked locally only

### After (Supabase)
- ✅ Fully persistent storage
- ✅ Works on Vercel and locally
- ✅ Real-time syncing
- ✅ Scalable to millions of records
- ✅ Free tier: 500MB database, 2GB bandwidth

---

## Database Schema

Table: **message_logs**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Auto-increment primary key |
| shop_name | TEXT | Name of contacted shop |
| product_title | TEXT | Product from BOL search |
| keyword | TEXT | Search keyword used |
| message | TEXT | Full message sent |
| subject | TEXT | Email subject |
| sender_name | TEXT | Your name |
| sender_email | TEXT | Your email |
| sender_phone | TEXT | Your phone (optional) |
| screenshot_path | TEXT | Path to screenshot |
| adspower_profile | TEXT | AdsPower profile ID |
| ip_address | TEXT | IP used for session |
| status | TEXT | sent/failed/skipped |
| error_message | TEXT | Error if failed |
| timestamp | TIMESTAMPTZ | When sent |
| created_at | TIMESTAMPTZ | When logged |

**Indexes:**
- `idx_message_logs_timestamp` - Fast date sorting
- `idx_message_logs_status` - Filter by status
- `idx_message_logs_keyword` - Search by keyword

---

## Troubleshooting

### "Supabase not configured" error
- Check that environment variables are set in Vercel
- Verify `.env.local` has correct values for local dev
- Redeploy after adding env vars

### "relation 'message_logs' does not exist"
- Run the SQL schema from Step 1
- Check you're connected to the correct project

### API returns empty data
- Normal if no campaigns have been run yet
- Run a campaign to populate data

---

## Cost

**Supabase Free Tier (Current Plan):**
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

This is **more than enough** for typical usage (thousands of messages per month).

If you exceed limits, upgrade starts at $25/month.

---

## Security

**Row Level Security (RLS) is enabled** with a permissive policy for development.

For production security, you may want to restrict access. Contact me if you need help setting up:
- User authentication
- Role-based access
- API key restrictions

---

## Next Steps

1. ✅ Run `supabase-schema.sql` in Supabase dashboard
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy
4. ✅ Test by running a campaign
5. ✅ Check history page for persistent data

**All set!** Your message history will now persist permanently. 🎉
