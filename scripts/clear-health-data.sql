-- Clear all health domain data for the current user
-- This will remove all health entries including vitals, allergies, conditions, etc.
-- Run this in Supabase SQL Editor or via supabase CLI

-- Get your user ID first (replace with your actual email)
-- SELECT id FROM auth.users WHERE email = 'test@aol.com';

-- Then delete all health entries for that user
DELETE FROM domain_entries 
WHERE domain = 'health' 
  AND user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Verify deletion
SELECT COUNT(*) as remaining_health_entries 
FROM domain_entries 
WHERE domain = 'health' 
  AND user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

