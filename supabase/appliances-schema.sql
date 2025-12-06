-- =====================================================
-- APPLIANCES DOMAIN - COMPREHENSIVE SCHEMA
-- =====================================================
-- This schema supports complete appliance lifecycle tracking,
-- predictive maintenance, and sell/hold/keep recommendations
-- =====================================================

-- 1. APPLIANCES TABLE
CREATE TABLE IF NOT EXISTS appliances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Kitchen - Major', 'Kitchen - Small', 'Laundry', 'HVAC', 
    'Water', 'Climate', 'Entertainment', 'Outdoor', 'Other'
  )),
  brand TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(10, 2),
  purchase_location TEXT,
  expected_lifespan INTEGER, -- in years
  current_status TEXT NOT NULL DEFAULT 'Working' CHECK (current_status IN (
    'Working', 'Needs Repair', 'Under Warranty', 'Broken', 'Replaced'
  )),
  condition TEXT NOT NULL DEFAULT 'Good' CHECK (condition IN (
    'Excellent', 'Good', 'Fair', 'Poor'
  )),
  energy_star_rated BOOLEAN DEFAULT false,
  energy_usage_per_year NUMERIC(10, 2), -- kWh/year
  location_in_home TEXT,
  installation_date DATE,
  installed_by TEXT,
  warranty_expiration DATE,
  warranty_type TEXT CHECK (warranty_type IN (
    'Manufacturer', 'Extended', 'Home Warranty', 'Service Contract'
  )),
  photos TEXT[], -- Array of photo URLs
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MAINTENANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS appliance_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  appliance_name TEXT, -- denormalized for quick access
  service_type TEXT NOT NULL CHECK (service_type IN (
    'Routine Maintenance', 'Repair', 'Inspection', 'Cleaning', 
    'Filter Change', 'Deep Clean', 'Descaling', 'Calibration', 'Other'
  )),
  service_date DATE NOT NULL,
  due_date DATE,
  frequency TEXT, -- e.g., "Monthly", "Quarterly", "Annually"
  last_service_date DATE,
  next_due_date DATE,
  service_provider TEXT,
  service_cost NUMERIC(10, 2),
  parts_replaced TEXT[], -- Array of part names
  parts_cost NUMERIC(10, 2),
  labor_cost NUMERIC(10, 2),
  service_description TEXT,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN (
    'Completed', 'Scheduled', 'Overdue', 'Skipped'
  )),
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  invoice_document TEXT, -- URL or file path
  photos TEXT[],
  warranty_claim BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REPAIR ISSUES TABLE
CREATE TABLE IF NOT EXISTS appliance_repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  appliance_name TEXT,
  issue_date DATE NOT NULL,
  issue_description TEXT NOT NULL,
  symptom TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('Minor', 'Moderate', 'Major', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Reported' CHECK (status IN (
    'Reported', 'Diagnosed', 'In Repair', 'Completed', 'Unresolved'
  )),
  repair_date DATE,
  repair_cost NUMERIC(10, 2),
  technician TEXT,
  diagnosis TEXT,
  solution_applied TEXT,
  parts_replaced TEXT[],
  parts_cost NUMERIC(10, 2),
  labor_cost NUMERIC(10, 2),
  under_warranty BOOLEAN DEFAULT false,
  warranty_coverage NUMERIC(10, 2),
  out_of_pocket_cost NUMERIC(10, 2),
  downtime_days INTEGER,
  invoice_document TEXT,
  photos TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APPLIANCE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS appliance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'User Manual', 'Installation Guide', 'Warranty', 'Receipt', 
    'Spec Sheet', 'Energy Guide', 'Other'
  )),
  document_name TEXT NOT NULL,
  document_date DATE,
  file_url TEXT,
  file_attachment TEXT,
  external_url TEXT,
  language TEXT DEFAULT 'English',
  version TEXT,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SERVICE PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS appliance_service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  technician_name TEXT,
  service_type TEXT[], -- Array of service types
  specializes_in TEXT[], -- brands, appliance types
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  service_area TEXT,
  hours_of_operation TEXT,
  response_time TEXT,
  warranty_work BOOLEAN DEFAULT false,
  insured BOOLEAN DEFAULT false,
  license_number TEXT,
  last_service_date DATE,
  services_performed_count INTEGER DEFAULT 0,
  average_cost NUMERIC(10, 2),
  rating NUMERIC(2, 1) CHECK (rating >= 1 AND rating <= 5),
  would_use_again TEXT CHECK (would_use_again IN ('Yes', 'No', 'Maybe')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. WARRANTIES TABLE
CREATE TABLE IF NOT EXISTS appliance_warranties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  appliance_name TEXT,
  warranty_type TEXT NOT NULL CHECK (warranty_type IN (
    'Manufacturer', 'Extended', 'Home Warranty', 'Service Contract'
  )),
  provider TEXT,
  policy_number TEXT,
  coverage_start_date DATE,
  coverage_end_date DATE,
  coverage_term INTEGER, -- years
  coverage_details TEXT,
  coverage_exclusions TEXT,
  deductible NUMERIC(10, 2),
  service_fee NUMERIC(10, 2),
  original_cost NUMERIC(10, 2),
  claim_limit NUMERIC(10, 2),
  claims_filed INTEGER DEFAULT 0,
  transferable BOOLEAN DEFAULT false,
  cancellation_terms TEXT,
  contact_info TEXT,
  claim_process TEXT,
  warranty_document TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
  auto_renewal BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ENERGY TRACKING TABLE
CREATE TABLE IF NOT EXISTS appliance_energy_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  appliance_name TEXT,
  month TEXT NOT NULL, -- YYYY-MM format
  energy_used NUMERIC(10, 2), -- kWh
  estimated_cost NUMERIC(10, 2),
  usage_frequency TEXT,
  efficiency_rating TEXT,
  compared_to_previous NUMERIC(5, 2), -- percentage
  compared_to_average NUMERIC(5, 2), -- percentage
  anomalies_detected TEXT[],
  cost_savings NUMERIC(10, 2),
  environmental_impact NUMERIC(10, 2), -- CO2 saved
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appliance_id, month)
);

-- 8. REPLACEMENT PLANNING TABLE
CREATE TABLE IF NOT EXISTS appliance_replacement_planning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  appliance_name TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  reason TEXT NOT NULL CHECK (reason IN (
    'End of Life', 'Inefficient', 'Broken Beyond Repair', 
    'Upgrade Desired', 'Safety Concerns', 'Other'
  )),
  target_date DATE,
  budget_allocated NUMERIC(10, 2),
  researching_models TEXT[],
  preferred_brand TEXT,
  preferred_model TEXT,
  features_desired TEXT[],
  energy_efficiency_target TEXT,
  estimated_cost NUMERIC(10, 2),
  savings_needed NUMERIC(10, 2),
  disposal_plan TEXT CHECK (disposal_plan IN (
    'Donate', 'Recycle', 'Junk', 'Sell', 'Keep as Spare'
  )),
  installation_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN (
    'Planning', 'Budgeting', 'Researching', 'Ready to Buy', 'Purchased'
  )),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appliance_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appliances_user_id ON appliances(user_id);
CREATE INDEX IF NOT EXISTS idx_appliances_category ON appliances(category);
CREATE INDEX IF NOT EXISTS idx_appliances_status ON appliances(current_status);
CREATE INDEX IF NOT EXISTS idx_appliances_warranty_exp ON appliances(warranty_expiration);

CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON appliance_maintenance(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_appliance_id ON appliance_maintenance(appliance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_due ON appliance_maintenance(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON appliance_maintenance(status);

CREATE INDEX IF NOT EXISTS idx_repairs_user_id ON appliance_repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_repairs_appliance_id ON appliance_repairs(appliance_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON appliance_repairs(status);

CREATE INDEX IF NOT EXISTS idx_documents_appliance_id ON appliance_documents(appliance_id);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON appliance_service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_appliance_id ON appliance_warranties(appliance_id);
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON appliance_warranties(coverage_end_date);
CREATE INDEX IF NOT EXISTS idx_energy_appliance_month ON appliance_energy_tracking(appliance_id, month);
CREATE INDEX IF NOT EXISTS idx_replacement_user_id ON appliance_replacement_planning(user_id);
CREATE INDEX IF NOT EXISTS idx_replacement_priority ON appliance_replacement_planning(priority);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_energy_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_replacement_planning ENABLE ROW LEVEL SECURITY;

-- Appliances policies
CREATE POLICY "Users can view their own appliances" ON appliances
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own appliances" ON appliances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own appliances" ON appliances
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own appliances" ON appliances
  FOR DELETE USING (auth.uid() = user_id);

-- Maintenance policies
CREATE POLICY "Users can view their own maintenance records" ON appliance_maintenance
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own maintenance records" ON appliance_maintenance
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own maintenance records" ON appliance_maintenance
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own maintenance records" ON appliance_maintenance
  FOR DELETE USING (auth.uid() = user_id);

-- Repairs policies
CREATE POLICY "Users can view their own repair records" ON appliance_repairs
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own repair records" ON appliance_repairs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own repair records" ON appliance_repairs
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own repair records" ON appliance_repairs
  FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own appliance documents" ON appliance_documents
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own appliance documents" ON appliance_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own appliance documents" ON appliance_documents
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own appliance documents" ON appliance_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Service providers policies
CREATE POLICY "Users can view their own service providers" ON appliance_service_providers
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own service providers" ON appliance_service_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own service providers" ON appliance_service_providers
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own service providers" ON appliance_service_providers
  FOR DELETE USING (auth.uid() = user_id);

-- Warranties policies
CREATE POLICY "Users can view their own warranties" ON appliance_warranties
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own warranties" ON appliance_warranties
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own warranties" ON appliance_warranties
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own warranties" ON appliance_warranties
  FOR DELETE USING (auth.uid() = user_id);

-- Energy tracking policies
CREATE POLICY "Users can view their own energy tracking" ON appliance_energy_tracking
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own energy tracking" ON appliance_energy_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own energy tracking" ON appliance_energy_tracking
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own energy tracking" ON appliance_energy_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Replacement planning policies
CREATE POLICY "Users can view their own replacement plans" ON appliance_replacement_planning
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own replacement plans" ON appliance_replacement_planning
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own replacement plans" ON appliance_replacement_planning
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own replacement plans" ON appliance_replacement_planning
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appliances_updated_at BEFORE UPDATE ON appliances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON appliance_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON appliance_repairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON appliance_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON appliance_service_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warranties_updated_at BEFORE UPDATE ON appliance_warranties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_energy_updated_at BEFORE UPDATE ON appliance_energy_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_replacement_updated_at BEFORE UPDATE ON appliance_replacement_planning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

















