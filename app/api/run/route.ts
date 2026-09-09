import { NextRequest, NextResponse } from 'next/server';
import { BolAutomation } from '@/lib/bol-automation';

// Edge Runtime doesn't support puppeteer, use Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max execution

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keywords = [], 
      messages = [],
      names = [],
      emails = [],
      subjects = [],
      phone = '',
      count = 1,
      filterSponsored = false 
    } = body;

    // Validate required environment variables
    const cloudBrowserUrl = process.env.CLOUD_BROWSER_URL;
    const cloudBrowserApiKey = process.env.CLOUD_BROWSER_API_KEY;
    const profileId = 'k1fgmwtq'; // TODO: Make dynamic per user later

    if (!cloudBrowserUrl || !cloudBrowserApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Cloud Browser API not configured. Please set CLOUD_BROWSER_URL and CLOUD_BROWSER_API_KEY environment variables.'
      }, { status: 500 });
    }

    if (keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No keywords provided'
      }, { status: 400 });
    }

    const results: any[] = [];
    const automation = new BolAutomation(profileId, cloudBrowserUrl, cloudBrowserApiKey);

    try {
      // Initialize browser
      await automation.initialize();

      // Process each keyword
      for (const keyword of keywords) {
        try {
          console.log(`[API] Processing keyword: ${keyword}`);
          
          const sellers = await automation.searchProducts(keyword, filterSponsored);
          
          console.log(`[API] Found ${sellers.length} sellers for "${keyword}"`);

          // Process each seller
          for (const seller of sellers) {
            const template = messages[0] || 'Hello {{sellerName}}, interested in {{productTitle}}';
            const senderName = names[0] || '';
            const senderEmail = emails[0] || '';
            const subject = subjects[0] || 'Product inquiry';
            
            const message = template
              .replace(/\{\{sellerName\}\}/g, seller.name)
              .replace(/\{\{productTitle\}\}/g, seller.productTitle)
              .replace(/\{\{senderName\}\}/g, senderName)
              .replace(/\{\{senderEmail\}\}/g, senderEmail)
              .replace(/\{\{senderPhone\}\}/g, phone);

            const result = await automation.contactSeller(seller, {
              name: senderName,
              email: senderEmail,
              phone,
              subject,
              message,
            });

            results.push({
              seller: seller.name,
              keyword,
              subject,
              message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
              timestamp: result.timestamp,
              status: 'sent',
            });
          }
        } catch (error: any) {
          console.error(`[API] Error processing keyword "${keyword}":`, error);
          results.push({
            seller: 'Error',
            keyword,
            status: 'failed',
            reason: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } finally {
      // Always cleanup browser session
      await automation.cleanup();
    }

    return NextResponse.json({
      results,
    });

  } catch (error: any) {
    console.error('[API] Campaign error:', error);
    return NextResponse.json({
      results: [{
        seller: 'System Error',
        keyword: '',
        status: 'failed',
        reason: error.message,
        timestamp: new Date().toISOString(),
      }]
    }, { status: 500 });
  }
}
