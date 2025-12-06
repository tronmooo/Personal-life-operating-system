-- Documents table for Google Drive metadata
-- Stores references to files uploaded to Google Drive

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id TEXT, -- Optional: link to specific domain record
  drive_file_id TEXT NOT NULL UNIQUE, -- Google Drive file ID
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  web_view_link TEXT, -- Google Drive viewer link
  web_content_link TEXT, -- Download link
  thumbnail_link TEXT, -- Thumbnail for images
  file_size TEXT,
  extracted_text TEXT, -- OCR extracted text
  domain TEXT NOT NULL, -- Which domain folder (insurance, vehicles, etc.)
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_domain ON documents(domain);
CREATE INDEX idx_documents_record_id ON documents(record_id);
CREATE INDEX idx_documents_drive_file_id ON documents(drive_file_id);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own documents
CREATE POLICY "Users can view own documents"
  ON documents
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
































