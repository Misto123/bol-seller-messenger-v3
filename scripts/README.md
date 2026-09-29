# BOL Seller Messenger - Recurring Campaigns

This directory contains scripts for running automated campaigns 24/7 without manual intervention.

## Setup

Run the setup script once:

```bash
./scripts/setup-recurring-tasks.sh
```

This will:
- Install a macOS launch agent
- Schedule campaigns to run daily at 9:00 AM
- Set up logging directory

## How It Works

1. **Web UI Configuration** - Configure your campaign settings (keywords, sender info, messages) via http://localhost:3000/settings
2. **Automatic Execution** - The system runs campaigns automatically at 9:00 AM daily
3. **Smart Duplicates** - Sellers contacted in the last 6 months are automatically skipped
4. **Logging** - All campaign runs are logged to `logs/campaign-*.log`

## Manual Execution

To run a campaign immediately:

```bash
./scripts/run-campaign.sh
```

## Schedule Customization

To change when campaigns run, edit `scripts/com.bol-seller-messenger.campaign.plist`:

```xml
<!-- Run daily at 9:00 AM -->
<key>Hour</key>
<integer>9</integer>
<key>Minute</key>
<integer>0</integer>
```

Then reload:

```bash
launchctl unload ~/Library/LaunchAgents/com.bol-seller-messenger.campaign.plist
launchctl load ~/Library/LaunchAgents/com.bol-seller-messenger.campaign.plist
```

## Management Commands

**Check if running:**
```bash
launchctl list | grep bol-seller-messenger
```

**Stop campaigns:**
```bash
launchctl unload ~/Library/LaunchAgents/com.bol-seller-messenger.campaign.plist
```

**Start campaigns:**
```bash
launchctl load ~/Library/LaunchAgents/com.bol-seller-messenger.campaign.plist
```

**View logs:**
```bash
tail -f logs/campaign-*.log
```

**View latest log:**
```bash
ls -t logs/campaign-*.log | head -1 | xargs cat
```

## Requirements

- The Next.js development server must be running on port 3000
- Campaign settings must be configured via the web UI first
- AdsPower browser profile must be accessible
- Cloud Browser API must be reachable

## Troubleshooting

**"No campaign settings found"**
- Configure settings via http://localhost:3000/settings first

**"Connection refused"**
- Start the dev server: `npm run dev`

**Campaign not running**
- Check launchd status: `launchctl list | grep bol-seller-messenger`
- Check logs: `cat logs/launchd-stderr.log`

**Browser automation fails**
- Verify AdsPower profile: `k1fgmwtq`
- Verify Cloud Browser API: `http://65.21.199.228:3000`

## Architecture

```
┌─────────────────┐
│  macOS launchd  │ Triggers daily at 9 AM
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ run-campaign.sh │ Reads settings, calls API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │ /api/run endpoint
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloud Browser   │ Automated BOL.nl interaction
│   + AdsPower    │
└─────────────────┘
```

## Security Notes

- Campaign settings are stored in localStorage (client-side only)
- No sensitive data is logged
- Password protection remains active on all pages
- All browser automation happens in isolated AdsPower profile

## Logs

All campaign executions are logged with:
- Timestamp
- Keywords processed
- Messages sent/skipped
- Errors and warnings
- Full API response

Logs are never automatically deleted - manage them manually to control disk usage.

## Version

This feature is available in v2.4.0+
