#!/usr/bin/env ts-node
/**
 * Migration Runner Script
 * Runs pending SQL migrations against Supabase database
 * 
 * Usage: npx ts-node scripts/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(filePath: string) {
  console.log(`\n📝 Running migration: ${path.basename(filePath)}`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8')

    // Execute SQL via RPC
    let data, error
    try {
      const result = await supabase.rpc('exec_sql', { sql_query: sql })
      data = result.data
      error = result.error
    } catch (err) {
      // If exec_sql doesn't exist, try direct query
      console.log('  ℹ️  Trying direct SQL execution...')
      console.error('  ⚠️  exec_sql RPC function not available')
      return false
    }

    if (error) {
      console.error(`  ❌ Error: ${error.message}`)
      return false
    }
    
    console.log(`  ✅ Migration completed successfully`)
    return true
  } catch (error) {
    console.error(`  ❌ Failed to run migration:`, error)
    return false
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting migration runner...\n')
  
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  
  const criticalMigrations = [
    '20251024_add_user_settings.sql',
    '20251021_insights.sql'
  ]
  
  let successCount = 0
  let failCount = 0
  
  for (const migration of criticalMigrations) {
    const filePath = path.join(migrationsDir, migration)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration file not found: ${migration}`)
      failCount++
      continue
    }
    
    const success = await runMigration(filePath)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  console.log(`\n📊 Migration Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`\n${successCount === criticalMigrations.length ? '✨ All migrations completed!' : '⚠️  Some migrations failed'}`)
}

// Run migrations
runAllMigrations().catch(console.error)







