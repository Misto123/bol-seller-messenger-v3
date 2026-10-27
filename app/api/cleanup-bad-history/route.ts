import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * Delete message logs with incorrect seller name "Bekijk extra partnervoorwaarden"
 * This cleans up the database from entries created when the scraper was broken
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 });
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Delete all entries with the broken seller name
    const { data, error, count } = await client
      .from('message_logs')
      .delete({ count: 'exact' })
      .eq('shop_name', 'Bekijk extra partnervoorwaarden');

    if (error) {
      console.error('[Cleanup API] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log(`[Cleanup API] Deleted ${count} bad entries`);

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `Cleaned up ${count} entries with incorrect seller name`
    });

  } catch (error: any) {
    console.error('[Cleanup API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
