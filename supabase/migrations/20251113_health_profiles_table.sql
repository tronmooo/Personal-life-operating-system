-- Health Profiles Table for Demographics
-- Stores user health profile information and demographics

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Health Profiles Table
CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Demographics
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say', 'other')),
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
  
  -- Physical Stats
  height_cm NUMERIC(5, 2), -- e.g., 175.50 cm
  height_ft INTEGER,
  height_in INTEGER,
  target_weight_kg NUMERIC(5, 2),
  target_weight_lbs NUMERIC(5, 2),
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Medical Information
  primary_physician TEXT,
  physician_phone TEXT,
  physician_email TEXT,
  medical_record_number TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_group_number TEXT,
  
  -- Allergies (stored as array for quick access)
  known_allergies TEXT[],
  
  -- Conditions (stored as array for quick access)
  chronic_conditions TEXT[],
  
  -- Preferences
  preferred_pharmacy TEXT,
  pharmacy_phone TEXT,
  pharmacy_address TEXT,
  
  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own health profile"
  ON health_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health profile"
  ON health_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health profile"
  ON health_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health profile"
  ON health_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON health_profiles(user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_health_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_health_profiles_timestamp
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_health_profiles_updated_at();

-- Comments
COMMENT ON TABLE health_profiles IS 'User health profiles with demographics and medical information';
COMMENT ON COLUMN health_profiles.date_of_birth IS 'User date of birth for age calculations';
COMMENT ON COLUMN health_profiles.gender IS 'User gender identity';
COMMENT ON COLUMN health_profiles.blood_type IS 'Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-, unknown)';
COMMENT ON COLUMN health_profiles.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN health_profiles.target_weight_kg IS 'Target weight goal in kilograms';


