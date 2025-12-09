-- Personal AI Calling Assistant Schema
-- Created: 2025-11-27
-- Comprehensive task-based phone calling system

-- ===========================================
-- CONTACTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX contacts_user_id_phone_idx ON contacts(user_id, phone_number);
CREATE INDEX contacts_name_idx ON contacts(name);

-- ===========================================
-- ASSISTANT SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_auto_approve_amount DECIMAL(10, 2) DEFAULT 100.00,
  require_approval_over_amount DECIMAL(10, 2) DEFAULT 500.00,
  default_call_tone TEXT DEFAULT 'friendly', -- friendly, neutral, firm, assertive
  allowed_auth_fields JSONB DEFAULT '{"can_share_last4_ssn": false, "can_share_birthdate": true}'::jsonb,
  forbidden_phrases TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_retry_failed_calls BOOLEAN DEFAULT false,
  max_retry_attempts INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_tone CHECK (default_call_tone IN ('friendly', 'neutral', 'firm', 'assertive'))
);

-- ===========================================
-- CALL TASKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS call_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_instruction TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  priority TEXT DEFAULT 'normal',
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  target_phone_number TEXT,
  tone TEXT,
  max_price DECIMAL(10, 2),
  hard_constraints JSONB DEFAULT '{}'::jsonb,
  soft_preferences JSONB DEFAULT '{}'::jsonb,
  needs_user_confirmation BOOLEAN DEFAULT false,
  ai_plan JSONB,
  summary TEXT,
  failure_reason TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'preparing', 'waiting_for_user', 'ready_to_call', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT valid_task_tone CHECK (tone IS NULL OR tone IN ('friendly', 'neutral', 'firm', 'assertive'))
);

CREATE INDEX call_tasks_user_status_idx ON call_tasks(user_id, status);
CREATE INDEX call_tasks_created_at_idx ON call_tasks(created_at DESC);
CREATE INDEX call_tasks_priority_idx ON call_tasks(priority) WHERE status NOT IN ('completed', 'cancelled');

-- ===========================================
-- CALL SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_task_id UUID NOT NULL REFERENCES call_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_provider_call_id TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_session_status CHECK (status IN ('initiated', 'ringing', 'connected', 'failed', 'completed', 'cancelled'))
);

CREATE INDEX call_sessions_task_id_idx ON call_sessions(call_task_id);
CREATE INDEX call_sessions_user_id_idx ON call_sessions(user_id);
CREATE INDEX call_sessions_provider_id_idx ON call_sessions(call_provider_call_id);
CREATE INDEX call_sessions_status_idx ON call_sessions(status);

-- ===========================================
-- CALL TRANSCRIPTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL UNIQUE REFERENCES call_sessions(id) ON DELETE CASCADE,
  full_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX call_transcripts_session_id_idx ON call_transcripts(call_session_id);

-- ===========================================
-- CALL TRANSCRIPT SEGMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS call_transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_transcript_id UUID NOT NULL REFERENCES call_transcripts(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  start_time_ms INTEGER NOT NULL,
  end_time_ms INTEGER NOT NULL,
  text TEXT NOT NULL,
  sentiment TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_speaker CHECK (speaker IN ('assistant', 'human', 'system')),
  CONSTRAINT valid_sentiment CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative', 'mixed'))
);

CREATE INDEX call_transcript_segments_transcript_id_idx ON call_transcript_segments(call_transcript_id);
CREATE INDEX call_transcript_segments_time_idx ON call_transcript_segments(call_transcript_id, start_time_ms);

-- ===========================================
-- CALL EXTRACTED DATA TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS call_extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  value_type TEXT DEFAULT 'string',
  raw_fragment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_value_type CHECK (value_type IN ('string', 'number', 'datetime', 'boolean', 'json'))
);

CREATE INDEX call_extracted_data_session_id_idx ON call_extracted_data(call_session_id);
CREATE INDEX call_extracted_data_key_idx ON call_extracted_data(call_session_id, key);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_extracted_data ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Assistant settings policies
CREATE POLICY "Users can manage their own assistant settings"
  ON assistant_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Call tasks policies
CREATE POLICY "Users can manage their own call tasks"
  ON call_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Call sessions policies
CREATE POLICY "Users can view their own call sessions"
  ON call_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert call sessions"
  ON call_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update call sessions"
  ON call_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Call transcripts policies
CREATE POLICY "Users can view transcripts of their calls"
  ON call_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_transcripts.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage transcripts"
  ON call_transcripts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_transcripts.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_transcripts.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  );

-- Transcript segments policies
CREATE POLICY "Users can view segments of their call transcripts"
  ON call_transcript_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM call_transcripts
      JOIN call_sessions ON call_sessions.id = call_transcripts.call_session_id
      WHERE call_transcripts.id = call_transcript_segments.call_transcript_id
      AND call_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage transcript segments"
  ON call_transcript_segments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM call_transcripts
      JOIN call_sessions ON call_sessions.id = call_transcripts.call_session_id
      WHERE call_transcripts.id = call_transcript_segments.call_transcript_id
      AND call_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_transcripts
      JOIN call_sessions ON call_sessions.id = call_transcripts.call_session_id
      WHERE call_transcripts.id = call_transcript_segments.call_transcript_id
      AND call_sessions.user_id = auth.uid()
    )
  );

-- Extracted data policies
CREATE POLICY "Users can view extracted data from their calls"
  ON call_extracted_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_extracted_data.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage extracted data"
  ON call_extracted_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_extracted_data.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_extracted_data.call_session_id
      AND call_sessions.user_id = auth.uid()
    )
  );

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personal_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_assistant_updated_at();

CREATE TRIGGER update_assistant_settings_updated_at
  BEFORE UPDATE ON assistant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_assistant_updated_at();

CREATE TRIGGER update_call_tasks_updated_at
  BEFORE UPDATE ON call_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_assistant_updated_at();

CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_assistant_updated_at();

CREATE TRIGGER update_call_transcripts_updated_at
  BEFORE UPDATE ON call_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_assistant_updated_at();

-- ===========================================
-- VIEWS FOR EASY QUERYING
-- ===========================================

-- View: call_tasks_with_sessions
-- Shows call tasks with their session counts and latest status
CREATE OR REPLACE VIEW call_tasks_with_sessions AS
SELECT 
  ct.*,
  COUNT(cs.id) AS session_count,
  MAX(cs.started_at) AS last_call_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', cs.id,
        'status', cs.status,
        'started_at', cs.started_at,
        'duration_seconds', cs.duration_seconds
      ) ORDER BY cs.started_at DESC
    ) FILTER (WHERE cs.id IS NOT NULL),
    '[]'::json
  ) AS sessions
FROM call_tasks ct
LEFT JOIN call_sessions cs ON cs.call_task_id = ct.id
GROUP BY ct.id;

-- View: call_sessions_with_data
-- Shows call sessions with extracted data
CREATE OR REPLACE VIEW call_sessions_with_data AS
SELECT 
  cs.*,
  ct.full_text AS transcript,
  COALESCE(
    json_object_agg(
      ced.key, 
      json_build_object('value', ced.value, 'type', ced.value_type, 'fragment', ced.raw_fragment)
    ) FILTER (WHERE ced.id IS NOT NULL),
    '{}'::json
  ) AS extracted_data
FROM call_sessions cs
LEFT JOIN call_transcripts ct ON ct.call_session_id = cs.id
LEFT JOIN call_extracted_data ced ON ced.call_session_id = cs.id
GROUP BY cs.id, ct.full_text;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE contacts IS 'People and businesses the AI may call on behalf of the user';
COMMENT ON TABLE assistant_settings IS 'Per-user configuration for the personal AI assistant';
COMMENT ON TABLE call_tasks IS 'To-do items that will result in phone calls';
COMMENT ON TABLE call_sessions IS 'Individual call attempts linked to call tasks';
COMMENT ON TABLE call_transcripts IS 'High-level transcript containers for call sessions';
COMMENT ON TABLE call_transcript_segments IS 'Fine-grain segments for UI playback and analysis';
COMMENT ON TABLE call_extracted_data IS 'Structured information extracted from calls (prices, dates, confirmations, etc.)';




























