-- ⚠️ WARNING: This will DELETE ALL health entries for the authenticated user
-- This action CANNOT be undone!

-- Preview what will be deleted (run this first to be safe)
-- SELECT id, title, domain, created_at 
-- FROM domain_entries 
-- WHERE user_id = auth.uid() AND domain = 'health';

-- Actual DELETE (uncomment after previewing)
DELETE FROM domain_entries
WHERE user_id = auth.uid() 
  AND domain = 'health';

-- Verify deletion
SELECT COUNT(*) as remaining_health_entries 
FROM domain_entries 
WHERE user_id = auth.uid() 
  AND domain = 'health';

