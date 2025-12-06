-- EMERGENCY FIX: Enable DELETE operations on domain_entries
-- Run this NOW to fix the delete issue
-- Date: 2025-10-29

-- Step 1: Enable RLS if not already enabled
ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing DELETE policies to start fresh
DROP POLICY IF EXISTS "Users can delete own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "domain_entries_delete_own" ON domain_entries;
DROP POLICY IF EXISTS "Users can only delete own domain_entries" ON domain_entries;
DROP POLICY IF EXISTS "users_delete_own_entries" ON domain_entries;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON domain_entries;

-- Step 3: Create a fresh DELETE policy
CREATE POLICY "Users can delete own domain_entries"
ON domain_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Verify the policy was created
DO $$
DECLARE
  delete_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO delete_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'domain_entries'
  AND cmd = 'DELETE';
  
  IF delete_policy_count = 0 THEN
    RAISE EXCEPTION '❌ DELETE policy was NOT created!';
  ELSE
    RAISE NOTICE '✅ DELETE policy created successfully! Found % policies', delete_policy_count;
  END IF;
END $$;

-- Step 5: Display all policies for verification
SELECT 
  tablename,
  policyname,
  cmd as operation,
  roles::text as applies_to
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'domain_entries'
ORDER BY cmd;

