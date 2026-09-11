-- BOL Seller Messenger v3 - Supabase Schema

-- Message logs table
CREATE TABLE IF NOT EXISTS message_logs (
  id BIGSERIAL PRIMARY KEY,
  shop_name TEXT NOT NULL,
  product_title TEXT NOT NULL,
  keyword TEXT NOT NULL,
  message TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  screenshot_path TEXT,
  adspower_profile TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON message_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_keyword ON message_logs(keyword);

-- Enable Row Level Security (RLS)
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (adjust as needed for security)
CREATE POLICY "Allow all operations on message_logs" ON message_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Add comments for documentation
COMMENT ON TABLE message_logs IS 'Stores all sent/failed/skipped messages from BOL campaigns';
COMMENT ON COLUMN message_logs.shop_name IS 'Name of the shop/seller contacted';
COMMENT ON COLUMN message_logs.product_title IS 'Product title from BOL search';
COMMENT ON COLUMN message_logs.keyword IS 'Keyword used to find this seller';
COMMENT ON COLUMN message_logs.adspower_profile IS 'AdsPower profile ID used for this message';
COMMENT ON COLUMN message_logs.ip_address IS 'IP address of the browser session';
