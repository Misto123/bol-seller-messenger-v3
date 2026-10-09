import { NextRequest, NextResponse } from 'next/server';
import { BolAutomation } from '@/lib/bol-automation';
import { checkSellerContactRecently } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export const maxDuration = 300;

const pickRandom = <T,>(items: T[]): T | undefined => items[Math.floor(Math.random() * items.length)];
const generateRandomPhone = () => `06${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

export async function POST(request: NextRequest) {
  const cloudBrowserUrl = process.env.CLOUD_BROWSER_URL;
  const cloudBrowserApiKey = process.env.CLOUD_BROWSER_API_KEY;
  if (!cloudBrowserUrl || !cloudBrowserApiKey) {
    return NextResponse.json({ error: 'Cloud Browser API is not configured' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((keyword): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0 && keyword.length <= 100).slice(0, 3)
    : [];
  if (!keywords.length) {
    return NextResponse.json({ error: 'Select at least one keyword for the dry run' }, { status: 400 });
  }

  const templates = Array.isArray(body.messageTemplates)
    ? body.messageTemplates.filter((candidate): candidate is { enabled: true; content: string } => {
        if (typeof candidate !== 'object' || candidate === null) return false;
        const template = candidate as Record<string, unknown>;
        return template.enabled === true && typeof template.content === 'string' && template.content.length <= 5000;
      }).slice(0, 20)
    : [];
  if (!templates.length) {
    return NextResponse.json({ error: 'Enable at least one message template' }, { status: 400 });
  }

  const names = Array.isArray(body.senderNames) ? body.senderNames.filter((v): v is string => typeof v === 'string' && Boolean(v.trim())).slice(0, 50) : [];
  const emails = Array.isArray(body.senderEmails) ? body.senderEmails.filter((v): v is string => typeof v === 'string' && Boolean(v.trim())).slice(0, 50) : [];
  const phones = Array.isArray(body.senderPhones) ? body.senderPhones.filter((v): v is string => typeof v === 'string' && Boolean(v.trim())).slice(0, 50) : [];
  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 200) : 'Product inquiry';
  const sponsoredOnly = body.sponsoredOnly === true;
  const automation = new BolAutomation('k1fgmwtq', cloudBrowserUrl, cloudBrowserApiKey);
  const previews = [];

  try {
    await automation.initialize();
    for (const keyword of keywords) {
      try {
        // Dry run only searches and renders previews. It never calls contactSeller or writes logs.
        const sellers = await automation.searchProducts(keyword, sponsoredOnly, 5, 10);
        for (const seller of sellers) {
          const template = pickRandom(templates)?.content ?? '';
          const senderName = pickRandom(names) ?? '';
          const senderEmail = pickRandom(emails) ?? '';
          const senderPhone = pickRandom(phones) ?? generateRandomPhone();
          const message = template
            .replace(/\{\{sellerName\}\}/g, seller.name)
            .replace(/\{\{productTitle\}\}/g, seller.productTitle)
            .replace(/\{\{keyword\}\}/g, keyword)
            .replace(/\{\{senderName\}\}/g, senderName)
            .replace(/\{\{senderEmail\}\}/g, senderEmail)
            .replace(/\{\{senderPhone\}\}/g, senderPhone);
          const duplicateCheck = await checkSellerContactRecently(seller.name, 6);
          previews.push({
            keyword,
            seller: seller.name,
            productTitle: seller.productTitle,
            productUrl: seller.productUrl,
            sponsored: seller.sponsored,
            senderName,
            senderEmail,
            senderPhone,
            subject,
            message,
            duplicate: duplicateCheck.contacted,
            duplicateCheckAvailable: duplicateCheck.checked,
            status: !duplicateCheck.checked ? 'duplicate_check_unavailable' : duplicateCheck.contacted ? 'would_skip_duplicate' : 'ready_to_send',
            unresolvedVariables: [...message.matchAll(/\{\{[^}]+\}\}/g)].map(([v]) => v),
          });
        }
      } catch (error) {
        previews.push({ keyword, status: 'search_failed', error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: true,
      messagesSent: 0,
      historyRecordsWritten: 0,
      ipAddress: automation.getDetectedIp(),
      previews,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      dryRun: true,
      messagesSent: 0,
      historyRecordsWritten: 0,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  } finally {
    try {
      await automation.cleanup();
    } catch (error) {
      console.error('[QA dry-run] Browser cleanup failed:', error);
    }
  }
}
