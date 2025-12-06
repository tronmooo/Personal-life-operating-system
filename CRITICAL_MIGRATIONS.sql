-- =====================================================
-- CRITICAL MIGRATIONS FOR LIFEHUB
-- Run this SQL in Supabase Dashboard > SQL Editor
-- =====================================================

-- BUG FIX #1: Create user_settings table
-- This fixes: user_settings table doesn't exist (404 errors)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Helpful index for partial queries by settings keys
CREATE INDEX IF NOT EXISTS user_settings_gin_idx ON public.user_settings USING gin (settings);

-- Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own settings" ON public.user_settings;
CREATE POLICY "Users can select their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their own settings" ON public.user_settings;
CREATE POLICY "Users can upsert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- BUG FIX #2: Create insights table
-- This fixes: insights table doesn't exist (404 errors)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('financial','health','vehicles','home','relationships','goals','other')) DEFAULT 'other',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created ON public.insights(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON public.insights(priority);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own insights" ON public.insights;
CREATE POLICY "Users select own insights" ON public.insights FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own insights" ON public.insights;
CREATE POLICY "Users insert own insights" ON public.insights FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own insights" ON public.insights;
CREATE POLICY "Users update own insights" ON public.insights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own insights" ON public.insights;
CREATE POLICY "Users delete own insights" ON public.insights FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- END OF CRITICAL MIGRATIONS
-- =====================================================

-- =====================================================
-- BUG FIX #3: Add RLS policies to domain_entries table
-- This fixes: DELETE operations can wipe ALL user data (no RLS protection)
-- PRIORITY: CRITICAL - Run this BEFORE any user testing!
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.domain_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (will recreate safely)
DROP POLICY IF EXISTS "Users can select own domain_entries" ON public.domain_entries;
DROP POLICY IF EXISTS "Users can insert own domain_entries" ON public.domain_entries;
DROP POLICY IF EXISTS "Users can update own domain_entries" ON public.domain_entries;
DROP POLICY IF EXISTS "Users can delete own domain_entries" ON public.domain_entries;

-- SELECT policy - user can only see their own entries
CREATE POLICY "Users can select own domain_entries"
  ON public.domain_entries FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy - user can only create entries for themselves
CREATE POLICY "Users can insert own domain_entries"
  ON public.domain_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - user can only update their own entries
CREATE POLICY "Users can update own domain_entries"
  ON public.domain_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy - user can only delete their own entries
CREATE POLICY "Users can delete own domain_entries"
  ON public.domain_entries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- END OF CRITICAL MIGRATIONS
-- =====================================================

-- After running this SQL:
-- 1. Refresh your browser
-- 2. Check that no more 404 errors appear in the Network tab
-- 3. Verify insights and user_settings are now working
-- 4. CRITICAL: Test DELETE functionality - should only delete targeted entry, not all data




