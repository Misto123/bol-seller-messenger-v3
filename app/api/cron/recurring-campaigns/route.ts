import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.log('[CRON] Unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting recurring campaigns check...');

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all active recurring campaigns
    const { data: campaigns, error } = await supabase
      .from('recurring_campaigns')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('[CRON] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('[CRON] No active recurring campaigns found');
      return NextResponse.json({ 
        success: true,
        message: 'No active recurring campaigns',
        processed: 0
      });
    }

    const today = new Date();
    const results = [];

    for (const campaign of campaigns) {
      try {
        // Check if end date has passed
        if (campaign.end_date) {
          const endDate = new Date(campaign.end_date);
          if (today > endDate) {
            console.log(`[CRON] Campaign ${campaign.id} ended, disabling`);
            await supabase
              .from('recurring_campaigns')
              .update({ enabled: false })
              .eq('id', campaign.id);
            results.push({ id: campaign.id, status: 'ended' });
            continue;
          }
        }

        // Check if it's time to run (interval days since last run)
        const lastRun = campaign.last_run_date ? new Date(campaign.last_run_date) : null;
        const daysSinceLastRun = lastRun 
          ? Math.floor((today.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastRun < campaign.interval_days) {
          console.log(`[CRON] Campaign ${campaign.id} not due yet (${daysSinceLastRun}/${campaign.interval_days} days)`);
          results.push({ id: campaign.id, status: 'not_due' });
          continue;
        }

        console.log(`[CRON] Running campaign ${campaign.id}...`);

        // Trigger the campaign by calling /api/run
        const settings = campaign.settings;
        const runResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bol-seller-messenger.vercel.app'}/api/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywords: settings.keywords,
            cooldownMinutes: settings.cooldownMinutes,
            messagesPerKeyword: settings.messagesPerKeyword,
            messageSpreadMinutes: settings.messageSpreadMinutes,
            messageTemplates: settings.messageTemplates,
            senderNames: settings.senderNames,
            senderEmails: settings.senderEmails,
            senderPhones: settings.senderPhones,
            subject: settings.subject,
            sponsoredOnly: settings.sponsoredOnly,
          }),
        });

        const runData = await runResponse.json();

        // Update last run date
        await supabase
          .from('recurring_campaigns')
          .update({ 
            last_run_date: today.toISOString(),
            last_run_status: runResponse.ok ? 'success' : 'failed',
            last_run_results: runData.results || []
          })
          .eq('id', campaign.id);

        results.push({ 
          id: campaign.id, 
          status: runResponse.ok ? 'success' : 'failed',
          results: runData.results?.length || 0
        });

        console.log(`[CRON] Campaign ${campaign.id} completed: ${runData.results?.length || 0} results`);

      } catch (campaignError: any) {
        console.error(`[CRON] Error running campaign ${campaign.id}:`, campaignError);
        results.push({ id: campaign.id, status: 'error', error: campaignError.message });
      }
    }

    console.log('[CRON] Recurring campaigns check complete');

    return NextResponse.json({ 
      success: true,
      message: 'Recurring campaigns processed',
      processed: results.length,
      results
    });

  } catch (error: any) {
    console.error('[CRON] Fatal error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
