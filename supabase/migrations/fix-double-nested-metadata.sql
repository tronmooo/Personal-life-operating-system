-- Migration: Fix Double-Nested Metadata in domain_entries
-- Date: 2025-10-28
-- Issue: Some records have metadata.metadata structure causing display issues
-- This migration flattens all double-nested metadata

-- Function to fix double-nested metadata
CREATE OR REPLACE FUNCTION fix_double_nested_metadata()
RETURNS TABLE (
    id uuid,
    domain text,
    title text,
    was_nested boolean,
    old_metadata jsonb,
    new_metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH nested_entries AS (
        SELECT 
            de.id,
            de.domain,
            de.title,
            de.metadata,
            de.metadata->'metadata' as inner_metadata
        FROM domain_entries de
        WHERE 
            -- Check if metadata has a single 'metadata' key
            de.metadata ? 'metadata' 
            AND jsonb_typeof(de.metadata->'metadata') = 'object'
            AND jsonb_object_keys(de.metadata) = 'metadata'
    ),
    updated AS (
        UPDATE domain_entries de
        SET 
            metadata = ne.inner_metadata,
            updated_at = NOW()
        FROM nested_entries ne
        WHERE de.id = ne.id
        RETURNING 
            de.id,
            de.domain,
            de.title,
            true as was_nested,
            ne.metadata as old_metadata,
            de.metadata as new_metadata
    )
    SELECT * FROM updated;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix and show results
SELECT 
    id,
    domain,
    title,
    was_nested,
    jsonb_pretty(old_metadata) as old_metadata,
    jsonb_pretty(new_metadata) as new_metadata
FROM fix_double_nested_metadata();

-- Check how many records were fixed
WITH fix_count AS (
    SELECT COUNT(*) as fixed_count
    FROM domain_entries
    WHERE updated_at > NOW() - INTERVAL '1 minute'
)
SELECT 
    CASE 
        WHEN fixed_count > 0 THEN format('✅ Fixed %s double-nested metadata records', fixed_count)
        ELSE '✅ No double-nested metadata found'
    END as result
FROM fix_count;

-- Drop the helper function (cleanup)
DROP FUNCTION IF EXISTS fix_double_nested_metadata();






