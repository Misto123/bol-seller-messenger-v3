# Automated Daily BOL Seller Outreach

Sends 1 message per day at 09:00 AM to 1 unique seller on BOL.com.

## Features

- ✅ Runs automatically at 09:00 AM daily
- ✅ Sends to 1 unique seller per day
- ✅ Rotates through keyword list
- ✅ Respects 6-month duplicate detection
- ✅ Logs all activity to file
- ✅ No manual intervention required

## Configuration

Edit `daily-outreach.js` to customize:

```javascript
const CAMPAIGN = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje', 'oplader', 'headset'],
  messagesPerKeyword: 1,
  senderEmails: ['contact@rankpartners.org'],
  senderNames: ['Mark van der Berg', 'Lisa Janssen', 'Tom de Vries', 'Emma Bakker'],
  senderPhones: ['0612345678', '0687654321'],
  subject: 'Vraag over uw product op BOL.com'
};
```

## Deployment to VPS

### 1. Copy Script to VPS
```bash
scp /Users/northsea/ClaudeProjects/bol-seller-messenger-v3/automation/daily-outreach.js \
    bram-ai-dev-1:~/bol-automation/
```

### 2. Set Up Cron Job (09:00 AM Daily)
```bash
ssh bram-ai-dev-1

# Edit crontab
crontab -e

# Add this line (09:00 AM every day, Amsterdam time):
0 9 * * * source ~/.nvm/nvm.sh && cd ~/bol-automation && node daily-outreach.js >> /tmp/bol-daily-outreach.log 2>&1
```

**Cron Schedule Explanation:**
- `0 9 * * *` = At 09:00 AM every day
- `source ~/.nvm/nvm.sh` = Load Node.js environment
- `>> /tmp/bol-daily-outreach.log 2>&1` = Append output to log file

### 3. Verify Cron Job
```bash
# List current cron jobs
crontab -l

# Test script manually
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && cd ~/bol-automation && node daily-outreach.js"

# View logs
ssh bram-ai-dev-1 "tail -50 /tmp/bol-daily-outreach.log"
```

## Manual Testing

```bash
# Run locally
node automation/daily-outreach.js

# Run on VPS
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && cd ~/bol-automation && node daily-outreach.js"
```

## Logs

**Log Location:** `/tmp/bol-daily-outreach.log`

**View Recent Logs:**
```bash
ssh bram-ai-dev-1 "tail -100 /tmp/bol-daily-outreach.log"
```

**Example Log Output:**
```
[2026-10-26T09:00:01.234Z] === Starting Daily Outreach ===
[2026-10-26T09:00:01.345Z] Selected keyword: powerbank
[2026-10-26T09:00:01.456Z] Sending API request to /api/run...
[2026-10-26T09:00:15.789Z] Results: 1 sent, 0 skipped, 0 failed
[2026-10-26T09:00:15.890Z] ✅ Sent to GlobeTrek: Vraag over uw product op BOL.com
[2026-10-26T09:00:15.901Z] === Daily Outreach Complete ===
```

## How It Works

### Keyword Rotation
The script rotates through keywords based on day of year:
- Day 1: powerbank
- Day 2: usb kabel
- Day 3: telefoonhoesje
- Day 4: oplader
- Day 5: headset
- Day 6: powerbank (repeats)

This ensures variety and avoids targeting the same sellers repeatedly.

### Duplicate Prevention
- Built-in 6-month duplicate detection
- If today's keyword has no available sellers (all contacted recently), the message is skipped
- Next day will try a different keyword

### Sender Rotation
Randomly selects from configured sender names, emails, and phone numbers to appear more natural.

## Monitoring

### Check if Cron is Running
```bash
ssh bram-ai-dev-1 "ps aux | grep cron"
```

### Check Last Execution
```bash
ssh bram-ai-dev-1 "tail -20 /tmp/bol-daily-outreach.log"
```

### View Sent Messages
Check the dashboard: https://bol-seller-messenger.vercel.app/history

## Troubleshooting

### Script Not Running at 09:00 AM
```bash
# Check cron service is running
ssh bram-ai-dev-1 "systemctl status cron"

# Check crontab is set
ssh bram-ai-dev-1 "crontab -l"

# Check system timezone
ssh bram-ai-dev-1 "timedatectl"
```

### API Errors
```bash
# Test API manually
curl https://bol-seller-messenger.vercel.app/api/history

# Check Cloud Browser health
curl http://65.21.199.228:3000
```

### Node.js Not Found
```bash
# Verify Node.js is accessible
ssh bram-ai-dev-1 "source ~/.nvm/nvm.sh && node --version"

# Update cron to use full path
ssh bram-ai-dev-1 "which node"
# Then update crontab with full path
```

## Stopping Automation

### Temporarily Disable
```bash
ssh bram-ai-dev-1 "crontab -e"
# Comment out the line with #:
# 0 9 * * * source ~/.nvm/nvm.sh && cd ~/bol-automation && node daily-outreach.js
```

### Permanently Remove
```bash
ssh bram-ai-dev-1 "crontab -e"
# Delete the line completely
```

## Customization

### Change Schedule
Edit crontab and modify the time:
- `0 9 * * *` = 09:00 AM daily
- `0 14 * * *` = 02:00 PM daily
- `0 9 * * 1-5` = 09:00 AM weekdays only
- `0 9,14 * * *` = 09:00 AM and 02:00 PM daily

### Send More Messages
Edit `daily-outreach.js`:
```javascript
messagesPerKeyword: 3  // Send 3 messages per day
```

### Add More Keywords
Edit `daily-outreach.js`:
```javascript
keywords: ['powerbank', 'usb kabel', 'nieuwe keyword 1', 'nieuwe keyword 2']
```

## Security Notes

- ✅ Uses HTTPS for all API calls
- ✅ Logs do not contain sensitive data
- ✅ Credentials stored in Vercel environment (not in script)
- ✅ VPS accessible only via SSH key

## Support

For issues or questions:
1. Check logs: `/tmp/bol-daily-outreach.log`
2. Test manually: `node automation/daily-outreach.js`
3. Verify API: https://bol-seller-messenger.vercel.app/history
