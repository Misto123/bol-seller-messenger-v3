# BOL Seller Workflow Service

Local background service that handles BOL.nl seller outreach campaigns using AdsPower browser automation.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start the service:**
   ```bash
   npm start
   # Or use the startup script:
   ./start.sh
   ```

## Endpoints

- `GET /health` - Health check
- `POST /api/run` - Run seller outreach campaign

## Architecture

```
Vercel App (bol-seller-messenger.vercel.app)
    ↓ HTTP POST
Mac Mini Service (localhost:3100)
    ↓ Browser automation
AdsPower MCP (localhost:50326)
    ↓ Browser profiles
BOL.nl sellers
```

## Exposing to Vercel

Use ngrok or cloudflare tunnel:

```bash
# Option 1: ngrok
ngrok http 3100

# Option 2: cloudflared
cloudflared tunnel --url http://localhost:3100
```

Then set `WORKFLOW_API_URL` in Vercel environment variables.

## Next Steps

1. Implement AdsPower MCP integration for:
   - Browser profile selection
   - BOL.nl navigation
   - Seller search and filtering
   - Contact form automation
   
2. Add result persistence (database/file)
3. Add rate limiting (20 messages/day)
4. Add error handling and retry logic
