-- Create proactive_insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS proactive_insights (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('warning', 'opportunity', 'achievement', 'prediction', 'anomaly', 'reminder', 'trend', 'tip')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action JSONB,
  data JSONB,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proactive_insights_user_id ON proactive_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_dismissed ON proactive_insights(dismissed);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_priority ON proactive_insights(priority);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_expires_at ON proactive_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_type ON proactive_insights(type);

-- Enable RLS
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own insights"
  ON proactive_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON proactive_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights"
  ON proactive_insights
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can delete insights"
  ON proactive_insights
  FOR DELETE
  USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proactive_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proactive_insights_updated_at_trigger
BEFORE UPDATE ON proactive_insights
FOR EACH ROW
EXECUTE FUNCTION update_proactive_insights_updated_at();

-- Function to clean up expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM proactive_insights
  WHERE expires_at < NOW()
    AND dismissed = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE proactive_insights IS 'Stores AI-generated proactive insights for users';
COMMENT ON FUNCTION cleanup_expired_insights IS 'Cleans up expired and dismissed insights';


































