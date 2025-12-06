-- ============================================================================
-- RELATIONSHIPS DOMAIN - People tracking, birthdays, reminders
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. RELATIONSHIPS TABLE - Track people in your life
-- ============================================================================
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  birthday DATE,
  email TEXT,
  phone TEXT,
  notes TEXT,
  "lastContact" TIMESTAMPTZ,
  "isFavorite" BOOLEAN DEFAULT false,
  hobbies TEXT,
  "favoriteThings" TEXT,
  "anniversaryDate" DATE,
  "howWeMet" TEXT,
  "importantDates" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relationships_user_id ON relationships("userId");
CREATE INDEX idx_relationships_name ON relationships(name);
CREATE INDEX idx_relationships_relationship ON relationships(relationship);
CREATE INDEX idx_relationships_birthday ON relationships(birthday);
CREATE INDEX idx_relationships_is_favorite ON relationships("isFavorite");

-- ============================================================================
-- 2. RELATIONSHIP_REMINDERS TABLE - Reminders for people
-- ============================================================================
CREATE TABLE IF NOT EXISTS relationship_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "personId" UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
  "reminderDate" DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  "isCompleted" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relationship_reminders_user_id ON relationship_reminders("userId");
CREATE INDEX idx_relationship_reminders_person_id ON relationship_reminders("personId");
CREATE INDEX idx_relationship_reminders_date ON relationship_reminders("reminderDate");
CREATE INDEX idx_relationship_reminders_completed ON relationship_reminders("isCompleted");

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_reminders ENABLE ROW LEVEL SECURITY;

-- Relationships policies
CREATE POLICY "Users can view their own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own relationships"
  ON relationships FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (auth.uid() = "userId");

-- Relationship reminders policies
CREATE POLICY "Users can view their own reminders"
  ON relationship_reminders FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own reminders"
  ON relationship_reminders FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own reminders"
  ON relationship_reminders FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own reminders"
  ON relationship_reminders FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationship_reminders_updated_at
  BEFORE UPDATE ON relationship_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
















