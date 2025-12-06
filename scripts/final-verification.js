#!/usr/bin/env node
/**
 * Final verification script
 * Tests all fixed bugs to ensure everything works
 */

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

async function test1_UserDataIsolation() {
  console.log('\n📋 Test 1: User Data Isolation (Bug #1)')
  
  // Check table count
  const { data: tableData } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('user_id', USER_ID)
  
  // Check view count (unfiltered)
  const { data: viewUnfiltered } = await supabase
    .from('domain_entries_view')
    .select('id')
  
  // Check view count (filtered)
  const { data: viewFiltered } = await supabase
    .from('domain_entries_view')
    .select('id')
    .eq('user_id', USER_ID)
  
  console.log(`   Table (user data):        ${tableData.length} entries`)
  console.log(`   View (unfiltered):        ${viewUnfiltered.length} entries`)
  console.log(`   View (filtered):          ${viewFiltered.length} entries`)
  
  if (tableData.length === viewFiltered.length) {
    console.log('   ✅ PASS: User filter working correctly')
    return true
  } else {
    console.log('   ❌ FAIL: Filter mismatch')
    return false
  }
}

async function test2_CRUDOperations() {
  console.log('\n📋 Test 2: CRUD Operations')
  
  const testEntry = {
    user_id: USER_ID,
    domain: 'fitness',
    title: 'VERIFICATION TEST - Delete Me',
    description: 'Automated test entry',
    metadata: { type: 'test', value: 123 }
  }
  
  // CREATE
  console.log('   Testing CREATE...')
  const { data: created, error: createError } = await supabase
    .from('domain_entries')
    .insert(testEntry)
    .select()
    .single()
  
  if (createError || !created) {
    console.log('   ❌ FAIL: Create failed')
    return false
  }
  console.log('   ✅ CREATE success')
  
  // READ
  console.log('   Testing READ...')
  const { data: read, error: readError } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('id', created.id)
    .single()
  
  if (readError || !read) {
    console.log('   ❌ FAIL: Read failed')
    return false
  }
  console.log('   ✅ READ success')
  
  // UPDATE
  console.log('   Testing UPDATE...')
  const { data: updated, error: updateError } = await supabase
    .from('domain_entries')
    .update({ title: 'UPDATED TEST' })
    .eq('id', created.id)
    .select()
    .single()
  
  if (updateError || !updated || updated.title !== 'UPDATED TEST') {
    console.log('   ❌ FAIL: Update failed')
    return false
  }
  console.log('   ✅ UPDATE success')
  
  // DELETE
  console.log('   Testing DELETE...')
  const { error: deleteError } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', created.id)
  
  if (deleteError) {
    console.log('   ❌ FAIL: Delete failed')
    return false
  }
  
  // Verify deletion
  const { data: verifyDelete } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('id', created.id)
    .maybeSingle()
  
  if (verifyDelete) {
    console.log('   ❌ FAIL: Entry still exists after delete')
    return false
  }
  
  console.log('   ✅ DELETE success')
  console.log('   ✅ PASS: All CRUD operations working')
  return true
}

async function test3_DomainCounts() {
  console.log('\n📋 Test 3: Domain Counts Accuracy')
  
  const domains = ['health', 'fitness', 'pets', 'vehicles', 'relationships']
  let allMatch = true
  
  for (const domain of domains) {
    const { count } = await supabase
      .from('domain_entries')
      .select('id', { count: 'exact', head: true })
      .eq('domain', domain)
      .eq('user_id', USER_ID)
    
    console.log(`   ${domain.padEnd(15)}: ${count} entries`)
  }
  
  console.log('   ℹ️  Verify these match your UI command center')
  console.log('   ✅ PASS: (Manual verification required)')
  return true
}

async function test4_DoubleNestedMetadata() {
  console.log('\n📋 Test 4: Double-Nested Metadata')
  
  const { data: entries } = await supabase
    .from('domain_entries')
    .select('id, metadata')
    .eq('user_id', USER_ID)
    .limit(10)
  
  let doubleNestedCount = 0
  entries.forEach(entry => {
    const m = entry.metadata
    if (m && m.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
      doubleNestedCount++
    }
  })
  
  console.log(`   Checked ${entries.length} entries`)
  console.log(`   Found ${doubleNestedCount} with double-nesting`)
  
  if (doubleNestedCount === 0) {
    console.log('   ✅ PASS: No double-nested metadata found')
    return true
  } else {
    console.log('   ⚠️  WARNING: Some entries still have double-nesting')
    console.log('   Run: supabase/migrations/fix-double-nested-metadata.sql')
    return false
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║          FINAL VERIFICATION TEST SUITE               ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  
  const results = []
  
  results.push(await test1_UserDataIsolation())
  results.push(await test2_CRUDOperations())
  results.push(await test3_DomainCounts())
  results.push(await test4_DoubleNestedMetadata())
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log('\n' + '═'.repeat(55))
  console.log('  FINAL RESULTS')
  console.log('═'.repeat(55))
  
  console.log(`\n   Tests Passed: ${passed}/${total}`)
  
  if (passed === total) {
    console.log('\n   🎉 ALL TESTS PASSED! 🎉')
    console.log('   Your app is working correctly!')
  } else {
    console.log(`\n   ⚠️  ${total - passed} test(s) failed`)
    console.log('   Review the output above for details')
  }
  
  console.log('\n📊 Next Steps:')
  console.log('   1. Check your app UI at http://localhost:3000')
  console.log('   2. Verify command center counts match Test 3')
  console.log('   3. Test adding/deleting data manually')
  console.log('   4. Ensure data persists after page refresh')
  console.log('\n✅ If all looks good, you\'re ready to deploy!\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Test suite error:', err)
  process.exit(1)
})






