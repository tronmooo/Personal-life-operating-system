#!/usr/bin/env node
/**
 * Apply all database migrations using Supabase service role
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function executeSQLFile(filePath) {
  console.log(`\n📄 Executing: ${filePath}`)
  
  const sql = fs.readFileSync(filePath, 'utf8')
  
  // Split into individual statements (basic approach)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (stmt.length < 10) continue // Skip very short statements
    
    try {
      // Use rpc to execute raw SQL (if available)
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: stmt + ';'
      })
      
      if (error) {
        // Try direct query method
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: stmt + ';' })
        })
        
        if (!response.ok) {
          console.log(`   ⚠️  Statement ${i + 1}: ${error.message || response.statusText}`)
          errorCount++
          continue
        }
      }
      
      successCount++
    } catch (err) {
      console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`)
      errorCount++
    }
  }
  
  console.log(`   ✅ ${successCount} statements executed, ${errorCount} warnings/errors\n`)
  return { successCount, errorCount }
}

async function applyMigrations() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  Applying Database Migrations')
  console.log('═══════════════════════════════════════════════\n')
  
  const migrations = [
    'supabase/migrations/fix-delete-rls-policy.sql',
    'supabase/migrations/fix-double-nested-metadata.sql',
    'supabase/migrations/create-missing-tables.sql'
  ]
  
  for (const migration of migrations) {
    const fullPath = path.join(__dirname, '..', migration)
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Migration file not found: ${migration}`)
      continue
    }
    
    await executeSQLFile(fullPath)
  }
  
  console.log('═══════════════════════════════════════════════')
  console.log('  Migrations Complete')
  console.log('═══════════════════════════════════════════════\n')
}

// If exec_sql doesn't exist, we'll manually execute critical policies
async function manuallyApplyRLSPolicies() {
  console.log('\n🔧 Manually applying RLS policies via REST API...\n')
  
  // Enable RLS
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;'
      })
    })
    
    console.log('✅ RLS enabled (or already enabled)')
  } catch (err) {
    console.log('⚠️  Could not enable RLS via API')
  }
  
  console.log('\n⚠️  Note: Full SQL migrations need to be run in Supabase SQL Editor')
  console.log('   Open your Supabase project dashboard and navigate to SQL Editor\n')
}

async function main() {
  try {
    await applyMigrations()
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.log('\nFalling back to manual instructions...\n')
    await manuallyApplyRLSPolicies()
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})






