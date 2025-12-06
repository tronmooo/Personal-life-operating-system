-- Create calendar_sync_log table to track Google Calendar syncs
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- 'health', 'vehicles', 'pets', etc.
  domain_record_id TEXT NOT NULL, -- ID of the record in the domain table
  google_event_id TEXT NOT NULL, -- Google Calendar event ID
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX idx_calendar_sync_user_id ON calendar_sync_log(user_id);
CREATE INDEX idx_calendar_sync_domain_record ON calendar_sync_log(domain, domain_record_id);
CREATE INDEX idx_calendar_sync_google_event ON calendar_sync_log(google_event_id);
CREATE INDEX idx_calendar_sync_synced_at ON calendar_sync_log(synced_at DESC);

-- Enable RLS
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sync logs"
  ON calendar_sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON calendar_sync_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs"
  ON calendar_sync_log
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync logs"
  ON calendar_sync_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_calendar_sync_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_sync_log_updated_at
  BEFORE UPDATE ON calendar_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_sync_log_updated_at();

-- Grant permissions
GRANT ALL ON calendar_sync_log TO authenticated;
GRANT SELECT ON calendar_sync_log TO anon;










































