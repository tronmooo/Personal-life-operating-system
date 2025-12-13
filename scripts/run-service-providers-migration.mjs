#!/usr/bin/env node
/**
 * Run the service_providers migration
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// Run migrations using raw SQL via postgres extension
async function runMigration() {
  console.log('🚀 Running service_providers migration...\n')

  // Check if tables already exist
  const { data: existingTables, error: checkError } = await supabase
    .from('service_providers')
    .select('id')
    .limit(1)
  
  if (!checkError) {
    console.log('✅ Tables already exist! Migration may have been run already.')
    console.log('   Checking table structure...\n')
    
    // Try to get count
    const { count } = await supabase
      .from('service_providers')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   service_providers: ${count || 0} records`)
    
    const { count: payCount } = await supabase
      .from('service_payments')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   service_payments: ${payCount || 0} records`)
    
    const { count: docCount } = await supabase
      .from('service_documents')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   service_documents: ${docCount || 0} records`)
    
    return true
  }

  // Tables don't exist - need to create via Supabase Dashboard SQL Editor
  console.log('❌ Tables do not exist yet.')
  console.log('\n📋 Please run the following migration in Supabase Dashboard:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql')
  console.log('   2. Copy and paste the contents of:')
  console.log('      supabase/migrations/20251211_service_providers_schema.sql')
  console.log('   3. Click "Run" to execute the migration')
  console.log('\n   OR use Supabase CLI: npx supabase db push')
  
  return false
}

runMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ Migration check complete!')
    }
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })





