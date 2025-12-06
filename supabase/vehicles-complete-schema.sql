-- Complete Vehicles Domain Schema
-- Supports multiple vehicles with full tracking

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS vehicle_warranties CASCADE;
DROP TABLE IF EXISTS vehicle_costs CASCADE;
DROP TABLE IF EXISTS vehicle_maintenance CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "vehicleName" TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  "currentMileage" INTEGER DEFAULT 0,
  "estimatedValue" NUMERIC(10,2) DEFAULT 0,
  "purchasePrice" NUMERIC(10,2) DEFAULT 0,
  "purchaseDate" DATE,
  "lifeExpectancy" INTEGER DEFAULT 15, -- in years
  "monthlyInsurance" NUMERIC(10,2) DEFAULT 0,
  color TEXT,
  "licensePlate" TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold')),
  notes TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Maintenance table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "vehicleId" UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  "maintenanceType" TEXT NOT NULL, -- 'oil_change', 'tire_rotation', 'brake_service', etc.
  "serviceName" TEXT NOT NULL,
  "lastServiceMileage" INTEGER,
  "lastServiceDate" DATE,
  "nextServiceMileage" INTEGER,
  "nextServiceDate" DATE,
  "intervalMiles" INTEGER, -- miles between services
  "intervalMonths" INTEGER, -- months between services
  cost NUMERIC(10,2) DEFAULT 0,
  provider TEXT,
  notes TEXT,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'due_soon', 'overdue', 'upcoming')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Costs table
CREATE TABLE IF NOT EXISTS vehicle_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "vehicleId" UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  "costType" TEXT NOT NULL CHECK ("costType" IN ('fuel', 'maintenance', 'insurance', 'registration', 'repair', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER,
  description TEXT,
  vendor TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Warranties table
CREATE TABLE IF NOT EXISTS vehicle_warranties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "vehicleId" UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  "warrantyName" TEXT NOT NULL,
  provider TEXT NOT NULL,
  "warrantyType" TEXT, -- 'powertrain', 'battery', 'comprehensive', 'extended', etc.
  "startDate" DATE,
  "expiryDate" DATE,
  "coverageMiles" INTEGER,
  "coverageDescription" TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles("userId");
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles("userId", status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance("vehicleId");
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_status ON vehicle_maintenance("vehicleId", status);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_vehicle_id ON vehicle_costs("vehicleId");
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_date ON vehicle_costs("vehicleId", date);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_type ON vehicle_costs("vehicleId", "costType");
CREATE INDEX IF NOT EXISTS idx_vehicle_warranties_vehicle_id ON vehicle_warranties("vehicleId");
CREATE INDEX IF NOT EXISTS idx_vehicle_warranties_status ON vehicle_warranties("vehicleId", status);

-- Row Level Security (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_warranties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
  CREATE POLICY "Users can view their own vehicles"
    ON vehicles FOR SELECT
    USING (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
  CREATE POLICY "Users can insert their own vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
  CREATE POLICY "Users can update their own vehicles"
    ON vehicles FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
  CREATE POLICY "Users can delete their own vehicles"
    ON vehicles FOR DELETE
    USING (auth.uid() = "userId");
END $$;

-- RLS Policies for vehicle_maintenance
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own vehicle maintenance" ON vehicle_maintenance;
  CREATE POLICY "Users can view their own vehicle maintenance"
    ON vehicle_maintenance FOR SELECT
    USING (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can insert their own vehicle maintenance" ON vehicle_maintenance;
  CREATE POLICY "Users can insert their own vehicle maintenance"
    ON vehicle_maintenance FOR INSERT
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can update their own vehicle maintenance" ON vehicle_maintenance;
  CREATE POLICY "Users can update their own vehicle maintenance"
    ON vehicle_maintenance FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can delete their own vehicle maintenance" ON vehicle_maintenance;
  CREATE POLICY "Users can delete their own vehicle maintenance"
    ON vehicle_maintenance FOR DELETE
    USING (auth.uid() = "userId");
END $$;

-- RLS Policies for vehicle_costs
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own vehicle costs" ON vehicle_costs;
  CREATE POLICY "Users can view their own vehicle costs"
    ON vehicle_costs FOR SELECT
    USING (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can insert their own vehicle costs" ON vehicle_costs;
  CREATE POLICY "Users can insert their own vehicle costs"
    ON vehicle_costs FOR INSERT
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can update their own vehicle costs" ON vehicle_costs;
  CREATE POLICY "Users can update their own vehicle costs"
    ON vehicle_costs FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can delete their own vehicle costs" ON vehicle_costs;
  CREATE POLICY "Users can delete their own vehicle costs"
    ON vehicle_costs FOR DELETE
    USING (auth.uid() = "userId");
END $$;

-- RLS Policies for vehicle_warranties
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own vehicle warranties" ON vehicle_warranties;
  CREATE POLICY "Users can view their own vehicle warranties"
    ON vehicle_warranties FOR SELECT
    USING (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can insert their own vehicle warranties" ON vehicle_warranties;
  CREATE POLICY "Users can insert their own vehicle warranties"
    ON vehicle_warranties FOR INSERT
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can update their own vehicle warranties" ON vehicle_warranties;
  CREATE POLICY "Users can update their own vehicle warranties"
    ON vehicle_warranties FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");
    
  DROP POLICY IF EXISTS "Users can delete their own vehicle warranties" ON vehicle_warranties;
  CREATE POLICY "Users can delete their own vehicle warranties"
    ON vehicle_warranties FOR DELETE
    USING (auth.uid() = "userId");
END $$;

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_vehicle_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_vehicle_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_vehicle_warranties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

DROP TRIGGER IF EXISTS trigger_vehicle_maintenance_updated_at ON vehicle_maintenance;
CREATE TRIGGER trigger_vehicle_maintenance_updated_at
  BEFORE UPDATE ON vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_maintenance_updated_at();

DROP TRIGGER IF EXISTS trigger_vehicle_costs_updated_at ON vehicle_costs;
CREATE TRIGGER trigger_vehicle_costs_updated_at
  BEFORE UPDATE ON vehicle_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_costs_updated_at();

DROP TRIGGER IF EXISTS trigger_vehicle_warranties_updated_at ON vehicle_warranties;
CREATE TRIGGER trigger_vehicle_warranties_updated_at
  BEFORE UPDATE ON vehicle_warranties
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_warranties_updated_at();

-- Comments
COMMENT ON TABLE vehicles IS 'Stores user vehicles with tracking information';
COMMENT ON TABLE vehicle_maintenance IS 'Tracks maintenance schedules and history for vehicles';
COMMENT ON TABLE vehicle_costs IS 'Tracks all costs associated with vehicles';
COMMENT ON TABLE vehicle_warranties IS 'Stores warranty and coverage information for vehicles';

















