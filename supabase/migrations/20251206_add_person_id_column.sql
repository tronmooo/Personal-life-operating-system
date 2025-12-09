-- ============================================================================
-- Add person_id column to support multi-person data isolation
-- This allows users to manage data for multiple people (family members, etc.)
-- ============================================================================

-- Add person_id column to domain_entries table
ALTER TABLE domain_entries 
ADD COLUMN IF NOT EXISTS person_id TEXT NOT NULL DEFAULT 'me';

-- Update all existing NULL person_id values to 'me' (the default person)
UPDATE domain_entries SET person_id = 'me' WHERE person_id IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_domain_entries_person_id ON domain_entries(person_id);
CREATE INDEX IF NOT EXISTS idx_domain_entries_user_person ON domain_entries(user_id, person_id);

-- ============================================================================
-- Add person_id to tasks table
-- ============================================================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS person_id TEXT NOT NULL DEFAULT 'me';

UPDATE tasks SET person_id = 'me' WHERE person_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_person_id ON tasks(person_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_person ON tasks(user_id, person_id);

-- ============================================================================
-- Add person_id to habits table
-- ============================================================================
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS person_id TEXT NOT NULL DEFAULT 'me';

UPDATE habits SET person_id = 'me' WHERE person_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_habits_person_id ON habits(person_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_person ON habits(user_id, person_id);

-- ============================================================================
-- Add person_id to bills table
-- ============================================================================
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS person_id TEXT NOT NULL DEFAULT 'me';

UPDATE bills SET person_id = 'me' WHERE person_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bills_person_id ON bills(person_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_person ON bills(user_id, person_id);

-- ============================================================================
-- Update domain_entries_view to include person_id
-- ============================================================================
CREATE OR REPLACE VIEW domain_entries_view AS
SELECT
  id,
  user_id,
  domain,
  title,
  description,
  metadata,
  created_at,
  updated_at,
  person_id
FROM domain_entries;

-- ============================================================================
-- COMPLETE!
-- All tables now have person_id column with 'me' as default
-- All existing data is assigned to 'me' person
-- ============================================================================





