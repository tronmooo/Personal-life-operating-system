-- ============================================================================
-- CRITICAL FIX: Create Missing Domain Tables
-- Date: 2025-10-29
-- Issue: Hooks are querying tables that don't exist!
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. HEALTH_METRICS TABLE
-- ============================================================================
-- Referenced by: lib/hooks/use-health-metrics.ts
-- Fields expected: metric_type, recorded_at, value, secondary_value, unit, metadata

CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL, -- e.g., 'blood_pressure', 'weight', 'glucose', 'heart_rate', 'steps'
  recorded_at TIMESTAMPTZ NOT NULL,
  value NUMERIC, -- Primary value (e.g., weight, glucose level, steps)
  secondary_value NUMERIC, -- Secondary value (e.g., diastolic BP)
  unit TEXT, -- e.g., 'lbs', 'kg', 'mg/dL', 'bpm', 'steps'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_metric_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at DESC);
CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type);

-- Enable RLS
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health metrics"
  ON health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics"
  ON health_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics"
  ON health_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics"
  ON health_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_health_metrics_updated_at
  BEFORE UPDATE ON health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. INSURANCE_POLICIES TABLE
-- ============================================================================
-- Referenced by: lib/hooks/use-insurance.ts
-- Fields expected: provider, policy_number, type, premium, starts_on, ends_on, coverage, metadata

CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- Insurance company name
  policy_number TEXT NOT NULL,
  type TEXT, -- e.g., 'health', 'auto', 'home', 'life', 'dental'
  premium NUMERIC, -- Monthly/annual premium
  starts_on DATE,
  ends_on DATE,
  coverage JSONB DEFAULT '{}'::jsonb, -- Coverage details
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_type ON insurance_policies(type);
CREATE INDEX idx_insurance_policies_ends_on ON insurance_policies(ends_on);

-- Enable RLS
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own insurance policies"
  ON insurance_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance policies"
  ON insurance_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance policies"
  ON insurance_policies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance policies"
  ON insurance_policies FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. INSURANCE_CLAIMS TABLE
-- ============================================================================
-- Referenced by: lib/hooks/use-insurance.ts
-- Fields expected: policy_id, status, amount, filed_on, resolved_on, details

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES insurance_policies(id) ON DELETE CASCADE NOT NULL,
  status TEXT, -- e.g., 'filed', 'pending', 'approved', 'denied', 'paid'
  amount NUMERIC,
  filed_on DATE NOT NULL,
  resolved_on DATE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_claims_user_id ON insurance_claims(user_id);
CREATE INDEX idx_insurance_claims_policy_id ON insurance_claims(policy_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_insurance_claims_filed_on ON insurance_claims(filed_on DESC);

-- Enable RLS
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own insurance claims"
  ON insurance_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance claims"
  ON insurance_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance claims"
  ON insurance_claims FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance claims"
  ON insurance_claims FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. PETS TABLE (if not exists from another migration)
-- ============================================================================
-- Note: This might already exist, so using IF NOT EXISTS

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- e.g., 'dog', 'cat', 'bird', etc.
  breed TEXT,
  birth_date DATE,
  weight NUMERIC,
  photo_url TEXT,
  microchip_number TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

-- Enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;

CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all created tables
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
FROM insurance_claims
UNION ALL
SELECT 
    'pets',
    COUNT(*)
FROM pets;

-- Show RLS policies
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('health_metrics', 'insurance_policies', 'insurance_claims', 'pets')
ORDER BY tablename, cmd;

-- ============================================================================
-- COMPLETE!
-- All missing domain tables created with:
-- - Proper column names matching hook expectations
-- - RLS policies for security
-- - Indexes for performance
-- - Updated_at triggers
-- ============================================================================

