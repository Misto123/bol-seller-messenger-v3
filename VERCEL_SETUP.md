# Vercel Deployment Setup Guide

## Environment Variables Required

You need to configure these environment variables in Vercel:

### 1. Cloud Browser API Configuration

**CLOUD_BROWSER_URL**
- Value: `http://65.21.199.228:3000`
- Description: URL of the Cloud Browser API service

**CLOUD_BROWSER_API_KEY**
- Value: Get from 1Password vault
- Description: API key for authenticating with Cloud Browser API
- Security: Keep this secret, never commit to git

**ADSPOWER_PROFILE_ID**
- Value: `k1fgmwtq` (or your AdsPower profile ID)
- Description: AdsPower browser profile ID to use for automation

### 2. Application Password (Optional)

**WORKSPACE_PASSWORD**
- Value: Your chosen password
- Description: Password to access the admin interface
- Default: If not set, password protection is disabled

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/bram-1592s-projects/bol-seller-messenger-v3
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar
4. Add each variable:
   - **Key**: Variable name (e.g., `CLOUD_BROWSER_API_KEY`)
   - **Value**: The actual value
   - **Environments**: Select `Production`, `Preview`, and `Development` (or just Production)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

### Method 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd /Users/northsea/ClaudeProjects/bol-seller-messenger-v3
vercel link

# Add environment variables
vercel env add CLOUD_BROWSER_URL
# Enter value: http://65.21.199.228:3000
# Select environments: Production, Preview, Development

vercel env add CLOUD_BROWSER_API_KEY
# Enter value: [paste from 1Password]
# Select environments: Production, Preview, Development

vercel env add ADSPOWER_PROFILE_ID
# Enter value: k1fgmwtq
# Select environments: Production, Preview, Development

# Trigger a new deployment
vercel --prod
```

## Security Best Practices

1. ✅ **Never commit API keys to git**
   - `.env.local` and `.env.production` are in `.gitignore`
   - Use Vercel's environment variables instead

2. ✅ **Use different keys for different environments**
   - Production: Use production API keys
   - Preview/Development: Can use test/dev keys

3. ✅ **Rotate keys regularly**
   - Update Cloud Browser API key periodically
   - Update in Vercel dashboard when changed

## Verification

After setting environment variables and deploying:

1. **Check deployment logs** in Vercel dashboard for any errors
2. **Test the API endpoint**: 
   ```bash
   curl -X POST https://bol-seller-messenger-v3.vercel.app/api/run \
     -H "Content-Type: application/json" \
     -d '{"keywords":["test"]}'
   ```
3. **Check browser logs** in Vercel Functions logs to see if Cloud Browser API is connecting

## Troubleshooting

### Error: "Cloud Browser API not configured"
- Environment variables are not set in Vercel
- Solution: Add the variables in Vercel dashboard and redeploy

### Error: "Failed to start browser"
- Invalid API key or profile ID
- Solution: Check API key in 1Password, verify profile ID exists

### Error: "Timeout connecting to browser"
- Cloud Browser API server is down
- Solution: Check http://65.21.199.228:3000/status

## What Changed from Previous Setup

**Before (ngrok + local Mac Mini):**
- Frontend on Vercel → ngrok URL → Mac Mini localhost:3100
- Needed Mac Mini running 24/7
- Needed ngrok tunnel

**After (Cloud Browser API):**
- Frontend on Vercel → Cloud Browser API (65.21.199.228:3000) → Remote browsers
- No Mac Mini dependency
- No ngrok needed
- Everything runs in the cloud

## Next Steps

1. Set the environment variables in Vercel (see above)
2. Push code to GitHub (triggers automatic deployment)
3. Test the deployed application
4. Monitor logs for any issues
