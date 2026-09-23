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
      phones = [],
      subjects = [],
      phone = '',
      count = 1,
      filterSponsored = false 
    } = body;

    // Helper function to pick random item from array
    const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // Helper function to generate random Dutch phone number
    const generateRandomPhone = () => {
      const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      return `06${randomDigits}`;
    };

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

          let sentCount = 0;
          const targetCount = count || 3;

          // Process each seller until we reach target count of SENT messages
          for (const seller of sellers) {
            // Stop if we've sent enough messages (not counting skipped)
            if (sentCount >= targetCount) {
              console.log(`[API] Reached target of ${targetCount} sent messages for "${keyword}"`);
              break;
            }

            // Randomly select sender details for this message
            const template = pickRandom(messages) || 'Hello {{sellerName}}, interested in {{productTitle}}';
            const senderName = pickRandom(names) || 'Unknown';
            const senderEmail = pickRandom(emails) || 'noreply@example.com';
            const senderPhone = phones.length > 0 ? pickRandom(phones) : generateRandomPhone();
            const subject = pickRandom(subjects) || 'Product inquiry';
            
            console.log(`[API] Random selection - Name: ${senderName}, Email: ${senderEmail}, Phone: ${senderPhone}`);
            
            const message = template
              .replace(/\{\{sellerName\}\}/g, seller.name)
              .replace(/\{\{productTitle\}\}/g, seller.productTitle)
              .replace(/\{\{keyword\}\}/g, keyword)
              .replace(/\{\{senderName\}\}/g, senderName)
              .replace(/\{\{senderEmail\}\}/g, senderEmail)
              .replace(/\{\{senderPhone\}\}/g, senderPhone);

            const result = await automation.contactSeller(seller, {
              name: senderName,
              email: senderEmail,
              phone: senderPhone,
              subject,
              message,
            }, keyword);

            // Determine status from result
            const status = result.success ? 'sent' : result.error ? 'skipped' : 'failed';
            
            // Only increment counter for successfully sent messages
            if (status === 'sent') {
              sentCount++;
            }

            results.push({
              seller: seller.name,
              keyword,
              subject,
              message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
              timestamp: result.timestamp,
              status,
              reason: result.error || undefined,
            });

            console.log(`[API] ${seller.name}: ${status} (${sentCount}/${targetCount} sent)`);
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
