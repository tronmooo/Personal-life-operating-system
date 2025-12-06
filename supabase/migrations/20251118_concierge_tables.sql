-- AI Concierge Sessions and Calls Tables
-- Created: 2025-11-18

-- Table: concierge_sessions
-- Stores AI Concierge conversation sessions
CREATE TABLE IF NOT EXISTS concierge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  business_count INTEGER DEFAULT 3,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: concierge_calls
-- Stores individual phone calls made by the concierge
CREATE TABLE IF NOT EXISTS concierge_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES concierge_sessions(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  call_id TEXT,
  status TEXT DEFAULT 'initiated', -- initiated, in_progress, completed, failed
  error TEXT,
  quote_amount DECIMAL(10, 2),
  quote_details JSONB,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: concierge_quotes
-- Stores quotes received from calls
CREATE TABLE IF NOT EXISTS concierge_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES concierge_calls(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  amount DECIMAL(10, 2),
  details JSONB,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS concierge_sessions_user_id_idx ON concierge_sessions(user_id);
CREATE INDEX IF NOT EXISTS concierge_sessions_created_at_idx ON concierge_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS concierge_calls_session_id_idx ON concierge_calls(session_id);
CREATE INDEX IF NOT EXISTS concierge_calls_status_idx ON concierge_calls(status);
CREATE INDEX IF NOT EXISTS concierge_quotes_call_id_idx ON concierge_quotes(call_id);

-- Row Level Security (RLS)
ALTER TABLE concierge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own concierge sessions"
  ON concierge_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own concierge sessions"
  ON concierge_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own concierge sessions"
  ON concierge_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own concierge calls"
  ON concierge_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM concierge_sessions
      WHERE concierge_sessions.id = concierge_calls.session_id
      AND concierge_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own concierge calls"
  ON concierge_calls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM concierge_sessions
      WHERE concierge_sessions.id = concierge_calls.session_id
      AND concierge_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own concierge calls"
  ON concierge_calls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM concierge_sessions
      WHERE concierge_sessions.id = concierge_calls.session_id
      AND concierge_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own concierge quotes"
  ON concierge_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM concierge_calls
      JOIN concierge_sessions ON concierge_sessions.id = concierge_calls.session_id
      WHERE concierge_calls.id = concierge_quotes.call_id
      AND concierge_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own concierge quotes"
  ON concierge_quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM concierge_calls
      JOIN concierge_sessions ON concierge_sessions.id = concierge_calls.session_id
      WHERE concierge_calls.id = concierge_quotes.call_id
      AND concierge_sessions.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_concierge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_concierge_sessions_updated_at
  BEFORE UPDATE ON concierge_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_updated_at();

CREATE TRIGGER update_concierge_calls_updated_at
  BEFORE UPDATE ON concierge_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_updated_at();





