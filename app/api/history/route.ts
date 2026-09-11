import { NextRequest, NextResponse } from 'next/server';
import { getMessageLogs, getMessageLogStats } from '@/lib/supabase-db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = getMessageLogs(limit, offset);
    const stats = getMessageLogStats();

    return NextResponse.json({
      success: true,
      logs,
      stats,
    });
  } catch (error: any) {
    console.error('[History API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      logs: [],
      stats: { total: 0, sent: 0, failed: 0, skipped: 0 }
    }, { status: 500 });
  }
}
