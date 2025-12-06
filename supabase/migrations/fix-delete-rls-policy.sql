-- Migration: Fix DELETE RLS Policy for domain_entries
-- Date: 2025-10-28
-- Issue: DELETE operations return 204 but don't actually delete records
-- Root Cause: Missing or incorrect RLS DELETE policy

-- Enable RLS on domain_entries if not already enabled
ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;

-- Drop any existing DELETE policies (clean slate)
DROP POLICY IF EXISTS "Users can delete own domain entries" ON domain_entries;
DROP POLICY IF EXISTS "users_delete_own_entries" ON domain_entries;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON domain_entries;

-- Create comprehensive DELETE policy
CREATE POLICY "Users can delete own domain entries"
ON domain_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify other CRUD policies exist (add if missing)

-- SELECT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'domain_entries' 
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Users can view own domain entries"
        ON domain_entries
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- INSERT policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'domain_entries' 
        AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert own domain entries"
        ON domain_entries
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- UPDATE policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'domain_entries' 
        AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update own domain entries"
        ON domain_entries
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Display all policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING clause set'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK clause set'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'domain_entries'
ORDER BY cmd, policyname;






