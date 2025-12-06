-- Create appliances table
CREATE TABLE IF NOT EXISTS appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC DEFAULT 0,
  expected_lifespan INTEGER DEFAULT 10,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appliance_maintenance table
CREATE TABLE IF NOT EXISTS appliance_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  date DATE NOT NULL,
  provider TEXT,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appliance_costs table
CREATE TABLE IF NOT EXISTS appliance_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appliance_warranties table
CREATE TABLE IF NOT EXISTS appliance_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  warranty_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  coverage_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appliances_user_id ON appliances(user_id);
CREATE INDEX IF NOT EXISTS idx_appliance_maintenance_appliance_id ON appliance_maintenance(appliance_id);
CREATE INDEX IF NOT EXISTS idx_appliance_costs_appliance_id ON appliance_costs(appliance_id);
CREATE INDEX IF NOT EXISTS idx_appliance_warranties_appliance_id ON appliance_warranties(appliance_id);

-- Enable Row Level Security
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_warranties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appliances
CREATE POLICY "Users can view their own appliances"
  ON appliances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appliances"
  ON appliances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appliances"
  ON appliances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appliances"
  ON appliances FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for appliance_maintenance
CREATE POLICY "Users can view maintenance for their appliances"
  ON appliance_maintenance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert maintenance for their appliances"
  ON appliance_maintenance FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can update maintenance for their appliances"
  ON appliance_maintenance FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete maintenance for their appliances"
  ON appliance_maintenance FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance.appliance_id
    AND appliances.user_id = auth.uid()
  ));

-- RLS Policies for appliance_costs
CREATE POLICY "Users can view costs for their appliances"
  ON appliance_costs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert costs for their appliances"
  ON appliance_costs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can update costs for their appliances"
  ON appliance_costs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete costs for their appliances"
  ON appliance_costs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs.appliance_id
    AND appliances.user_id = auth.uid()
  ));

-- RLS Policies for appliance_warranties
CREATE POLICY "Users can view warranties for their appliances"
  ON appliance_warranties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert warranties for their appliances"
  ON appliance_warranties FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can update warranties for their appliances"
  ON appliance_warranties FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties.appliance_id
    AND appliances.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete warranties for their appliances"
  ON appliance_warranties FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties.appliance_id
    AND appliances.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_appliances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appliances_updated_at
  BEFORE UPDATE ON appliances
  FOR EACH ROW
  EXECUTE FUNCTION update_appliances_updated_at();

