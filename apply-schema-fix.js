#!/usr/bin/env node

/**
 * Apply Schema Fix - Create Missing Tables
 * Executes SQL migration to create health_metrics, insurance_policies, and insurance_claims tables
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 🚨 SECURITY: Load credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('   Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('   Example:')
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  console.error('   node apply-schema-fix.js')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  console.log('🚀 Executing SQL migration...\n')
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim() === ';') {
      continue
    }
    
    // Extract table name for logging
    const tableMatch = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i)
    const tableName = tableMatch ? tableMatch[1] : 'unknown'
    
    try {
      console.log(`⏳ [${i + 1}/${statements.length}] Executing: ${tableName}...`)
      
      const { data, error } = await supabase.rpc('exec', { sql: statement })
      
      if (error) {
        // Try alternative approach - use postgres REST API directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
      }
      
      console.log(`✅ [${i + 1}/${statements.length}] Success: ${tableName}`)
      successCount++
    } catch (error) {
      console.error(`❌ [${i + 1}/${statements.length}] Error: ${tableName}`)
      console.error(`   ${error.message}\n`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log('='.repeat(60) + '\n')
  
  return { successCount, errorCount }
}

async function verifyTables() {
  console.log('🔍 Verifying tables were created...\n')
  
  const tablesToCheck = ['health_metrics', 'insurance_policies', 'insurance_claims']
  
  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: NOT FOUND or ERROR`)
        console.log(`   ${error.message}`)
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} records)`)
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR`)
      console.log(`   ${error.message}`)
    }
  }
  
  console.log('')
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║        SUPABASE SCHEMA FIX - CREATE MISSING TABLES           ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')
  
  // Read SQL file
  const sqlPath = path.join(__dirname, 'APPLY_THIS_SQL_NOW.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: APPLY_THIS_SQL_NOW.sql not found!')
    process.exit(1)
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8')
  
  // Execute SQL
  const { successCount, errorCount } = await executeSQL(sql)
  
  // Verify tables
  await verifyTables()
  
  if (errorCount === 0) {
    console.log('🎉 Schema fix completed successfully!\n')
    console.log('Next steps:')
    console.log('1. Navigate to http://localhost:3000/domains/health')
    console.log('2. Try adding a health metric')
    console.log('3. Navigate to http://localhost:3000/domains/insurance')
    console.log('4. Try adding an insurance policy\n')
    process.exit(0)
  } else {
    console.log('⚠️  Schema fix completed with some errors.')
    console.log('Please check the errors above and try manual application if needed.\n')
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

