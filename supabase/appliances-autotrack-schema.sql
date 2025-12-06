-- Appliances Table
CREATE TABLE IF NOT EXISTS appliances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  "serialNumber" TEXT,
  "purchaseDate" DATE NOT NULL,
  "purchasePrice" NUMERIC(10, 2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'Good',
  "estimatedLifespan" INTEGER NOT NULL DEFAULT 10,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appliance Maintenance Table
CREATE TABLE IF NOT EXISTS appliance_maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "applianceId" UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  "serviceType" TEXT NOT NULL,
  date DATE NOT NULL,
  provider TEXT,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appliance Costs Table
CREATE TABLE IF NOT EXISTS appliance_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "applianceId" UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  "costType" TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appliance Warranties Table
CREATE TABLE IF NOT EXISTS appliance_warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "applianceId" UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  "warrantyName" TEXT NOT NULL,
  provider TEXT NOT NULL,
  "expiryDate" DATE NOT NULL,
  "coverageDetails" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appliances_user_id ON appliances("userId");
CREATE INDEX IF NOT EXISTS idx_appliance_maintenance_appliance_id ON appliance_maintenance("applianceId");
CREATE INDEX IF NOT EXISTS idx_appliance_costs_appliance_id ON appliance_costs("applianceId");
CREATE INDEX IF NOT EXISTS idx_appliance_warranties_appliance_id ON appliance_warranties("applianceId");

-- Row Level Security (RLS)
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_warranties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appliances
CREATE POLICY "Users can view their own appliances"
  ON appliances FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can insert their own appliances"
  ON appliances FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can update their own appliances"
  ON appliances FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can delete their own appliances"
  ON appliances FOR DELETE
  USING (auth.uid()::TEXT = "userId");

-- RLS Policies for appliance_maintenance
CREATE POLICY "Users can view their own appliance maintenance"
  ON appliance_maintenance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can insert their own appliance maintenance"
  ON appliance_maintenance FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can update their own appliance maintenance"
  ON appliance_maintenance FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can delete their own appliance maintenance"
  ON appliance_maintenance FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_maintenance."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

-- RLS Policies for appliance_costs
CREATE POLICY "Users can view their own appliance costs"
  ON appliance_costs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can insert their own appliance costs"
  ON appliance_costs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can update their own appliance costs"
  ON appliance_costs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can delete their own appliance costs"
  ON appliance_costs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_costs."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

-- RLS Policies for appliance_warranties
CREATE POLICY "Users can view their own appliance warranties"
  ON appliance_warranties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can insert their own appliance warranties"
  ON appliance_warranties FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can update their own appliance warranties"
  ON appliance_warranties FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

CREATE POLICY "Users can delete their own appliance warranties"
  ON appliance_warranties FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM appliances
    WHERE appliances.id = appliance_warranties."applianceId"
    AND appliances."userId" = auth.uid()::TEXT
  ));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appliances_updated_at
  BEFORE UPDATE ON appliances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

















