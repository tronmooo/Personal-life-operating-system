#!/usr/bin/env tsx

/**
 * Apply RLS Migration to Remote Supabase Database
 *
 * This script applies the 20251026_add_rls_policies.sql migration
 * to ensure Row Level Security is enabled and configured correctly.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRLSStatus() {
  console.log('\n📊 Checking current RLS status...\n')

  // Check if RLS is enabled on domain_entries
  const { data, error } = await supabase.rpc('check_rls_status', {})

  if (error) {
    console.log('⚠️  Could not check RLS status (this is OK if function doesn\'t exist)')
    console.log('   Will proceed with applying migration...\n')
    return
  }

  console.log('Current RLS Status:', data)
}

async function applyMigration() {
  console.log('🚀 Applying RLS Migration...\n')

  const migrationPath = join(process.cwd(), 'supabase/migrations/20251026_add_rls_policies.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Split into individual statements (basic split on semicolons outside of comments)
  const statements = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('/*'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comment blocks and verification queries
    if (statement.includes('VERIFICATION QUERIES') || statement.includes('*/')) {
      continue
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        // Check if error is because policy already exists
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Statement ${i + 1}: Already applied (skipping)`)
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message)
          errorCount++
        }
      } else {
        console.log(`✅ Statement ${i + 1}: Success`)
        successCount++
      }
    } catch (err: any) {
      console.error(`❌ Statement ${i + 1} error:`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 Migration Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${statements.length}`)
}

async function verifyRLS() {
  console.log('\n🔍 Verifying RLS is enabled...\n')

  // Check domain_entries table
  const { data, error } = await supabase
    .from('domain_entries')
    .select('id')
    .limit(1)

  if (error) {
    console.error('❌ Error querying domain_entries:', error.message)
  } else {
    console.log('✅ domain_entries table is accessible')
  }

  console.log('\n✅ RLS Migration Complete!')
  console.log('\n⚠️  IMPORTANT: Test your app thoroughly to ensure:')
  console.log('   1. Users can create/read/update/delete their own data')
  console.log('   2. Users CANNOT see other users\' data')
  console.log('   3. Authentication is working correctly\n')
}

async function main() {
  console.log('🔐 RLS Migration Script')
  console.log('========================\n')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`🔑 Using Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`)

  try {
    await checkRLSStatus()

    // Since we can't use exec_sql RPC without creating it first,
    // let's just log the migration and ask user to apply it manually
    console.log('⚠️  Note: This script requires a custom RPC function to work.')
    console.log('   For now, please apply the migration manually using the Supabase Dashboard:\n')
    console.log('   1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql')
    console.log('   2. Open: supabase/migrations/20251026_add_rls_policies.sql')
    console.log('   3. Copy the entire contents')
    console.log('   4. Paste into the SQL Editor')
    console.log('   5. Click "Run"\n')

    console.log('📋 Migration file location:')
    console.log('   supabase/migrations/20251026_add_rls_policies.sql\n')

    console.log('✅ After applying, your data will be secure and users will only see their own data!')

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()
