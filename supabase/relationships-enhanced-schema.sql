-- Enhanced Relationships Schema
-- Add new columns for richer relationship tracking

-- Add new columns to relationships table
ALTER TABLE relationships 
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS "favoriteThings" TEXT,
ADD COLUMN IF NOT EXISTS "anniversaryDate" DATE,
ADD COLUMN IF NOT EXISTS "howWeMet" TEXT,
ADD COLUMN IF NOT EXISTS "importantDates" JSONB DEFAULT '[]'::jsonb;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_relationships_anniversary ON relationships("anniversaryDate");

-- Comments for new columns
COMMENT ON COLUMN relationships.hobbies IS 'Person''s hobbies and interests';
COMMENT ON COLUMN relationships."favoriteThings" IS 'Things this person likes (food, activities, gifts, etc.)';
COMMENT ON COLUMN relationships."anniversaryDate" IS 'Anniversary date (for partners, friendship anniversary, etc.)';
COMMENT ON COLUMN relationships."howWeMet" IS 'Story of how you met this person';
COMMENT ON COLUMN relationships."importantDates" IS 'Array of important dates: [{"date": "2024-01-15", "label": "First date", "type": "milestone"}]';

















