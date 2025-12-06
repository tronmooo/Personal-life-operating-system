-- AI Insights table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('financial','health','vehicles','home','relationships','goals','other')) DEFAULT 'other',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created ON insights(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON insights(priority);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own insights" ON insights;
CREATE POLICY "Users select own insights" ON insights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own insights" ON insights;
CREATE POLICY "Users insert own insights" ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own insights" ON insights;
CREATE POLICY "Users update own insights" ON insights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own insights" ON insights;
CREATE POLICY "Users delete own insights" ON insights FOR DELETE USING (auth.uid() = user_id);


