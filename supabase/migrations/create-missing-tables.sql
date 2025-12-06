-- Migration: Create Missing Tables (insights, verify user_settings)
-- Date: 2025-10-28
-- Issue: 404 errors for insights and user_settings tables

-- ============================================
-- 1. CREATE INSIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS insights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    domain text NOT NULL,
    insight_type text NOT NULL, -- e.g., 'trend', 'anomaly', 'suggestion', 'alert'
    title text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    severity text DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    expires_at timestamptz, -- Optional expiration date
    CONSTRAINT insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for insights
CREATE INDEX IF NOT EXISTS insights_user_id_idx ON insights(user_id);
CREATE INDEX IF NOT EXISTS insights_domain_idx ON insights(domain);
CREATE INDEX IF NOT EXISTS insights_created_at_idx ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS insights_user_domain_idx ON insights(user_id, domain);
CREATE INDEX IF NOT EXISTS insights_is_read_idx ON insights(is_read) WHERE is_read = false;

-- Enable RLS on insights
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insights
CREATE POLICY "Users can view own insights"
ON insights FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
ON insights FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
ON insights FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
ON insights FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE/VERIFY USER_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    theme text DEFAULT 'system', -- 'light', 'dark', 'system'
    language text DEFAULT 'en',
    timezone text DEFAULT 'UTC',
    notifications_enabled boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id),
    CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for user_settings
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to auto-create user_settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, settings)
    VALUES (NEW.id, '{}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user_settings
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- ============================================
-- 3. VERIFY DOCUMENTS TABLE FOR INSURANCE FIX
-- ============================================

-- Check if documents table exists and has required columns
DO $$
BEGIN
    -- Add domain_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'domain_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN domain_id text;
        CREATE INDEX documents_domain_id_idx ON documents(domain_id);
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'category'
    ) THEN
        ALTER TABLE documents ADD COLUMN category text;
        CREATE INDEX documents_category_idx ON documents(category);
    END IF;
END $$;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Show created tables
SELECT 
    'insights' as table_name,
    COUNT(*) as record_count
FROM insights
UNION ALL
SELECT 
    'user_settings',
    COUNT(*)
FROM user_settings
UNION ALL
SELECT 
    'documents',
    COUNT(*)
FROM documents;

-- Show insights table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'insights'
ORDER BY ordinal_position;

-- Show RLS policies for new tables
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('insights', 'user_settings', 'documents')
ORDER BY tablename, cmd;






