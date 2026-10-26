# 🚀 Deploy Updated bol-automation.js to Cloud Browser Server

## Critical Issue
All sellers currently show name: "Bekijk extra partnervoorwaarden" causing false duplicate detection.
This deployment fixes the seller name extraction.

## Server Details
- **IP:** 65.21.199.228
- **Port:** 3000
- **Service:** Cloud Browser (Remote Browser)
- **Status:** Running, requires authentication

## Files to Deploy
1. **Source:** `/Users/northsea/ClaudeProjects/bol-seller-messenger-v3/workflow-service/bol-automation.js`
2. **Target:** `/path/to/cloud-browser/workflow-service/bol-automation.js` (exact path TBD)

## Deployment Steps

### Option 1: SSH Deployment (Recommended)
```bash
# 1. SSH into server (requires credentials)
ssh user@65.21.199.228

# 2. Navigate to Cloud Browser directory
cd /path/to/cloud-browser/workflow-service/

# 3. Backup current file
cp bol-automation.js bol-automation.js.backup-$(date +%Y%m%d)

# 4. Upload new file from local machine (in separate terminal)
scp /Users/northsea/ClaudeProjects/bol-seller-messenger-v3/workflow-service/bol-automation.js \
    user@65.21.199.228:/path/to/cloud-browser/workflow-service/

# 5. Restart Cloud Browser service
pm2 restart cloud-browser
# OR
systemctl restart cloud-browser
# OR
docker restart cloud-browser

# 6. Verify service is running
curl http://localhost:3000/browsers/status
```

### Option 2: Web UI Upload (If Available)
1. Navigate to: http://65.21.199.228:3000
2. Login with credentials
3. Look for "Upload" or "Update" section
4. Upload `bol-automation.js`
5. Restart service via UI

### Option 3: API Deployment (If Available)
```bash
# Check if API accepts file uploads
curl -X POST http://65.21.199.228:3000/api/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@/Users/northsea/ClaudeProjects/bol-seller-messenger-v3/workflow-service/bol-automation.js"
```

## Verification After Deployment

### 1. Test Seller Name Extraction
```bash
curl -X POST "https://bol-seller-messenger.vercel.app/api/qa/dry-run" \
  -H 'Content-Type: application/json' \
  -d '{
    "keywords":["powerbank"],
    "messageTemplates":[{"enabled":true,"content":"Test"}],
    "senderNames":["Test"],
    "senderEmails":["test@test.com"],
    "senderPhones":[],
    "subject":"Test"
  }' | jq '.previews[0:3] | map(.seller)'
```

**Expected Output (AFTER deployment):**
```json
[
  "SurgeStore.co",
  "ecomDaan",
  "Hard2find.nl"
]
```

**Current Output (BEFORE deployment):**
```json
[
  "Bekijk extra partnervoorwaarden",
  "Bekijk extra partnervoorwaarden",
  "Bekijk extra partnervoorwaarden"
]
```

### 2. Test Duplicate Detection
```bash
# Run campaign with 3 messages per keyword
curl -X POST "https://bol-seller-messenger.vercel.app/api/run" \
  -H 'Content-Type: application/json' \
  -d '{
    "keywords":["usb kabel"],
    "messagesPerKeyword":3,
    ...
  }'
```

**Expected:** 3 different sellers contacted successfully
**Before Fix:** 1st sent, 2nd & 3rd show "Already contacted within 6 months"

## Changes Made in bol-automation.js

### Before (Lines 102-116):
```javascript
const sellerInfo = await this.page.evaluate(() => {
  const underlinedSpans = document.querySelectorAll('span.underline, span[class*="underline"]');
  
  for (const span of underlinedSpans) {
    const text = span.textContent.trim();
    if (text.startsWith('Verkoop door')) {
      const sellerName = text.replace(/^Verkoop door\s+/, '').split(/\s+(beoordeeld|rated)/)[0].trim();
      return { seller: sellerName };
    }
  }
  
  return null;
});
```

### After (Lines 102-135):
```javascript
const sellerInfo = await this.page.evaluate(() => {
  // Look for "Verkoop door" container - parent span with nested button
  const spans = document.querySelectorAll('span');
  
  for (const span of spans) {
    const ariaHidden = span.querySelector('span[aria-hidden="true"]');
    if (ariaHidden && ariaHidden.textContent.trim() === 'Verkoop door') {
      // Find button with seller name (has aria-haspopup="dialog")
      const button = span.querySelector('button[aria-haspopup="dialog"]');
      if (button) {
        // Get visible seller name from nested span with aria-hidden="true"
        const sellerSpan = button.querySelector('span.underline span[aria-hidden="true"]');
        if (sellerSpan) {
          const sellerName = sellerSpan.textContent.trim();
          if (sellerName) {
            return { seller: sellerName, shopName: sellerName };
          }
        }
      }
    }
  }
  
  // Fallback: old method for compatibility
  const underlinedSpans = document.querySelectorAll('span.underline');
  for (const span of underlinedSpans) {
    const text = span.textContent.trim();
    if (text.startsWith('Verkoop door') && !text.includes('Bekijk extra')) {
      const sellerName = text.replace(/^Verkoop door\s+/, '').split(/\s+(beoordeeld|rated)/)[0].trim();
      return { seller: sellerName, shopName: sellerName };
    }
  }
  
  return null;
});
```

## Impact

### Issue Fixed
- ✅ Seller names now extracted correctly from nested HTML structure
- ✅ Filters out "Bekijk extra partnervoorwaarden" explicitly
- ✅ Adds `shopName` field for {{shopName}} template variable
- ✅ Duplicate detection works correctly (unique sellers = no false positives)

### Before Deployment
- ❌ All sellers: "Bekijk extra partnervoorwaarden"
- ❌ Only 1st message sent, rest skipped as "duplicates"
- ❌ "Already contacted within 6 months" shows for ALL sellers

### After Deployment
- ✅ Real seller names: "SurgeStore.co", "ecomDaan", etc.
- ✅ Multiple messages per keyword succeed (different shops)
- ✅ "Already contacted within 6 months" only for actual repeats

## Rollback Plan
If issues occur after deployment:
```bash
# Restore backup
ssh user@65.21.199.228
cd /path/to/cloud-browser/workflow-service/
cp bol-automation.js.backup-YYYYMMDD bol-automation.js
pm2 restart cloud-browser
```

## Support
- Local file: `/Users/northsea/ClaudeProjects/bol-seller-messenger-v3/workflow-service/bol-automation.js`
- Version: v2.9.0
- Date: October 20, 2026
