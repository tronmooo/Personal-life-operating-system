#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '3d67799c-7367-41a8-b4da-a7598c02f346'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('\n🔍 Comparing domain_entries_view vs domain_entries table\n')
  
  // Query table directly
  const { data: tableData, error: tableError } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('user_id', USER_ID)
  
  // Query view
  const { data: viewData, error: viewError } = await supabase
    .from('domain_entries_view')
    .select('id')
  
  if (tableError) {
    console.error('Table error:', tableError)
    return
  }
  
  if (viewError) {
    console.error('View error:', viewError)
    return
  }
  
  console.log(`📊 domain_entries (table): ${tableData.length} rows`)
  console.log(`📊 domain_entries_view:    ${viewData.length} rows`)
  
  if (tableData.length !== viewData.length) {
    console.log('\n🔴 MISMATCH DETECTED!')
    console.log(`   View has ${viewData.length - tableData.length} MORE rows than table`)
    console.log('\nThis explains why the UI shows 257 items but database has 91!')
    console.log('\n💡 Solution: The view might be combining multiple tables')
    console.log('   or including data from other users.')
  } else {
    console.log('\n✅ Counts match!')
  }
  
  // Check if view has RLS
  console.log('\n🔐 Checking if view filters by user_id...')
  const { data: viewWithUser } = await supabase
    .from('domain_entries_view')
    .select('id')
    .eq('user_id', USER_ID)
  
  console.log(`   View with user_id filter: ${viewWithUser?.length || 0} rows`)
  
  if (viewWithUser && viewWithUser.length === tableData.length) {
    console.log('\n✅ View needs user_id filter!')
    console.log('   The view query should include .eq("user_id", user.id)')
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






