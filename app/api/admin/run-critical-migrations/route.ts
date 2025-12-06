import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

/**
 * API endpoint to run critical database migrations
 * POST /api/admin/run-critical-migrations
 * 
 * This will create the missing `insights` and `user_settings` tables
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🚀 Running critical migrations...')

    const results: Array<{ migration: string; status: string; error?: string }> = []

    // Migration 1: user_settings table
    console.log('\n📝 Creating user_settings table...')
    try {
      const userSettingsSQL = `
        -- Create user_settings table to persist user preferences/settings
        create table if not exists public.user_settings (
          user_id uuid primary key references auth.users(id) on delete cascade,
          settings jsonb not null default '{}'::jsonb,
          updated_at timestamptz not null default now()
        );

        -- Helpful index for partial queries by settings keys
        create index if not exists user_settings_gin_idx on public.user_settings using gin (settings);

        -- Row Level Security
        alter table public.user_settings enable row level security;

        drop policy if exists "Users can select their own settings" on public.user_settings;
        create policy "Users can select their own settings"
          on public.user_settings for select
          using (auth.uid() = user_id);

        drop policy if exists "Users can upsert their own settings" on public.user_settings;
        create policy "Users can upsert their own settings"
          on public.user_settings for insert
          with check (auth.uid() = user_id);

        drop policy if exists "Users can update their own settings" on public.user_settings;
        create policy "Users can update their own settings"
          on public.user_settings for update
          using (auth.uid() = user_id)
          with check (auth.uid() = user_id);
      `

      // Execute SQL by making direct HTTP request to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: userSettingsSQL })
      })

      if (response.ok || response.status === 201) {
        console.log('  ✅ user_settings table created')
        results.push({ migration: 'user_settings', status: 'success' })
      } else {
        const errorText = await response.text()
        console.error('  ❌ Failed to create user_settings table:', errorText)
        results.push({ migration: 'user_settings', status: 'failed', error: errorText })
      }
    } catch (error: any) {
      console.error('  ❌ Error creating user_settings table:', error)
      results.push({ migration: 'user_settings', status: 'failed', error: error.message })
    }

    // Migration 2: insights table
    console.log('\n📝 Creating insights table...')
    try {
      const insightsSQL = `
        -- AI Insights table
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS insights (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          type TEXT CHECK (type IN ('financial','health','vehicles','home','relationships','goals','other')) DEFAULT 'other',
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          priority TEXT CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          dismissed BOOLEAN DEFAULT false
        );

        CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id);
        CREATE INDEX IF NOT EXISTS idx_insights_created ON insights(created_at);
        CREATE INDEX IF NOT EXISTS idx_insights_priority ON insights(priority);

        ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users select own insights" ON insights;
        CREATE POLICY "Users select own insights" ON insights FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users insert own insights" ON insights;
        CREATE POLICY "Users insert own insights" ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users update own insights" ON insights;
        CREATE POLICY "Users update own insights" ON insights FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users delete own insights" ON insights;
        CREATE POLICY "Users delete own insights" ON insights FOR DELETE USING (auth.uid() = user_id);
      `

      // Try direct query execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: insightsSQL })
      })

      if (response.ok || response.status === 201) {
        console.log('  ✅ insights table created')
        results.push({ migration: 'insights', status: 'success' })
      } else {
        const errorText = await response.text()
        console.error('  ❌ Failed to create insights table:', errorText)
        results.push({ migration: 'insights', status: 'failed', error: errorText })
      }
    } catch (error: any) {
      console.error('  ❌ Error creating insights table:', error)
      results.push({ migration: 'insights', status: 'failed', error: error.message })
    }

    const successCount = results.filter(r => r.status === 'success').length
    const failCount = results.filter(r => r.status === 'failed').length

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)

    return NextResponse.json({
      success: successCount > 0,
      message: successCount === results.length 
        ? '✅ All critical migrations completed successfully!' 
        : '⚠️ Some migrations failed. Check the logs.',
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      },
      nextSteps: [
        'Refresh your browser (Cmd+Shift+R)',
        'Check the Console tab in DevTools for any remaining errors',
        'Verify that insights and user_settings are now loading'
      ]
    })

  } catch (error: any) {
    console.error('Critical migration error:', error)
    return NextResponse.json(
      { 
        error: error.message,
        hint: 'If this fails, you can run the SQL manually in Supabase Dashboard > SQL Editor',
        sqlFiles: [
          'supabase/migrations/20251024_add_user_settings.sql',
          'supabase/migrations/20251021_insights.sql'
        ]
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if migrations are needed
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const tablesNeeded = []

    // Check if user_settings exists
    const { error: userSettingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .limit(1)
    
    if (userSettingsError && userSettingsError.message.includes('does not exist')) {
      tablesNeeded.push('user_settings')
    }

    // Check if insights exists
    const { error: insightsError } = await supabase
      .from('insights')
      .select('id')
      .limit(1)
    
    if (insightsError && insightsError.message.includes('does not exist')) {
      tablesNeeded.push('insights')
    }

    return NextResponse.json({
      needsMigration: tablesNeeded.length > 0,
      missingTables: tablesNeeded,
      message: tablesNeeded.length > 0
        ? `Missing tables: ${tablesNeeded.join(', ')}. POST to this endpoint to run migrations.`
        : 'All critical tables exist!'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}







