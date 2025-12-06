#!/usr/bin/env tsx
/**
 * Script to apply RLS policies migration to Supabase
 * This fixes authentication issues when adding data to domains
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
// import * as dotenv from 'dotenv'

// Load environment variables
// dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
// Note: Environment variables should be set in your shell or loaded externally

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔧 Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSMigration() {
  try {
    console.log('📖 Reading RLS migration file...')
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251026_add_rls_policies.sql'
    )

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split the SQL into individual statements (split by semicolons that end lines)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) {
        skipCount++
        continue
      }

      try {
        console.log(`\n⚙️  Executing statement ${i + 1}/${statements.length}...`)

        // Execute the statement using raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          // If the error is about policy already existing, that's OK - skip it
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  Policy/constraint already exists, skipping...')
            skipCount++
            continue
          }

          throw error
        }

        successCount++
        console.log('✅ Statement executed successfully')
      } catch (err: any) {
        // Check if it's a "already exists" error
        if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
          console.log('ℹ️  Already exists, skipping...')
          skipCount++
          continue
        }

        console.error(`❌ Error executing statement ${i + 1}:`, err.message)
        console.error('Statement:', statement.substring(0, 200))
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📊 Migration Summary:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ℹ️  Skipped: ${skipCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n✨ RLS policies migration completed successfully!')
      console.log('🔐 Your domain_entries table now has Row Level Security enabled.')
      console.log('👤 Users can only access their own data.')
    } else {
      console.log('\n⚠️  Migration completed with some errors.')
      console.log('Please review the errors above and apply fixes manually if needed.')
    }

  } catch (error: any) {
    console.error('❌ Fatal error applying RLS migration:', error.message)
    process.exit(1)
  }
}

// Alternative: Direct SQL execution using Supabase's SQL endpoint
async function applyRLSMigrationDirect() {
  try {
    console.log('📖 Reading RLS migration file...')
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251026_add_rls_policies.sql'
    )

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('⚙️  Applying RLS policies via direct SQL...')

    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey!,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: migrationSQL })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Failed to apply migration:', error)

      // Try statement-by-statement approach
      console.log('\n⚠️  Falling back to statement-by-statement execution...')
      await applyRLSMigration()
      return
    }

    console.log('✅ RLS policies applied successfully!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️  Trying alternative method...')
    await applyRLSMigration()
  }
}

// Run the migration
console.log('🚀 Starting RLS Migration Application\n')
applyRLSMigrationDirect()
