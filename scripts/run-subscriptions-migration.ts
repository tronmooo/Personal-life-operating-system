/**
 * Run Digital Life Subscriptions Migration
 * Usage: npx tsx scripts/run-subscriptions-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jphpxqqilrjyypztkswc.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🚀 Starting Digital Life Subscriptions Migration...\n')
    console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20251211_subscriptions_schema.sql')
    console.log(`📖 Reading migration file: ${migrationPath}`)
    
    const sqlContent = readFileSync(migrationPath, 'utf8')
    console.log(`✅ Migration file loaded (${sqlContent.length} characters)\n`)

    // Split into individual statements (basic split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    console.log('⚙️  Executing migration...\n')

    // Execute each statement
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...'
      
      try {
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).single()

        if (error) {
          // Check if it's an "already exists" error - these are OK
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate')
          ) {
            console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${preview}`)
            skipCount++
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Error: ${preview}`)
            console.error(`   ${error.message}\n`)
            errorCount++
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Success: ${preview}`)
          successCount++
        }
      } catch (err: any) {
        console.error(`❌ [${i + 1}/${statements.length}] Exception: ${preview}`)
        console.error(`   ${err.message}\n`)
        errorCount++
      }

      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ⏭️  Skipped: ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(60) + '\n')

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!\n')
      
      // Verify tables exist
      console.log('🔍 Verifying tables...\n')
      
      const { data: tables, error: tablesError } = await supabase
        .from('subscriptions')
        .select('id')
        .limit(1)

      if (!tablesError) {
        console.log('✅ subscriptions table exists and is accessible')
      } else {
        console.log('⚠️  Could not verify subscriptions table:', tablesError.message)
      }

      const { data: charges, error: chargesError } = await supabase
        .from('subscription_charges')
        .select('id')
        .limit(1)

      if (!chargesError) {
        console.log('✅ subscription_charges table exists and is accessible\n')
      } else {
        console.log('⚠️  Could not verify subscription_charges table:', chargesError.message, '\n')
      }

      console.log('🚀 Ready to test! Start your dev server and visit:')
      console.log('   http://localhost:3000/domains/digital\n')
    } else {
      console.log('⚠️  Migration completed with errors. Please review the errors above.\n')
    }

  } catch (error: any) {
    console.error('❌ Fatal error running migration:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the migration
runMigration()


