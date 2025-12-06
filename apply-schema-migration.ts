#!/usr/bin/env ts-node

/**
 * Apply Schema Migration - Create Missing Tables
 * Uses Supabase client to execute SQL migration
 * 
 * Run: npx ts-node apply-schema-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLMigration() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║     SUPABASE SCHEMA FIX - CREATE MISSING TABLES VIA MCP      ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')
  
  // Read SQL file
  const sqlPath = path.join(__dirname, 'APPLY_THIS_SQL_NOW.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: APPLY_THIS_SQL_NOW.sql not found!')
    process.exit(1)
  }
  
  const fullSQL = fs.readFileSync(sqlPath, 'utf8')
  
  // Split into individual statements (excluding verification query at the end)
  const statements = fullSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => 
      s.length > 0 && 
      !s.startsWith('--') && 
      s !== '=' &&
      !s.includes('SELECT') // Skip verification queries
    )
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
  
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ statement: string; error: string }> = []
  
  // Execute each statement using Supabase's rpc or direct query
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';'
    
    // Extract description from statement for logging
    let description = 'SQL statement'
    if (statement.includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i)
      description = match ? `CREATE TABLE ${match[1]}` : 'CREATE TABLE'
    } else if (statement.includes('CREATE INDEX')) {
      const match = statement.match(/CREATE INDEX\s+(\w+)/i)
      description = match ? `CREATE INDEX ${match[1]}` : 'CREATE INDEX'
    } else if (statement.includes('CREATE POLICY')) {
      const match = statement.match(/CREATE POLICY\s+"([^"]+)"/i)
      description = match ? `CREATE POLICY "${match[1]}"` : 'CREATE POLICY'
    } else if (statement.includes('ALTER TABLE')) {
      const match = statement.match(/ALTER TABLE\s+(\w+)/i)
      description = match ? `ALTER TABLE ${match[1]}` : 'ALTER TABLE'
    } else if (statement.includes('CREATE EXTENSION')) {
      description = 'CREATE EXTENSION uuid-ossp'
    }
    
    try {
      console.log(`⏳ [${i + 1}/${statements.length}] Executing: ${description}`)
      
      // Execute SQL via Supabase
      const { data, error } = await supabase.rpc('exec', { sql: statement })
      
      if (error) {
        // If 'exec' RPC doesn't exist, try direct query method
        // This is a fallback - Supabase doesn't have a universal SQL execution endpoint
        // from the client, so we'll document this for manual application
        throw error
      }
      
      console.log(`✅ [${i + 1}/${statements.length}] Success: ${description}`)
      successCount++
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error: any) {
      console.error(`❌ [${i + 1}/${statements.length}] Failed: ${description}`)
      console.error(`   ${error.message}\n`)
      errorCount++
      errors.push({ statement: description, error: error.message })
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log('='.repeat(60) + '\n')
  
  // If there were errors, show detailed error report
  if (errorCount > 0) {
    console.log('❌ ERROR DETAILS:\n')
    errors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.statement}`)
      console.log(`   Error: ${e.error}\n`)
    })
    
    console.log('⚠️  Some statements failed.')
    console.log('💡 This is likely because Supabase client cannot execute DDL statements directly.\n')
    console.log('📋 PLEASE USE MANUAL APPLICATION:\n')
    console.log('1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    console.log('2. Click: SQL Editor')
    console.log('3. Copy and paste: APPLY_THIS_SQL_NOW.sql')
    console.log('4. Click: Run\n')
    return false
  }
  
  // Verify tables were created
  console.log('🔍 Verifying tables were created...\n')
  
  const tablesToCheck = ['health_metrics', 'insurance_policies', 'insurance_claims']
  let allVerified = true
  
  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: NOT FOUND`)
        console.log(`   ${error.message}`)
        allVerified = false
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} records)`)
      }
    } catch (error: any) {
      console.log(`❌ ${table}: ERROR - ${error.message}`)
      allVerified = false
    }
  }
  
  return allVerified
}

async function main() {
  try {
    const success = await executeSQLMigration()
    
    if (success) {
      console.log('\n🎉 Schema fix completed successfully!\n')
      console.log('Next steps:')
      console.log('1. Restart your Next.js dev server')
      console.log('2. Navigate to http://localhost:3000/domains/health')
      console.log('3. Try adding a health metric')
      console.log('4. Navigate to http://localhost:3000/domains/insurance')
      console.log('5. Try adding an insurance policy\n')
      process.exit(0)
    } else {
      console.log('\n⚠️  Could not verify all tables.')
      console.log('Please apply the SQL manually via Supabase Dashboard.\n')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    console.error('\n💡 FALLBACK SOLUTION:')
    console.error('Apply the SQL manually via Supabase Dashboard SQL Editor\n')
    process.exit(1)
  }
}

main()

