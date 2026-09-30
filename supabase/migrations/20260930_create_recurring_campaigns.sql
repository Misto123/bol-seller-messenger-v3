-- Create recurring_campaigns table
CREATE TABLE IF NOT EXISTS recurring_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  interval_days INTEGER NOT NULL DEFAULT 7,
  end_date DATE,
  last_run_date TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT,
  last_run_results JSONB,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recurring_campaigns_enabled ON recurring_campaigns(enabled);
CREATE INDEX IF NOT EXISTS idx_recurring_campaigns_last_run ON recurring_campaigns(last_run_date);

-- Add RLS policies (optional, for security)
ALTER TABLE recurring_campaigns ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for now" ON recurring_campaigns
  FOR ALL USING (true);

COMMENT ON TABLE recurring_campaigns IS 'Stores recurring campaign configurations';
COMMENT ON COLUMN recurring_campaigns.settings IS 'JSON object containing all campaign settings (keywords, templates, etc)';
