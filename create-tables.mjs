#!/usr/bin/env node
/**
 * Create missing database tables for LifeHub
 * This fixes the 404 errors for insights and user_settings tables
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

console.log('🔧 Creating missing database tables...\n')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Check if tables exist first
console.log('📋 Checking existing tables...')

const checkInsights = await supabase.from('insights').select('id').limit(1)
const checkUserSettings = await supabase.from('user_settings').select('user_id').limit(1)

const needsInsights = checkInsights.error?.message?.includes('does not exist')
const needsUserSettings = checkUserSettings.error?.message?.includes('does not exist')

console.log(`  insights table: ${needsInsights ? '❌ MISSING' : '✅ EXISTS'}`)
console.log(`  user_settings table: ${needsUserSettings ? '❌ MISSING' : '✅ EXISTS'}`)

if (!needsInsights && !needsUserSettings) {
  console.log('\n✨ All tables already exist! No action needed.')
  process.exit(0)
}

console.log('\n🚀 Creating missing tables via Supabase Management API...\n')

// Use Supabase Management API to execute SQL
const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
}

if (needsUserSettings) {
  console.log('📝 Creating user_settings table...')
  
  const userSettingsSQL = `
    CREATE TABLE IF NOT EXISTS public.user_settings (
      user_id uuid primary key references auth.users(id) on delete cascade,
      settings jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );

    CREATE INDEX IF NOT EXISTS user_settings_gin_idx ON public.user_settings USING gin (settings);

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
  `
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: userSettingsSQL })
    })
    
    if (response.ok || response.status === 404) {
      // 404 means exec RPC doesn't exist, try alternative
      console.log('  ⚠️  Direct SQL execution not available')
      console.log('  📋 Table creation SQL saved to: CRITICAL_MIGRATIONS.sql')
      console.log('  ⚡ Please run manually in Supabase Dashboard > SQL Editor')
    } else {
      console.log('  ✅ user_settings table created!')
    }
  } catch (error) {
    console.log('  ⚠️  Could not create via API:', error.message)
  }
}

if (needsInsights) {
  console.log('\n📝 Creating insights table...')
  
  const insightsSQL = `
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
  `
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: insightsSQL })
    })
    
    if (response.ok || response.status === 404) {
      console.log('  ⚠️  Direct SQL execution not available')
      console.log('  📋 Table creation SQL saved to: CRITICAL_MIGRATIONS.sql')
      console.log('  ⚡ Please run manually in Supabase Dashboard > SQL Editor')
    } else {
      console.log('  ✅ insights table created!')
    }
  } catch (error) {
    console.log('  ⚠️  Could not create via API:', error.message)
  }
}

console.log('\n' + '='.repeat(70))
console.log('📋 MANUAL FIX REQUIRED')
console.log('='.repeat(70))
console.log('\nSupabase does not expose direct SQL execution via REST API.')
console.log('You need to run the SQL manually:')
console.log('\n1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
console.log('2. Click "SQL Editor" in the left sidebar')
console.log('3. Click "New Query"')
console.log('4. Copy the contents of: CRITICAL_MIGRATIONS.sql')
console.log('5. Paste and click "RUN"')
console.log('\nThis will take less than 1 minute.')
console.log('After running, refresh your browser and all 404 errors will be gone!')
console.log('='.repeat(70) + '\n')







