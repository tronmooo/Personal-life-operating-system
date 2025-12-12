-- Digital Life Subscriptions Schema
-- Comprehensive subscription tracking with analytics support

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  service_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'streaming', 'software', 'ai_tools', 'productivity', 
    'cloud_storage', 'gaming', 'news', 'fitness', 'music', 'other'
  )),
  
  -- Pricing
  cost DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  frequency TEXT NOT NULL CHECK (frequency IN (
    'monthly', 'yearly', 'quarterly', 'weekly', 'daily'
  )),
  
  -- Status & Dates
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'trial', 'paused', 'cancelled'
  )),
  next_due_date DATE NOT NULL,
  start_date DATE,
  trial_end_date DATE,
  cancellation_date DATE,
  
  -- Payment & Account
  payment_method TEXT,
  last_four TEXT,
  account_url TEXT,
  account_email TEXT,
  
  -- Settings
  auto_renew BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3,
  
  -- Metadata
  icon_color TEXT,
  icon_letter TEXT,
  notes TEXT,
  tags TEXT[],
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_cost CHECK (cost >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due ON subscriptions(user_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(user_id, category);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

