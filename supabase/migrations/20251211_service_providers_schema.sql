-- Service Providers Schema
-- For Digital Life domain - tracks subscriptions, service providers, payments, documents

-- ============================================================
-- SERVICE PROVIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'insurance', 'utilities', 'telecom', 'financial', 'subscriptions', 'other'
  )),
  subcategory TEXT,
  
  -- Contact Info
  account_number TEXT,
  phone TEXT,
  website TEXT,
  
  -- Billing
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
  auto_pay_enabled BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  
  -- Metadata
  icon_color TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for service_providers
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(user_id, category);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(user_id, status);

-- ============================================================
-- SERVICE PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS service_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment Info
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_date DATE,
  
  -- Metadata
  notes TEXT,
  transaction_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for service_payments
CREATE INDEX IF NOT EXISTS idx_service_payments_user_id ON service_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_provider ON service_payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_due_date ON service_payments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_service_payments_status ON service_payments(user_id, status);

-- ============================================================
-- SERVICE DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS service_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document Info
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'policy', 'bill', 'receipt', 'other')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  
  -- Dates
  upload_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for service_documents
CREATE INDEX IF NOT EXISTS idx_service_documents_user_id ON service_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_service_documents_provider ON service_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_documents_expiry ON service_documents(user_id, expiry_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_documents ENABLE ROW LEVEL SECURITY;

-- Policies for service_providers
CREATE POLICY "Users can view own providers" ON service_providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own providers" ON service_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own providers" ON service_providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own providers" ON service_providers
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for service_payments
CREATE POLICY "Users can view own payments" ON service_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON service_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON service_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON service_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for service_documents
CREATE POLICY "Users can view own documents" ON service_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON service_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON service_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON service_documents
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at for service_providers
CREATE OR REPLACE FUNCTION update_service_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_service_providers_updated_at();

-- Auto-update updated_at for service_payments
CREATE OR REPLACE FUNCTION update_service_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_payments_updated_at
  BEFORE UPDATE ON service_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_service_payments_updated_at();

