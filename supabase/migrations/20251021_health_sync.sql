-- Health sync connections and logs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Per-user health provider connection + toggles
CREATE TABLE IF NOT EXISTS health_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('google_fit','apple_health')) NOT NULL,
  scope TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{"steps":true,"workouts":true,"sleep":true,"weight":true,"heart_rate":true,"blood_pressure":true,"calories":true}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_health_connections_user ON health_connections(user_id);

ALTER TABLE health_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own health connections" ON health_connections;
CREATE POLICY "Users select own health connections" ON health_connections FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users upsert own health connections" ON health_connections;
CREATE POLICY "Users upsert own health connections" ON health_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own health connections" ON health_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sync run logs
CREATE TABLE IF NOT EXISTS health_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('success','error')),
  error_message TEXT,
  rows_ingested INTEGER DEFAULT 0,
  time_window_start TIMESTAMPTZ,
  time_window_end TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_health_sync_log_user ON health_sync_log(user_id);
ALTER TABLE health_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own health sync log" ON health_sync_log;
CREATE POLICY "Users select own health sync log" ON health_sync_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own health sync log" ON health_sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);


