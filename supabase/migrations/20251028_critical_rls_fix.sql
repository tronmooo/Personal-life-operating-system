-- CRITICAL SECURITY FIX: Add Row Level Security to domain_entries
-- Date: 2025-10-28
-- Issue: Mass deletion bug caused by missing RLS policies
-- Severity: CRITICAL - Production breaking

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON domain_entries
-- ============================================================================

ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP ANY EXISTING POLICIES (Clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can only delete own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can only insert own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can only select own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can only update own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can delete own domain entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can view own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can insert own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "Users can update own domain_entries" ON domain_entries;

-- ============================================================================
-- 3. CREATE COMPREHENSIVE RLS POLICIES
-- ============================================================================

-- SELECT Policy - Users can only view their own entries
CREATE POLICY "Users can only select own domain_entries"
ON domain_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy - Users can only create entries for themselves
CREATE POLICY "Users can only insert own domain_entries"
ON domain_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy - Users can only update their own entries
CREATE POLICY "Users can only update own domain_entries"
ON domain_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy - Users can only delete their own entries
CREATE POLICY "Users can only delete own domain_entries"
ON domain_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'domain_entries'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is NOT enabled on domain_entries table!';
  END IF;
  
  RAISE NOTICE 'RLS is enabled on domain_entries ✅';
END $$;

-- Count policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'domain_entries';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Only % policies found, expected 4!', policy_count;
  ELSE
    RAISE NOTICE '% RLS policies created successfully ✅', policy_count;
  END IF;
END $$;

-- Display all policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN roles::text = '{authenticated}' THEN 'authenticated users'
    ELSE roles::text
  END as applies_to,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ USING clause set'
    ELSE '❌ No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK set'
    ELSE '-- No WITH CHECK'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'domain_entries'
ORDER BY cmd;

-- ============================================================================
-- 5. SECURITY NOTES
-- ============================================================================

/*
CRITICAL SECURITY DETAILS:

1. RLS ENFORCEMENT:
   - All policies use `auth.uid() = user_id`
   - This ensures users can ONLY access their own data
   - No cross-user data access is possible

2. AUTHENTICATION REQUIREMENT:
   - All policies are `TO authenticated`
   - Anonymous users have NO access
   - Must be logged in to perform any operation

3. POLICY COVERAGE:
   - SELECT: Can only view own entries
   - INSERT: Can only create entries for themselves
   - UPDATE: Can only modify own entries
   - DELETE: Can only delete own entries

4. SERVICE ROLE BYPASS:
   - Service role key bypasses RLS (for admin operations)
   - Use with extreme caution
   - Never expose service role key to client

5. TESTING:
   - Test with authenticated user (should see own data)
   - Test with different user (should see different data)
   - Test cross-user access (should fail/return empty)

6. DEPLOYMENT:
   - Apply this migration IMMEDIATELY
   - Test thoroughly before production
   - Monitor deletion operations closely
*/

-- ============================================================================
-- 6. POST-DEPLOYMENT VERIFICATION
-- ============================================================================

/*
Run these queries after applying migration:

-- As authenticated user:
SELECT COUNT(*) FROM domain_entries;  -- Should only show current user's entries

-- Try to access another user's data (should fail/return empty):
SELECT * FROM domain_entries WHERE user_id != auth.uid();  -- Should return 0 rows

-- Test delete (should only affect own entries):
DELETE FROM domain_entries WHERE id = 'test-id';  -- Should only delete if you own it

-- Verify RLS is actually enforced:
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'domain_entries';
-- Should show: domain_entries | t (true)
*/

