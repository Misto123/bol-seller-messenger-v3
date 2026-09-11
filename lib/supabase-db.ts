import { createClient } from '@supabase/supabase-js';

export interface MessageLog {
  id?: number;
  shop_name: string;
  product_title: string;
  keyword: string;
  message: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  screenshot_path: string | null;
  adspower_profile: string;
  ip_address: string | null;
  status: 'sent' | 'failed' | 'skipped';
  error_message: string | null;
  timestamp: string;
  created_at?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export async function insertMessageLog(log: MessageLog): Promise<number> {
  const client = getSupabase();
  
  if (!client) {
    console.error('[DB] Supabase not configured');
    return 0;
  }

  try {
    const { data, error } = await client
      .from('message_logs')
      .insert({
        shop_name: log.shop_name,
        product_title: log.product_title,
        keyword: log.keyword,
        message: log.message,
        subject: log.subject,
        sender_name: log.sender_name,
        sender_email: log.sender_email,
        sender_phone: log.sender_phone || null,
        screenshot_path: log.screenshot_path || null,
        adspower_profile: log.adspower_profile,
        ip_address: log.ip_address || null,
        status: log.status,
        error_message: log.error_message || null,
        timestamp: log.timestamp,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[DB] Insert error:', error);
      return 0;
    }

    console.log(`[DB] Message logged to Supabase (ID: ${data.id})`);
    return data.id;
  } catch (error: any) {
    console.error('[DB] Exception:', error.message);
    return 0;
  }
}

export async function getMessageLogs(limit: number = 100, offset: number = 0): Promise<MessageLog[]> {
  const client = getSupabase();
  
  if (!client) {
    console.error('[DB] Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await client
      .from('message_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[DB] Query error:', error);
      return [];
    }

    return data as MessageLog[];
  } catch (error: any) {
    console.error('[DB] Exception:', error.message);
    return [];
  }
}

export async function getMessageLogStats() {
  const client = getSupabase();
  
  if (!client) {
    console.error('[DB] Supabase not configured');
    return { total: 0, sent: 0, failed: 0, skipped: 0 };
  }

  try {
    // Get total count
    const { count: total } = await client
      .from('message_logs')
      .select('*', { count: 'exact', head: true });

    // Get sent count
    const { count: sent } = await client
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    // Get failed count
    const { count: failed } = await client
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get skipped count
    const { count: skipped } = await client
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'skipped');

    return {
      total: total || 0,
      sent: sent || 0,
      failed: failed || 0,
      skipped: skipped || 0,
    };
  } catch (error: any) {
    console.error('[DB] Stats error:', error.message);
    return { total: 0, sent: 0, failed: 0, skipped: 0 };
  }
}
