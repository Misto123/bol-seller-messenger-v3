# BOL Seller Messenger - Current Status

## ✅ What's Working

### Core Functionality
- ✅ **Seller extraction** - Successfully extracts third-party seller names from BOL.nl
- ✅ **Search automation** - Opens AdsPower browser, searches BOL.nl for keywords
- ✅ **Product page navigation** - Loops through up to 10 product pages per search
- ✅ **BOL direct filtering** - Skips products sold by BOL.com
- ✅ **Database persistence** - SQLite stores campaigns and results
- ✅ **History UI** - View past campaigns at `/history`
- ✅ **API endpoints** - Full REST API for running campaigns
- ✅ **Ngrok tunnel** - Vercel frontend → Local service via ngrok

### Successfully Tested Sellers
- `fonu.nl` (iPhone hoesjes)
- `Multimedia Trading` (Powerbanks)
- `Smartphonehoesjes.nl` (Samsung hoesjes)

### Technical Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js Express workflow service
- **Browser**: AdsPower + Puppeteer automation
- **Database**: SQLite
- **Deployment**: Vercel (frontend), Mac Mini (workflow service)

## ⚠️ Known Issues

1. **Navigation timeouts** - 30s timeout sometimes too short for BOL.nl pages
   - **Fix**: Increase timeout to 45s or use `domcontentloaded` instead of `networkidle2`

2. **Contact form submission not implemented** - Currently returns "sent" but doesn't actually submit
   - **Todo**: Implement seller modal → contact link → form filling → submit

3. **No tab cleanup** - Browser tabs stay open after each product check
   - **Fix**: Close product tabs after checking seller info

## 📊 Test Results

### Latest Test (2026-08-28)
```json
{
  "seller": "Multimedia Trading",
  "keyword": "powerbank",
  "status": "sent",
  "message": "Interesse in bulkorder",
  "name": "Jan de Vries",
  "email": "jan@vries.nl"
}
```

### Search Performance
- Search results load: ~5-7 seconds
- Product page check: ~3-5 seconds per product
- Total time (finding 1 seller): ~30-60 seconds
- Success rate: ~70% (depends on keyword having third-party sellers)

## 🚀 Next Steps

### Priority 1: Contact Form Submission
1. Click "Verkoop door [seller]" button to open modal
2. Find "Vraag stellen" or "Contact" link in modal
3. Fill contact form fields (name, email, message)
4. Submit and verify success

### Priority 2: Performance
1. Increase navigation timeout to 45s
2. Use `domcontentloaded` instead of `networkidle2` for faster page loads
3. Close product tabs after checking
4. Add retry logic for failed navigations

### Priority 3: Robustness
1. Handle CAPTCHA/verification pages
2. Better error messages for users
3. Rate limiting to avoid BOL.nl blocks
4. Proxy rotation support

## 🔧 Configuration

### Environment Variables
```
ADSPOWER_PORT=50326
ADSPOWER_API_KEY=746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329
DEFAULT_PROFILE_ID=k1fgmwtq
PORT=3100
WORKFLOW_API_URL=https://unstoic-enid-unofficially.ngrok-free.dev
```

### AdsPower Profile
- **Profile ID**: `k1fgmwtq`
- **Email**: delia.roijen@gmail.com
- **Proxy**: NL Mobile (77.63.77.185)

## 📝 Usage

### Run Campaign
```bash
curl -X POST http://localhost:3100/api/run \
  -H 'Content-Type: application/json' \
  -d '{
    "keywords": ["powerbank"],
    "count": 1,
    "messages": ["Interesse in bulkorder"],
    "names": ["Jan de Vries"],
    "emails": ["jan@vries.nl"],
    "subjects": ["Vraag"],
    "phone": "0612345678"
  }'
```

### View History
```
https://bol-seller-messenger.vercel.app/history
```

## 🐛 Debugging

### Screenshots
- Search results: `/tmp/bol-search-{keyword}-{timestamp}.png`
- Product pages: `/tmp/bol-product-seller-{timestamp}.png`
- After search: `/tmp/bol-after-search-{timestamp}.png`

### Logs
- Workflow service: `/tmp/bol-workflow.log`
- Step-by-step logging from Step 1-20 with detailed progress

### Common Errors
1. **"Navigation timeout"** - Page took too long to load
2. **"No third-party sellers found"** - All products on page sold by BOL directly
3. **"Failed to connect to localhost:3100"** - Workflow service not running

## 💡 Key Learnings

1. **BOL.nl uses Next.js** - Product data is in `__NEXT_DATA__` JSON, but easier to extract from DOM
2. **Seller info on product pages only** - Not visible on search results page
3. **DOM selector for seller**: `button[aria-haspopup="dialog"] span.underline span[aria-hidden="true"]`
4. **Many products are BOL direct** - Need to check multiple products to find third-party sellers
5. **Page load times vary** - Some products load fast, others take 20-30s

## 📚 Files

### Key Files
- `workflow-service/bol-automation.js` - Main automation logic
- `workflow-service/server.js` - Express API server
- `workflow-service/database.js` - SQLite persistence
- `app/page.tsx` - Frontend UI
- `app/history/page.tsx` - Campaign history

### Database Schema
```sql
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY,
  keyword TEXT,
  seller TEXT,
  status TEXT,
  timestamp TEXT
);

CREATE TABLE results (
  id INTEGER PRIMARY KEY,
  campaign_id INTEGER,
  seller TEXT,
  status TEXT,
  message TEXT,
  timestamp TEXT
);
```

## 🎯 Success Criteria

- [x] Extract seller names from BOL.nl
- [x] Skip BOL direct sales
- [x] Store results in database
- [x] Show history in UI
- [ ] Submit contact forms
- [ ] Handle 100+ campaigns/day
- [ ] < 5% error rate
