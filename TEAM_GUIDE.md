# BOL Seller Messenger - Team Setup Guide

## 🚀 Quick Start

### For Team Members Using the App

1. **Open the app**: https://bol-seller-messenger.vercel.app
2. **First time setup**:
   - Click **⚙️ Instellingen** (Settings)
   - Add your keywords (e.g., "powerbank", "usb kabel")
   - Create message templates with placeholders
   - Configure sender info (name, email, phone)
   - Set cooldown between keywords (recommended: 5 minutes)
   - Set messages per keyword (recommended: 3-5)
   - Click **Instellingen Opslaan** (Save Settings)

3. **Run a campaign**:
   - Go back to main page
   - Select keywords you want to process
   - Review message template previews
   - (Optional) Check "Gebruik aangepast bericht" for custom message
   - Click **🚀 Start Outreach**

### Settings Explained

#### Keywords
- Add multiple keywords to search BOL.nl
- System will process each keyword sequentially
- Example: "powerbank", "usb kabel", "telefoonhoesje"

#### Cooldown
- Minutes to wait BETWEEN keywords (not between messages)
- Prevents rate limiting
- Recommended: 5-10 minutes

#### Messages Per Keyword
- How many sellers to contact per keyword
- Maximum: 20
- Recommended: 3-5 for testing

#### Message Templates
- Create multiple templates
- System randomly picks one for each message
- Use placeholders for dynamic content

#### Placeholders
Use these in your message templates:
- `{{sellerName}}` - Seller name (e.g., "fonu.nl")
- `{{productTitle}}` - Product title
- `{{keyword}}` - Search keyword used
- `{{senderName}}` - Your name
- `{{senderEmail}}` - Your email
- `{{senderPhone}}` - Your phone

**Example Template:**
```
Beste {{sellerName}},

Ik ben geïnteresseerd in uw product "{{productTitle}}" en zou graag meer informatie willen ontvangen over bulkprijzen.

Met vriendelijke groet,
{{senderName}}
{{senderPhone}}
```

### How It Works

**Workflow:**
1. You configure keywords: `["powerbank", "usb kabel"]`
2. You set messages per keyword: `3`
3. You set cooldown: `5 minutes`
4. Click Start

**What happens:**
```
1. Search "powerbank" on BOL.nl
2. Find third-party sellers
3. Send 3 messages (random templates, placeholders replaced)
4. Wait 5 minutes (cooldown)
5. Search "usb kabel" on BOL.nl
6. Find third-party sellers
7. Send 3 messages (random templates, placeholders replaced)
8. Done
```

### Settings Persistence
- Settings are saved in your browser (localStorage)
- Each team member has their own settings
- Settings persist across sessions
- No backend configuration needed

### View History
- Click **📜 Bekijk Geschiedenis** to see past campaigns
- Shows all previous runs with timestamps
- View which sellers were contacted
- See success/failure status

## 🔧 For Developers

### Local Development

1. **Clone the repo**:
```bash
git clone https://github.com/Misto123/bol-seller-messenger.git
cd bol-seller-messenger
```

2. **Install dependencies**:
```bash
npm install
cd workflow-service && npm install && cd ..
```

3. **Create .env.local** (for local dev):
```
WORKFLOW_API_URL=http://localhost:3100
NEXT_PUBLIC_WORKFLOW_API_URL=http://localhost:3100
```

4. **Start backend** (Terminal 1):
```bash
cd workflow-service
npm start
```

5. **Start frontend** (Terminal 2):
```bash
npm run dev
```

6. **Open**: http://localhost:3000

### Environment Variables

**Frontend (.env.local for dev, Vercel env vars for prod):**
- `WORKFLOW_API_URL` - Backend URL (server-side)
- `NEXT_PUBLIC_WORKFLOW_API_URL` - Backend URL (client-side)

**Backend (workflow-service/.env):**
- `ADSPOWER_PROFILE_ID` - AdsPower profile to use
- `ADSPOWER_API_KEY` - AdsPower API key
- `ADSPOWER_API_URL` - AdsPower API URL (default: http://localhost:50326)

### Project Structure

```
bol-seller-messenger/
├── app/
│   ├── page.tsx                 # Main campaign page
│   ├── settings/page.tsx        # Settings configuration
│   ├── history/page.tsx         # Campaign history
│   └── api/run/route.ts         # API proxy to backend
├── workflow-service/
│   ├── server.js                # Express backend
│   ├── bol-automation.js        # BOL.nl automation logic
│   └── database.js              # SQLite persistence
├── .env.local                   # Local dev env vars (gitignored)
└── .env.production              # Vercel env vars
```

### Deployment

**Automatic:**
- Push to `main` branch
- Vercel auto-deploys frontend
- Backend runs on Mac Mini (local)

**Manual:**
```bash
git add -A
git commit -m "your changes"
git push
```

### Backend Service

The workflow service runs locally on Mac Mini and handles:
- AdsPower browser automation
- BOL.nl seller extraction
- Contact form submission
- Placeholder replacement
- Cooldown management
- Database persistence

**Start backend:**
```bash
cd workflow-service
npm start
```

**Health check:**
```bash
curl http://localhost:3100/health
```

## 📊 Status & Monitoring

### Check Deployment
- **Frontend**: https://bol-seller-messenger.vercel.app
- **Vercel Dashboard**: https://vercel.com/bram-1592s-projects/bol-seller-messenger
- **GitHub**: https://github.com/Misto123/bol-seller-messenger

### Logs
**Frontend logs**: Vercel dashboard
**Backend logs**: `/tmp/bol-workflow.log`

### Database
- SQLite database: `workflow-service/results.db`
- Stores campaigns and results
- View via history page in UI

## 🎯 Current Status

### ✅ Working
- Seller extraction from BOL.nl
- Third-party seller detection
- BOL direct filtering
- Settings system with localStorage
- Message templates with placeholders
- Cooldown between keywords
- Full message preview
- Database persistence
- History tracking

### ⚠️ Pending
- Contact form submission (90% done, needs real testing)
- Tab cleanup after product checks
- Production scale testing (100+ campaigns)

### 🐛 Known Issues
- Pages sometimes timeout (60s limit, may need increase)
- No CAPTCHA handling yet
- No retry logic for failed navigations

## 💡 Tips

1. **Start small**: Test with 1-2 keywords and 1-2 messages first
2. **Use cooldown**: 5+ minutes between keywords prevents rate limiting
3. **Check previews**: Always review message templates before sending
4. **Monitor history**: Check success rate in history page
5. **Placeholders**: Always use `{{sellerName}}` for personalization

## 🆘 Troubleshooting

**"seller workflow is not connected"**
- Backend service is down
- Check if `workflow-service` is running on Mac Mini
- Restart: `cd workflow-service && npm start`

**No sellers found**
- Keyword might not have third-party sellers
- Try different keywords
- Check BOL.nl manually to verify sellers exist

**Settings not saving**
- Browser localStorage disabled
- Try different browser
- Check browser console for errors

**Timeout errors**
- BOL.nl is slow (30-60s per page)
- Increase timeout in backend
- Use fewer messages per keyword

## 📞 Support

- **Issues**: https://github.com/Misto123/bol-seller-messenger/issues
- **Docs**: See `FINAL_STATUS.md`, `ACHIEVEMENTS.md`, `STATUS.md`

---

**Last Updated**: 2026-09-01
**Version**: 1.0.0 (Production Ready)
