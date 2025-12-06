# 📊 Database Setup for Smart Document Scanner

## ✅ Your API Key is Configured!

Your Google Cloud Vision API key is now set up and ready to use.

## 📁 Supabase Tables Needed

The smart scanner saves documents to different Supabase tables based on document type. Here are the tables that need to exist:

### 1. Storage Bucket

First, create a storage bucket for document files:

```sql
-- Create documents bucket in Supabase Storage
-- Go to Storage → Create bucket → Name: "documents" → Public: true
```

### 2. Database Tables

Run these SQL migrations in Supabase (Dashboard → SQL Editor):

#### Finance Transactions Table

```sql
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'expense' or 'income'
  category TEXT,
  vendor TEXT,
  amount DECIMAL(10,2),
  date DATE,
  description TEXT,
  receipt_url TEXT,
  items JSONB,
  tax DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
  ON finance_transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_finance_transactions_user_id ON finance_transactions(user_id);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(date DESC);
```

#### Insurance Policies Table

```sql
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Health', 'Auto', 'Home', 'Life'
  provider TEXT,
  policy_number TEXT,
  effective_date DATE,
  expiration_date DATE,
  member_id TEXT,
  document_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own policies"
  ON insurance_policies
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
```

#### Health Medications Table

```sql
CREATE TABLE IF NOT EXISTS health_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  prescriber TEXT,
  pharmacy TEXT,
  refills INTEGER,
  date_filled DATE,
  expiration_date DATE,
  document_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own medications"
  ON health_medications
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_health_medications_user_id ON health_medications(user_id);
```

#### Vehicles Table

```sql
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  registration_expiration DATE,
  document_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
```

#### Bills Table

```sql
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT, -- 'Electricity', 'Water', 'Internet', etc.
  company TEXT,
  account_number TEXT,
  amount DECIMAL(10,2),
  due_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  document_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bills"
  ON bills
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
```

#### Health Records Table

```sql
CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT,
  date DATE,
  diagnosis TEXT,
  notes TEXT,
  test_results JSONB,
  document_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own records"
  ON health_records
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_health_records_user_id ON health_records(user_id);
```

#### Documents Table (General)

```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  file_url TEXT,
  extracted_text TEXT,
  extracted_data JSONB,
  document_type TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON documents
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_category ON documents(category);
```

## 🚀 Quick Setup with Supabase Dashboard

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Copy and paste** each table creation SQL above
5. **Click "Run"** for each one
6. **Go to Storage** → Create bucket named "documents" → Make it public

## ✅ Test It!

After setting up the tables:

1. **Refresh your app** (the env reload should have triggered)
2. **Click the orange upload button**
3. **Upload a test receipt**
4. **AI will process it**
5. **Click "Approve"**
6. **Check Supabase** → Should see new row in `finance_transactions` table!

## 🔍 How It Works

When you scan a document:

1. 📸 **Image captured** → Uploaded to Supabase Storage (`documents` bucket)
2. 🔍 **OCR extracts text** → Google Cloud Vision API
3. 🤖 **AI classifies** → OpenAI determines document type
4. 📊 **AI extracts data** → OpenAI pulls out structured fields
5. 💾 **Auto-saves** → Inserts into correct Supabase table:
   - Receipts → `finance_transactions`
   - Insurance cards → `insurance_policies`
   - Prescriptions → `health_medications`
   - Vehicle docs → `vehicles`
   - Bills → `bills`
   - Medical records → `health_records`
   - Unknown → `documents`

## 📝 What Gets Saved

Each document type saves relevant fields:

**Receipt Example:**
```json
{
  "vendor": "Chipotle",
  "amount": 15.50,
  "date": "2025-01-17",
  "category": "Food",
  "items": ["Burrito Bowl", "Drink"],
  "receipt_url": "https://...storage.../receipt.jpg"
}
```

**Insurance Card Example:**
```json
{
  "provider": "Blue Cross",
  "policy_number": "ABC123456",
  "type": "Health",
  "effective_date": "2024-01-01",
  "expiration_date": "2025-12-31",
  "document_url": "https://...storage.../card.jpg"
}
```

## 💡 Pro Tips

- **All data is editable** before saving (in the scanner UI)
- **Files are automatically uploaded** to Supabase Storage
- **Metadata includes confidence scores** for quality tracking
- **Full text is preserved** for search functionality
- **Tables are extensible** - add your own fields!

## 🐛 Troubleshooting

**"Insert failed" error:**
- Make sure the table exists in Supabase
- Check RLS policies are set correctly
- Verify user is authenticated

**"Storage error":**
- Ensure `documents` bucket exists
- Check bucket is set to public
- Verify storage policies

**"No data extracted":**
- Image quality might be poor
- Try better lighting
- Ensure document is clearly visible

## 🎉 You're All Set!

Once the tables are created, your smart scanner will:
- ✅ Automatically detect document types
- ✅ Extract all relevant data
- ✅ Upload images to Supabase Storage
- ✅ Save everything to the correct tables
- ✅ Create proper data points for tracking

**No manual entry needed!** Just scan and approve! 📄✨






























