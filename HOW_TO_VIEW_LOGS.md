# How to View Message Logs in Supabase

## Option 1: Using Table Editor (Easiest)

1. Go to: https://supabase.com/dashboard/project/yevbyifrvawltdcxfrvx
2. Login with: `smad1967@fastimap.com` / Password: `R!bq8pzNR{sp`
3. Click **"Table Editor"** in the left sidebar
4. Click on **"message_logs"** table
5. You'll see all messages in a spreadsheet-like view

**Columns you'll see:**
- `shop_name` - Name of seller contacted
- `product_title` - Product they're selling
- `keyword` - Search keyword used
- `status` - sent/failed/skipped
- `timestamp` - When message was sent
- `ip_address` - IP used
- `adspower_profile` - Browser profile ID
- `screenshot_path` - Screenshot location

---

## Option 2: Using SQL Editor

1. Go to: https://supabase.com/dashboard/project/yevbyifrvawltdcxfrvx/sql/new
   
   ⚠️ **IMPORTANT:** Use `yevbyifrvawltdcxfrvx` (your project ID), NOT `uyrkcolmisxsmnzfsghr`

2. Paste this SQL:
```sql
-- Get all messages (newest first)
SELECT * FROM message_logs 
ORDER BY timestamp DESC 
LIMIT 50;
```

3. Click **"Run"**

---

## Option 3: Using the Web App

1. Go to: https://bol-seller-messenger-v3.vercel.app/history
2. Password: `rereeu`
3. View all messages with stats dashboard

---

## Option 4: Using API (for developers)

```bash
# Get all messages
curl https://bol-seller-messenger-v3.vercel.app/api/history?limit=100

# Get messages for specific keyword
curl https://bol-seller-messenger-v3.vercel.app/api/history?keyword=laptop
```

---

## Current Status

**Database Status:** ✅ Connected and working  
**Messages in database:** 0 (no campaigns run yet)

**To populate with data:**
1. Go to Settings
2. Add keywords (e.g., "laptop", "powerbank")
3. Enable templates
4. Go to Home
5. Click "🚀 Start Outreach"
6. After campaign completes, messages will appear in history

---

## SQL Queries You Can Run

### Get all sent messages
```sql
SELECT shop_name, product_title, timestamp 
FROM message_logs 
WHERE status = 'sent'
ORDER BY timestamp DESC;
```

### Count by keyword
```sql
SELECT keyword, COUNT(*) as count, 
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent
FROM message_logs 
GROUP BY keyword;
```

### Get failed messages with errors
```sql
SELECT shop_name, error_message, timestamp 
FROM message_logs 
WHERE status = 'failed'
ORDER BY timestamp DESC;
```

### Get today's messages
```sql
SELECT * FROM message_logs 
WHERE timestamp::date = CURRENT_DATE
ORDER BY timestamp DESC;
```

---

## Troubleshooting

**❌ Error: "relation 'message_logs' does not exist"**
- You're on the wrong Supabase project
- Use project ID: `yevbyifrvawltdcxfrvx`
- Correct URL: https://supabase.com/dashboard/project/yevbyifrvawltdcxfrvx

**❌ Error: "Invalid credentials"**
- Email: `smad1967@fastimap.com`
- Password: `R!bq8pzNR{sp}`

**ℹ️ No data showing**
- Database is empty until you run a campaign
- Run a test campaign to populate data

---

## Quick Test

To verify everything works:

1. Go to: https://bol-seller-messenger-v3.vercel.app
2. Login with password: `rereeu`
3. Go to Settings
4. Add keyword: "test"
5. Enable first template
6. Save settings
7. Go to Home
8. Select "test" keyword
9. Click "Start Outreach"
10. Wait for campaign to complete
11. Go to History page → see messages
12. Or check Supabase Table Editor → see data there too

Both should show the same data (synced in real-time).

---

**Project Info:**
- Project URL: https://yevbyifrvawltdcxfrvx.supabase.co
- Project ID: `yevbyifrvawltdcxfrvx`
- Table: `message_logs`
- Dashboard: https://supabase.com/dashboard/project/yevbyifrvawltdcxfrvx
