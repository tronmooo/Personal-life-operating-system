-- AI Tools Data Tables

-- Tax Documents Table
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'W-2', '1099', 'Deductions', etc.
  document_name TEXT NOT NULL,
  file_url TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'uploaded', 'processed'
  tax_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT,
  amount DECIMAL(10, 2),
  category TEXT,
  date DATE,
  file_url TEXT,
  ocr_text TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2),
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid'
  due_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period TEXT DEFAULT 'monthly', -- 'monthly', 'annual'
  total_income DECIMAL(10, 2),
  categories JSONB DEFAULT '[]'::jsonb,
  needs_percentage INTEGER DEFAULT 50,
  wants_percentage INTEGER DEFAULT 30,
  savings_percentage INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scanned Documents Table
CREATE TABLE IF NOT EXISTS scanned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT, -- 'contract', 'form', 'letter', etc.
  file_url TEXT,
  ocr_text TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms Table (Smart Form Filler)
CREATE TABLE IF NOT EXISTS saved_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL, -- 'job', 'rental', 'loan', 'insurance', 'government'
  form_name TEXT NOT NULL,
  form_data JSONB DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Reports Table
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'income_statement', 'balance_sheet', 'cash_flow'
  report_name TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  data JSONB DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments/Events Table (Smart Scheduler)
CREATE TABLE IF NOT EXISTS scheduled_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- 'appointment', 'meeting', 'reminder'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees TEXT[] DEFAULT ARRAY[]::TEXT[],
  calendar_id TEXT, -- Google Calendar ID if synced
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel Plans Table
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  itinerary JSONB DEFAULT '[]'::jsonb,
  budget DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans Table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  meals JSONB DEFAULT '{}'::jsonb, -- { monday: {breakfast, lunch, dinner}, ... }
  grocery_list JSONB DEFAULT '[]'::jsonb,
  dietary_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Drafts Table (AI Email Assistant)
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  recipient TEXT,
  draft_content TEXT,
  tone TEXT, -- 'professional', 'casual', 'friendly'
  purpose TEXT, -- 'reply', 'introduction', 'follow-up'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists Table
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_name TEXT NOT NULL,
  checklist_type TEXT, -- 'moving', 'wedding', 'travel', 'project'
  items JSONB DEFAULT '[]'::jsonb,
  completed_items INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tax_documents_user_id ON tax_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_user_id ON scanned_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_forms_user_id ON saved_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_id ON financial_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_user_id ON scheduled_events(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_user_id ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);

-- Enable Row Level Security
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their own tax documents" ON tax_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tax documents" ON tax_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax documents" ON tax_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tax documents" ON tax_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own receipts" ON receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own receipts" ON receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipts" ON receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipts" ON receipts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scanned documents" ON scanned_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scanned documents" ON scanned_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scanned documents" ON scanned_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scanned documents" ON scanned_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms" ON saved_forms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own forms" ON saved_forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own forms" ON saved_forms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own forms" ON saved_forms FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own financial reports" ON financial_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own financial reports" ON financial_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial reports" ON financial_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financial reports" ON financial_reports FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own events" ON scheduled_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events" ON scheduled_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON scheduled_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON scheduled_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own travel plans" ON travel_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own travel plans" ON travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own travel plans" ON travel_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own travel plans" ON travel_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meal plans" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meal plans" ON meal_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email drafts" ON email_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email drafts" ON email_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email drafts" ON email_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email drafts" ON email_drafts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own checklists" ON checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own checklists" ON checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checklists" ON checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own checklists" ON checklists FOR DELETE USING (auth.uid() = user_id);































