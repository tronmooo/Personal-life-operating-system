-- Relationship Reminders Schema
-- Allows users to set reminders for specific dates related to people

-- Relationship Reminders table
CREATE TABLE IF NOT EXISTS relationship_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "personId" UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  "reminderDate" DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  "isCompleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_relationship_reminders_user_id ON relationship_reminders("userId");
CREATE INDEX IF NOT EXISTS idx_relationship_reminders_person_id ON relationship_reminders("personId");
CREATE INDEX IF NOT EXISTS idx_relationship_reminders_date ON relationship_reminders("reminderDate");
CREATE INDEX IF NOT EXISTS idx_relationship_reminders_completed ON relationship_reminders("userId", "isCompleted");

-- Row Level Security (RLS)
ALTER TABLE relationship_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_reminders' AND policyname = 'Users can view their own reminders') THEN
    CREATE POLICY "Users can view their own reminders"
      ON relationship_reminders FOR SELECT
      USING (auth.uid() = "userId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_reminders' AND policyname = 'Users can insert their own reminders') THEN
    CREATE POLICY "Users can insert their own reminders"
      ON relationship_reminders FOR INSERT
      WITH CHECK (auth.uid() = "userId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_reminders' AND policyname = 'Users can update their own reminders') THEN
    CREATE POLICY "Users can update their own reminders"
      ON relationship_reminders FOR UPDATE
      USING (auth.uid() = "userId")
      WITH CHECK (auth.uid() = "userId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_reminders' AND policyname = 'Users can delete their own reminders') THEN
    CREATE POLICY "Users can delete their own reminders"
      ON relationship_reminders FOR DELETE
      USING (auth.uid() = "userId");
  END IF;
END $$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_relationship_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_relationship_reminders_updated_at ON relationship_reminders;
CREATE TRIGGER trigger_relationship_reminders_updated_at
  BEFORE UPDATE ON relationship_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_reminders_updated_at();

-- Comments
COMMENT ON TABLE relationship_reminders IS 'Stores reminders for specific people/relationships';
COMMENT ON COLUMN relationship_reminders.title IS 'Title of the reminder (e.g., "Call Mom", "Send birthday card")';
COMMENT ON COLUMN relationship_reminders."isCompleted" IS 'Whether the reminder has been completed';

















