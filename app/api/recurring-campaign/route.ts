import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, enabled, interval_days, end_date, settings } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if a recurring campaign already exists (upsert by name or create new)
    const { data: existing } = await supabase
      .from('recurring_campaigns')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('recurring_campaigns')
        .update({
          enabled,
          interval_days,
          end_date,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating recurring campaign:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: existing.id });
    } else {
      // Create new
      const { data, error } = await supabase
        .from('recurring_campaigns')
        .insert({
          name,
          enabled,
          interval_days,
          end_date,
          settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring campaign:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: data.id });
    }
  } catch (error: any) {
    console.error('Error in recurring-campaign API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('recurring_campaigns')
      .select('*')
      .eq('enabled', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
