-- Relationships (People & Connections) Schema
-- Tracks important people in your life

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('best_friend', 'friend', 'family', 'partner', 'colleague', 'acquaintance', 'mentor')),
  birthday DATE,
  email TEXT,
  phone TEXT,
  notes TEXT,
  "lastContact" TIMESTAMP WITH TIME ZONE,
  "isFavorite" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships("userId");
CREATE INDEX IF NOT EXISTS idx_relationships_favorite ON relationships("userId", "isFavorite");
CREATE INDEX IF NOT EXISTS idx_relationships_birthday ON relationships(birthday);

-- Row Level Security (RLS)
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own relationships"
  ON relationships FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (auth.uid() = "userId");

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_relationships_updated_at();

-- Comments
COMMENT ON TABLE relationships IS 'Stores information about important people and relationships';
COMMENT ON COLUMN relationships.relationship IS 'Type of relationship: best_friend, friend, family, partner, colleague, acquaintance, mentor';
COMMENT ON COLUMN relationships."isFavorite" IS 'Whether this person is marked as a favorite';
COMMENT ON COLUMN relationships."lastContact" IS 'Last time you contacted this person';

















