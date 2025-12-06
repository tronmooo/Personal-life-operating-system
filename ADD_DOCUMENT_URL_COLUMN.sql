-- Add document_url column to warranty tables
-- Run this in Supabase SQL Editor

ALTER TABLE appliance_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE vehicle_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Verify columns were added
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('appliance_warranties', 'vehicle_warranties')
  AND column_name = 'document_url';


