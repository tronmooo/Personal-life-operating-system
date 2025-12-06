-- Fix global updated_at trigger function and isolate camelCase usage
-- Context: A previous migration redefined update_updated_at_column()
-- to reference NEW."updatedAt" (camelCase). That broke triggers on
-- tables like domains which use snake_case updated_at.

-- 1) Restore the global function for snake_case updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Provide a dedicated function for camelCase UpdatedAt columns
CREATE OR REPLACE FUNCTION update_camel_updatedAt_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Repoint relationships triggers to the camelCase function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_relationships_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER update_relationships_updated_at ON relationships';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_relationship_reminders_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER update_relationship_reminders_updated_at ON relationship_reminders';
  END IF;

  -- Recreate triggers using camelCase function
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationships') THEN
    EXECUTE 'CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_camel_updatedAt_column()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationship_reminders') THEN
    EXECUTE 'CREATE TRIGGER update_relationship_reminders_updated_at BEFORE UPDATE ON relationship_reminders FOR EACH ROW EXECUTE FUNCTION update_camel_updatedAt_column()';
  END IF;
END $$;

















