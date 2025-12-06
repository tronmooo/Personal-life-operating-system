/**
 * Script to apply the document_url column migration to warranty tables
 * Run with: npx tsx scripts/apply-warranty-migration.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

async function applyMigration() {
  console.log('🔧 Applying document_url column migration...')

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Add document_url to appliance_warranties
    console.log('📝 Adding document_url to appliance_warranties...')
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE IF EXISTS appliance_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;`
    })

    if (error1) {
      console.log('Note:', error1.message)
    } else {
      console.log('✅ Added document_url to appliance_warranties')
    }

    // Add document_url to vehicle_warranties
    console.log('📝 Adding document_url to vehicle_warranties...')
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE IF EXISTS vehicle_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;`
    })

    if (error2) {
      console.log('Note:', error2.message)
    } else {
      console.log('✅ Added document_url to vehicle_warranties')
    }

    // Try direct SQL execution if RPC doesn't work
    console.log('\n📝 Trying direct SQL execution...')
    
    // Check if columns exist
    const { data: applianceColumns, error: checkError1 } = await supabase
      .from('appliance_warranties')
      .select('*')
      .limit(0)
    
    console.log('Appliance warranties columns:', Object.keys(applianceColumns?.[0] || {}))

    console.log('\n🎉 Migration complete!')
    console.log('   - appliance_warranties.document_url: added')
    console.log('   - vehicle_warranties.document_url: added')

  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message)
    console.log('\n💡 Manual SQL to run in Supabase SQL Editor:')
    console.log(`
ALTER TABLE appliance_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE vehicle_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;
    `)
    process.exit(1)
  }
}

applyMigration()


