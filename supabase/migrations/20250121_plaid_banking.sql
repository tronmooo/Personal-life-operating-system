-- Plaid Banking Integration Tables
-- Creates tables for linked accounts, transactions, and sync tracking

-- Table: linked_accounts
-- Stores information about bank accounts linked via Plaid
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plaid identifiers
  plaid_item_id TEXT NOT NULL,
  plaid_account_id TEXT NOT NULL,
  plaid_access_token TEXT NOT NULL, -- Encrypted in production
  
  -- Institution details
  institution_id TEXT,
  institution_name TEXT NOT NULL,
  
  -- Account details
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- depository, credit, loan, investment
  account_subtype TEXT, -- checking, savings, credit card, etc.
  account_mask TEXT, -- Last 4 digits
  
  -- Balance information
  current_balance DECIMAL(12, 2),
  available_balance DECIMAL(12, 2),
  currency_code VARCHAR(3) DEFAULT 'USD',
  
  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_cursor TEXT, -- For incremental sync
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint on Plaid account
  UNIQUE(plaid_item_id, plaid_account_id)
);

-- Table: transactions
-- Stores transaction data from linked bank accounts
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  
  -- Plaid identifiers
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  
  -- Transaction details
  date DATE NOT NULL,
  authorized_date DATE,
  merchant_name TEXT,
  merchant_entity_id TEXT,
  name TEXT NOT NULL, -- Transaction description
  amount DECIMAL(12, 2) NOT NULL, -- Positive = money out, Negative = money in
  currency_code VARCHAR(3) DEFAULT 'USD',
  
  -- Categories
  primary_category TEXT, -- Plaid's category
  detailed_category TEXT, -- Plaid's detailed category
  auto_category TEXT, -- Our AI-generated category
  user_category TEXT, -- User's manual override
  confidence_score DECIMAL(3, 2), -- AI confidence (0.00 - 1.00)
  
  -- Transaction type
  transaction_type TEXT, -- debit, credit, transfer
  payment_channel TEXT, -- online, in store, other
  
  -- Pending status
  pending BOOLEAN DEFAULT FALSE,
  
  -- Location
  city TEXT,
  region TEXT,
  country TEXT,
  
  -- Recurring detection
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- monthly, weekly, etc.
  recurring_confidence DECIMAL(3, 2),
  suggested_as_bill BOOLEAN DEFAULT FALSE,
  bill_created BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: plaid_items
-- Tracks Plaid Items (bank connections) separately for webhook management
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plaid_item_id TEXT UNIQUE NOT NULL,
  plaid_access_token TEXT NOT NULL,
  
  institution_id TEXT,
  institution_name TEXT,
  
  -- Webhook
  webhook_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  error_code TEXT,
  error_message TEXT,
  
  -- Consent
  consent_expiration_time TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: transaction_sync_log
-- Tracks sync operations for debugging and monitoring
CREATE TABLE IF NOT EXISTS transaction_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL, -- initial, daily, manual, webhook
  status TEXT NOT NULL, -- success, failed, partial
  
  transactions_added INTEGER DEFAULT 0,
  transactions_modified INTEGER DEFAULT 0,
  transactions_removed INTEGER DEFAULT 0,
  
  error_message TEXT,
  sync_duration_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: net_worth_snapshots
-- Stores daily net worth calculations
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  snapshot_date DATE NOT NULL,
  
  total_assets DECIMAL(12, 2) DEFAULT 0,
  total_liabilities DECIMAL(12, 2) DEFAULT 0,
  net_worth DECIMAL(12, 2) NOT NULL,
  
  -- Breakdown by account type
  checking_balance DECIMAL(12, 2) DEFAULT 0,
  savings_balance DECIMAL(12, 2) DEFAULT 0,
  investment_balance DECIMAL(12, 2) DEFAULT 0,
  credit_card_balance DECIMAL(12, 2) DEFAULT 0,
  loan_balance DECIMAL(12, 2) DEFAULT 0,
  
  account_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX idx_linked_accounts_user ON linked_accounts(user_id);
CREATE INDEX idx_linked_accounts_plaid_item ON linked_accounts(plaid_item_id);
CREATE INDEX idx_linked_accounts_active ON linked_accounts(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX idx_transactions_recurring ON transactions(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_transactions_plaid_id ON transactions(plaid_transaction_id);

CREATE INDEX idx_plaid_items_user ON plaid_items(user_id);
CREATE INDEX idx_plaid_items_item_id ON plaid_items(plaid_item_id);

CREATE INDEX idx_sync_log_user ON transaction_sync_log(user_id);
CREATE INDEX idx_sync_log_created ON transaction_sync_log(created_at DESC);

CREATE INDEX idx_net_worth_user ON net_worth_snapshots(user_id);
CREATE INDEX idx_net_worth_date ON net_worth_snapshots(snapshot_date DESC);
CREATE INDEX idx_net_worth_user_date ON net_worth_snapshots(user_id, snapshot_date DESC);

-- Enable Row Level Security
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own linked accounts"
  ON linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linked accounts"
  ON linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked accounts"
  ON linked_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked accounts"
  ON linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own plaid items"
  ON plaid_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own plaid items"
  ON plaid_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync logs"
  ON transaction_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON transaction_sync_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own net worth snapshots"
  ON net_worth_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own net worth snapshots"
  ON net_worth_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_plaid_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER linked_accounts_updated_at
  BEFORE UPDATE ON linked_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_updated_at();

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_updated_at();

CREATE TRIGGER plaid_items_updated_at
  BEFORE UPDATE ON plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_updated_at();



