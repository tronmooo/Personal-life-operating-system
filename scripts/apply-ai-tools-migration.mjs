#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jphpxqqilrjyypztkswc.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 Applying AI Tools Database Migration...\n')
console.log('='  .repeat(50))

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20240118000000_create_ai_tools_tables.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded')
    console.log('📊 Checking existing tables...\n')

    // Check if tables already exist
    const tablesToCheck = [
      'receipts',
      'invoices',
      'budgets',
      'tax_documents',
      'scanned_documents',
      'saved_forms',
      'financial_reports',
      'scheduled_events',
      'travel_plans',
      'meal_plans',
      'email_drafts',
      'checklists'
    ]

    const tableStatus = {}

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === '42P01') { // Table does not exist
          tableStatus[table] = '❌ Missing'
        } else {
          tableStatus[table] = `⚠️  Error: ${error.message}`
        }
      } else {
        tableStatus[table] = '✅ Exists'
      }
    }

    // Display table status
    console.log('Table Status:')
    console.log('-'.repeat(50))
    for (const [table, status] of Object.entries(tableStatus)) {
      console.log(`  ${table.padEnd(25)} ${status}`)
    }
    console.log()

    const missingTables = Object.entries(tableStatus)
      .filter(([_, status]) => status.includes('❌'))
      .map(([table]) => table)

    if (missingTables.length === 0) {
      console.log('✅ All AI tools tables already exist!')
      console.log('\n🎉 Database is ready for AI tools!\n')
      return
    }

    console.log(`\n📝 Found ${missingTables.length} missing tables`)
    console.log('🔧 Applying migration...\n')

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      if (!statement || statement.startsWith('--')) continue

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        })

        if (error) {
          // Try alternative: direct query
          const { error: directError } = await supabase.from('_migration_test').select('*').limit(0)

          if (directError) {
            console.log(`⚠️  Statement ${i + 1} failed (might be expected):`, directError.message.substring(0, 100))
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} error:`, err.message ? err.message.substring(0, 100) : 'Unknown error')
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Results:')
    console.log(`  ✅ Successful: ${successCount}`)
    console.log(`  ⚠️  Errors: ${errorCount}`)

    console.log('\n💡 Note: Some errors are expected (e.g., "already exists")')
    console.log('The important thing is that all tables are available.\n')

    // Verify tables again
    console.log('🔍 Verifying tables...\n')

    const newTableStatus = {}
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      newTableStatus[table] = error ? '❌ Not accessible' : '✅ Ready'
    }

    console.log('Final Table Status:')
    console.log('-'.repeat(50))
    for (const [table, status] of Object.entries(newTableStatus)) {
      console.log(`  ${table.padEnd(25)} ${status}`)
    }

    const allReady = Object.values(newTableStatus).every(status => status.includes('✅'))

    console.log('\n' + '='.repeat(50))
    if (allReady) {
      console.log('🎉 All AI tools tables are ready!')
      console.log('\n✨ You can now use AI tools at: http://localhost:3003/tools')
    } else {
      console.log('⚠️  Some tables may need manual setup')
      console.log('\n📝 Manual Setup Instructions:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Open SQL Editor')
      console.log('3. Paste the migration SQL from:')
      console.log('   supabase/migrations/20240118000000_create_ai_tools_tables.sql')
      console.log('4. Run the query')
    }

    console.log()

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.log('\n📝 Manual Setup Instructions:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Open SQL Editor')
    console.log('3. Paste the migration SQL from:')
    console.log('   supabase/migrations/20240118000000_create_ai_tools_tables.sql')
    console.log('4. Run the query\n')
    process.exit(1)
  }
}

applyMigration()
