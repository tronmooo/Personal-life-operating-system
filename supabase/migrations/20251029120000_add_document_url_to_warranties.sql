-- Add document_url columns for warranty tables
ALTER TABLE IF EXISTS appliance_warranties
  ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE IF EXISTS vehicle_warranties
  ADD COLUMN IF NOT EXISTS document_url TEXT;


