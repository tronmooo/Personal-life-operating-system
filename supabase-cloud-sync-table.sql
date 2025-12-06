-- Cloud Sync Table for LifeHub
-- Run this in your Supabase SQL Editor to enable cloud sync

-- Create user_data_sync table
CREATE TABLE IF NOT EXISTS user_data_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_data_sync_user_id ON user_data_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_sync_last_synced ON user_data_sync(last_synced_at);

-- Enable Row Level Security
ALTER TABLE user_data_sync ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own data
CREATE POLICY "Users can view own sync data"
  ON user_data_sync
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own sync data"
  ON user_data_sync
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own sync data"
  ON user_data_sync
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete own sync data"
  ON user_data_sync
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_data_sync_updated_at ON user_data_sync;
CREATE TRIGGER update_user_data_sync_updated_at
  BEFORE UPDATE ON user_data_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_data_sync TO authenticated;
GRANT USAGE ON SEQUENCE user_data_sync_id_seq TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Cloud sync table created successfully!';
  RAISE NOTICE 'Your app will now sync data automatically when users are authenticated.';
END $$;
































