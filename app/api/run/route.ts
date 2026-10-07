import { NextRequest, NextResponse } from 'next/server';
import { BolAutomation } from '@/lib/bol-automation';
import { insertMessageLog } from '@/lib/supabase-db';

// Edge Runtime doesn't support puppeteer, use Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max execution

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keywords = [], 
      messageTemplates = [],
      senderNames = [],
      senderEmails = [],
      senderPhones = [],
      subject = '',
      messagesPerKeyword = 3,
      cooldownMinutes = 5,
      sponsoredOnly = false,
      messageSpreadMinutes = 3
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

    const logFailure = async (keyword: string, error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      const senderName = pickRandom(senderNames) || 'Unknown';
      const senderEmail = pickRandom(senderEmails) || 'noreply@example.com';
      const senderPhone = senderPhones.length > 0 ? pickRandom(senderPhones) : generateRandomPhone();
      const timestamp = new Date().toISOString();

      await insertMessageLog({
        shop_name: 'Campaign system',
        product_title: '',
        keyword,
        message: '',
        subject: subject || 'Product inquiry',
        sender_name: senderName,
        sender_email: senderEmail,
        sender_phone: senderPhone,
        screenshot_path: null,
        adspower_profile: profileId,
        ip_address: null,
        status: 'failed',
        error_message: reason,
        timestamp,
      });

      results.push({
        seller: 'Campaign system',
        keyword,
        subject: subject || 'Product inquiry',
        message: '',
        timestamp,
        status: 'failed',
        reason,
      });
    };

    try {
      // Initialize browser
      try {
        await automation.initialize();
      } catch (error) {
        for (const keyword of keywords) {
          await logFailure(keyword, error);
        }
        return NextResponse.json({ results, error: error instanceof Error ? error.message : String(error) }, { status: 502 });
      }

      // Process each keyword
      for (const keyword of keywords) {
        try {
          console.log(`[API] Processing keyword: ${keyword}`);
          
          const sellers = await automation.searchProducts(keyword, sponsoredOnly);
          
          console.log(`[API] Found ${sellers.length} sellers for "${keyword}"`);

          let sentCount = 0;
          const targetCount = messagesPerKeyword;

          // Get enabled templates only
          const enabledTemplates = messageTemplates.filter((t: any) => t.enabled);
          if (enabledTemplates.length === 0) {
            await logFailure(keyword, 'No enabled message templates configured');
            continue;
          }

          // Process each seller until we reach target count of SENT messages
          for (const seller of sellers) {
            // Stop if we've sent enough messages (not counting skipped)
            if (sentCount >= targetCount) {
              console.log(`[API] Reached target of ${targetCount} sent messages for "${keyword}"`);
              break;
            }

            // Randomly select sender details for this message
            const template = pickRandom(enabledTemplates.map((t: any) => t.content)) || 'Hello {{sellerName}}, interested in {{productTitle}}';
            const senderName = pickRandom(senderNames) || 'Unknown';
            const senderEmail = pickRandom(senderEmails) || 'noreply@example.com';
            const senderPhone = senderPhones.length > 0 ? pickRandom(senderPhones) : generateRandomPhone();
            const messageSubject = subject || 'Product inquiry';
            
            console.log(`[API] Seller data - Name: "${seller.name}", Product: "${seller.productTitle}"`);
            console.log(`[API] Sender - Name: ${senderName}, Email: ${senderEmail}, Phone: ${senderPhone}`);
            console.log(`[API] Template before replace: ${template.substring(0, 100)}...`);
            
            const message = template
              .replace(/\{\{sellerName\}\}/g, seller.name)
              .replace(/\{\{productTitle\}\}/g, seller.productTitle)
              .replace(/\{\{keyword\}\}/g, keyword)
              .replace(/\{\{senderName\}\}/g, senderName)
              .replace(/\{\{senderEmail\}\}/g, senderEmail)
              .replace(/\{\{senderPhone\}\}/g, senderPhone);
            
            console.log(`[API] Message after replace: ${message.substring(0, 100)}...`);

            const result = await automation.contactSeller(seller, {
              name: senderName,
              email: senderEmail,
              phone: senderPhone,
              subject: messageSubject,
              message,
            }, keyword);

            // Determine status from result
            const status = result.success ? 'sent' : result.error ? 'skipped' : 'failed';
            
            // Only increment counter for successfully sent messages
            if (status === 'sent') {
              sentCount++;
              
              // Add delay between messages (message spread timing)
              if (sentCount < targetCount) {
                const delayMs = messageSpreadMinutes * 60 * 1000;
                console.log(`[API] Waiting ${messageSpreadMinutes} minutes before next message...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }

            results.push({
              seller: seller.name,
              keyword,
              subject: messageSubject,
              message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
              timestamp: result.timestamp,
              status,
              reason: result.error || undefined,
            });

            console.log(`[API] ${seller.name}: ${status} (${sentCount}/${targetCount} sent)`);
          }
        } catch (error: any) {
          console.error(`[API] Error processing keyword "${keyword}":`, error);
          await logFailure(keyword, error);
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
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
