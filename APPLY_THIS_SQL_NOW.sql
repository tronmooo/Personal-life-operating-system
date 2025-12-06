-- ============================================================================
-- 🚨 CRITICAL FIX: Apply This SQL NOW in Supabase Dashboard
-- ============================================================================
-- Problem: 3 tables are missing, causing data to show as zeros
-- Solution: Run this entire file in Supabase SQL Editor
-- Time: < 1 minute
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. HEALTH_METRICS TABLE (for /domains/health)
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  value NUMERIC,
  secondary_value NUMERIC,
  unit TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_metric_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at DESC);

ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health metrics" ON health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health metrics" ON health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health metrics" ON health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health metrics" ON health_metrics FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. INSURANCE_POLICIES TABLE (for /domains/insurance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  type TEXT,
  premium NUMERIC,
  starts_on DATE,
  ends_on DATE,
  coverage JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_type ON insurance_policies(type);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance policies" ON insurance_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance policies" ON insurance_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insurance policies" ON insurance_policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance policies" ON insurance_policies FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. INSURANCE_CLAIMS TABLE (for insurance claims tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES insurance_policies(id) ON DELETE CASCADE NOT NULL,
  status TEXT,
  amount NUMERIC,
  filed_on DATE NOT NULL,
  resolved_on DATE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_claims_user_id ON insurance_claims(user_id);
CREATE INDEX idx_insurance_claims_policy_id ON insurance_claims(policy_id);

ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance claims" ON insurance_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance claims" ON insurance_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insurance claims" ON insurance_claims FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance claims" ON insurance_claims FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION: Check tables were created
-- ============================================================================
SELECT 
    'health_metrics' as table_name,
    COUNT(*) as record_count
FROM health_metrics
UNION ALL
SELECT 
    'insurance_policies',
    COUNT(*)
FROM insurance_policies
UNION ALL
SELECT 
    'insurance_claims',
    COUNT(*)
FROM insurance_claims;

-- ============================================================================
-- ✅ DONE! Tables created successfully!
-- Now test by adding health metrics or insurance policies via the UI
-- ============================================================================

