-- Property and Vehicle Valuations + Recalls
-- Create tables with RLS and indexes

-- Enable UUID if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- property_value_history
CREATE TABLE IF NOT EXISTS property_value_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value DECIMAL(12,2) NOT NULL,
  source TEXT DEFAULT 'unknown',
  accuracy TEXT CHECK (accuracy IN ('high','medium','low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_value_history_user ON property_value_history(user_id);
CREATE INDEX IF NOT EXISTS idx_property_value_history_property ON property_value_history(property_id);
CREATE INDEX IF NOT EXISTS idx_property_value_history_date ON property_value_history(date);

ALTER TABLE property_value_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own property values" ON property_value_history;
CREATE POLICY "Users select own property values" ON property_value_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own property values" ON property_value_history;
CREATE POLICY "Users insert own property values" ON property_value_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own property values" ON property_value_history;
CREATE POLICY "Users update own property values" ON property_value_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own property values" ON property_value_history;
CREATE POLICY "Users delete own property values" ON property_value_history FOR DELETE USING (auth.uid() = user_id);

-- vehicle_value_history
CREATE TABLE IF NOT EXISTS vehicle_value_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value DECIMAL(12,2) NOT NULL,
  source TEXT DEFAULT 'unknown',
  mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_value_history_user ON vehicle_value_history(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_value_history_vehicle ON vehicle_value_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_value_history_date ON vehicle_value_history(date);

ALTER TABLE vehicle_value_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own vehicle values" ON vehicle_value_history;
CREATE POLICY "Users select own vehicle values" ON vehicle_value_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own vehicle values" ON vehicle_value_history;
CREATE POLICY "Users insert own vehicle values" ON vehicle_value_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own vehicle values" ON vehicle_value_history;
CREATE POLICY "Users update own vehicle values" ON vehicle_value_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own vehicle values" ON vehicle_value_history;
CREATE POLICY "Users delete own vehicle values" ON vehicle_value_history FOR DELETE USING (auth.uid() = user_id);

-- vehicle_recalls
CREATE TABLE IF NOT EXISTS vehicle_recalls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID NOT NULL,
  recall_id TEXT NOT NULL,
  description TEXT,
  severity TEXT,
  date_issued DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, recall_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_recalls_user ON vehicle_recalls(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_recalls_vehicle ON vehicle_recalls(vehicle_id);

ALTER TABLE vehicle_recalls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own vehicle recalls" ON vehicle_recalls;
CREATE POLICY "Users select own vehicle recalls" ON vehicle_recalls FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own vehicle recalls" ON vehicle_recalls;
CREATE POLICY "Users insert own vehicle recalls" ON vehicle_recalls FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own vehicle recalls" ON vehicle_recalls;
CREATE POLICY "Users delete own vehicle recalls" ON vehicle_recalls FOR DELETE USING (auth.uid() = user_id);


