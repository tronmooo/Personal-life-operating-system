-- Enhanced Documents table with full OCR and metadata support
-- This migration adds fields for document management, OCR, and expiration tracking

-- Add new columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS file_data TEXT, -- Base64 or storage URL
  ADD COLUMN IF NOT EXISTS file_url TEXT, -- Public URL if stored externally
  ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb, -- Generic metadata
  ADD COLUMN IF NOT EXISTS ocr_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ocr_text TEXT, -- Full OCR extracted text
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(5,2), -- OCR confidence score
  ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'::jsonb, -- AI-extracted structured data
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ, -- Document expiration date
  ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ, -- Renewal date if applicable
  ADD COLUMN IF NOT EXISTS policy_number TEXT, -- For insurance/policy documents
  ADD COLUMN IF NOT EXISTS account_number TEXT, -- For financial documents
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2), -- For financial documents
  ADD COLUMN IF NOT EXISTS reminder_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_id UUID; -- Link to notifications table

-- Make drive_file_id optional (for non-Google Drive documents)
ALTER TABLE documents ALTER COLUMN drive_file_id DROP NOT NULL;

-- Drop unique constraint on drive_file_id (allow NULL values)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_drive_file_id_key;

-- Add unique constraint only for non-null drive_file_id
CREATE UNIQUE INDEX IF NOT EXISTS documents_drive_file_id_unique 
  ON documents(drive_file_id) 
  WHERE drive_file_id IS NOT NULL;

-- Add index for expiration date queries (for alerts)
CREATE INDEX IF NOT EXISTS idx_documents_expiration_date ON documents(expiration_date) 
  WHERE expiration_date IS NOT NULL;

-- Add index for domain + expiration (for domain-specific expiring docs)
CREATE INDEX IF NOT EXISTS idx_documents_domain_expiration ON documents(domain, expiration_date) 
  WHERE expiration_date IS NOT NULL;

-- Add index for user + expiration (for user alerts)
CREATE INDEX IF NOT EXISTS idx_documents_user_expiration ON documents(user_id, expiration_date) 
  WHERE expiration_date IS NOT NULL;

-- Add function to check for expiring documents
CREATE OR REPLACE FUNCTION get_expiring_documents(
  p_user_id TEXT,
  p_days_ahead INT DEFAULT 90
)
RETURNS TABLE (
  id UUID,
  document_name TEXT,
  domain TEXT,
  expiration_date TIMESTAMPTZ,
  days_until_expiration INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.document_name,
    d.domain,
    d.expiration_date,
    CEIL(EXTRACT(EPOCH FROM (d.expiration_date - NOW())) / 86400)::INT as days_until_expiration
  FROM documents d
  WHERE d.user_id = p_user_id
    AND d.expiration_date IS NOT NULL
    AND d.expiration_date > NOW()
    AND d.expiration_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY d.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE documents IS 'Stores document metadata with OCR, expiration tracking, and Google Drive integration';
COMMENT ON COLUMN documents.extracted_data IS 'JSONB field containing AI-extracted structured data like documentType, expirationDate, policyNumber, etc.';
COMMENT ON COLUMN documents.metadata IS 'JSONB field for domain-specific metadata';
COMMENT ON COLUMN documents.expiration_date IS 'Document expiration date for alert generation';
COMMENT ON FUNCTION get_expiring_documents IS 'Returns documents expiring within specified days for a user';





















