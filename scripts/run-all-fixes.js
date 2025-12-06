#!/usr/bin/env node
/**
 * Master script to run all database fixes
 * Reads SQL migration files and executes them in order
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

const migrations = [
  {
    name: 'Fix DELETE RLS Policy',
    file: 'supabase/migrations/fix-delete-rls-policy.sql',
    critical: true
  },
  {
    name: 'Fix Double-Nested Metadata',
    file: 'supabase/migrations/fix-double-nested-metadata.sql',
    critical: false
  },
  {
    name: 'Create Missing Tables',
    file: 'supabase/migrations/create-missing-tables.sql',
    critical: false
  }
]

async function runMigration(migration) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔧 Running: ${migration.name}`)
  console.log(`   File: ${migration.file}`)
  console.log('='.repeat(60))
  
  try {
    const sqlContent = fs.readFileSync(
      path.join(__dirname, '..', migration.file),
      'utf8'
    )
    
    console.log(`\n📄 SQL Preview (first 200 chars):`)
    console.log(sqlContent.substring(0, 200) + '...\n')
    
    // Note: Supabase JS client doesn't support raw SQL execution
    // These migrations need to be run in the Supabase SQL Editor
    console.log('⚠️  This migration must be run manually in Supabase SQL Editor')
    console.log('   Navigate to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql')
    console.log(`   Copy and paste the contents of: ${migration.file}\n`)
    
    return { success: true, manual: true }
    
  } catch (error) {
    console.error(`❌ Error reading migration file:`, error.message)
    return { success: false, error }
  }
}

async function testDeleteOperation() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 Testing DELETE Operation')
  console.log('='.repeat(60) + '\n')
  
  // Try to delete the problematic vehicle
  const testId = 'f2abf188-62b8-418f-b90b-629cfbc48e48'
  
  console.log(`Attempting to DELETE vehicle: ${testId}`)
  
  const { data: before, error: beforeError } = await supabase
    .from('domain_entries')
    .select('id, title')
    .eq('id', testId)
    .single()
  
  if (beforeError || !before) {
    console.log('ℹ️  Vehicle already deleted or doesn\'t exist')
    return true
  }
  
  console.log(`   Found: ${before.title}`)
  
  const { error: deleteError } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', testId)
  
  if (deleteError) {
    console.error('❌ DELETE failed:', deleteError.message)
    console.log('\n⚠️  RLS policy may not be applied yet. Run the migration first!')
    return false
  }
  
  // Verify deletion
  const { data: after } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('id', testId)
    .single()
  
  if (after) {
    console.log('❌ Vehicle still exists after DELETE')
    console.log('   RLS policy is blocking deletion!')
    return false
  }
  
  console.log('✅ DELETE successful! Vehicle permanently removed.\n')
  return true
}

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('  LifeHub Database Fixes - Migration Runner')
  console.log('═'.repeat(60))
  
  console.log('\n📋 Migrations to run:\n')
  migrations.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name} ${m.critical ? '(CRITICAL)' : ''}`)
  })
  
  console.log('\n⚠️  IMPORTANT: These SQL migrations must be run manually')
  console.log('   in the Supabase SQL Editor because the JS client')
  console.log('   doesn\'t support raw SQL execution.\n')
  
  const results = []
  for (const migration of migrations) {
    const result = await runMigration(migration)
    results.push({ migration, result })
  }
  
  console.log('\n' + '═'.repeat(60))
  console.log('  Migration Summary')
  console.log('═'.repeat(60) + '\n')
  
  results.forEach(({ migration, result }) => {
    const status = result.manual ? '📄 Manual' : result.success ? '✅' : '❌'
    console.log(`${status} ${migration.name}`)
  })
  
  console.log('\n' + '═'.repeat(60))
  console.log('  Next Steps')
  console.log('═'.repeat(60) + '\n')
  
  console.log('1. Go to Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql\n')
  
  console.log('2. Run each migration file in order:')
  migrations.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.file}`)
  })
  
  console.log('\n3. After running all migrations, test DELETE:')
  console.log('   node scripts/test-delete.js\n')
  
  console.log('4. Or test manually in your app:')
  console.log('   - Navigate to Vehicles page')
  console.log('   - Delete a vehicle')
  console.log('   - Refresh the page')
  console.log('   - Vehicle should stay deleted!\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})






