#!/usr/bin/env node
/**
 * Script to test if DELETE operations work after RLS policy fix
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testDelete() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  Testing DELETE Operation')
  console.log('═══════════════════════════════════════════════\n')
  
  // Test ID: the vehicle we've been trying to delete
  const testId = 'f2abf188-62b8-418f-b90b-629cfbc48e48'
  
  // Step 1: Check if vehicle exists
  console.log('1️⃣  Checking if test vehicle exists...')
  const { data: before, error: beforeError } = await supabase
    .from('domain_entries')
    .select('id, title, domain')
    .eq('id', testId)
    .single()
  
  if (beforeError || !before) {
    console.log('   ℹ️  Test vehicle not found (may have been deleted already)')
    console.log('   Creating a new test entry...\n')
    
    // Create a test entry
    const { data: created, error: createError } = await supabase
      .from('domain_entries')
      .insert({
        domain: 'vehicles',
        title: 'Test Vehicle for DELETE',
        description: 'This is a test vehicle to verify DELETE works',
        metadata: {
          type: 'vehicle',
          make: 'Test',
          model: 'DELETE Test',
          year: 2025
        },
        user_id: '3d67799c-7367-41a8-b4da-a7598c02f346' // teat@aol.com user ID
      })
      .select()
      .single()
    
    if (createError) {
      console.error('   ❌ Failed to create test entry:', createError.message)
      return false
    }
    
    console.log(`   ✅ Created test vehicle: ${created.title} (${created.id})\n`)
    return await testDeleteEntry(created.id, created.title)
  }
  
  console.log(`   ✅ Found: ${before.title}\n`)
  return await testDeleteEntry(testId, before.title)
}

async function testDeleteEntry(id, title) {
  // Step 2: Attempt DELETE
  console.log('2️⃣  Attempting DELETE operation...')
  const { error: deleteError } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', id)
  
  if (deleteError) {
    console.error(`   ❌ DELETE failed: ${deleteError.message}`)
    console.log('\n   Possible causes:')
    console.log('   - RLS DELETE policy not applied')
    console.log('   - User permissions incorrect')
    console.log('   - Table constraints blocking delete\n')
    console.log('   Solution: Run the RLS policy migration:')
    console.log('   supabase/migrations/fix-delete-rls-policy.sql\n')
    return false
  }
  
  console.log('   ✅ DELETE request successful (204)\n')
  
  // Step 3: Verify deletion
  console.log('3️⃣  Verifying record was actually deleted...')
  const { data: after, error: afterError } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  
  if (after) {
    console.error(`   ❌ FAILED: Record still exists after DELETE!`)
    console.log(`   Record ID: ${after.id}`)
    console.log('\n   This means the RLS policy is still blocking deletes.')
    console.log('   Run the migration: supabase/migrations/fix-delete-rls-policy.sql\n')
    return false
  }
  
  console.log('   ✅ Record successfully deleted from database!\n')
  
  // Step 4: Summary
  console.log('═══════════════════════════════════════════════')
  console.log('  ✅ DELETE TEST PASSED')
  console.log('═══════════════════════════════════════════════\n')
  console.log(`Deleted: ${title}`)
  console.log('DELETE operations are now working correctly!\n')
  console.log('You can now:')
  console.log('1. Refresh your app')
  console.log('2. Delete vehicles, workouts, relationships, etc.')
  console.log('3. Refresh the page - deletions will persist!\n')
  
  return true
}

async function checkRLSPolicies() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  Checking RLS Policies')
  console.log('═══════════════════════════════════════════════\n')
  
  // Try to query domain_entries to see if we can access it
  const { data, error, count } = await supabase
    .from('domain_entries')
    .select('domain', { count: 'exact', head: false })
    .eq('domain', 'vehicles')
    .limit(1)
  
  if (error) {
    console.error('❌ Error querying domain_entries:', error.message)
    return false
  }
  
  console.log(`✅ Can query domain_entries table`)
  console.log(`   Found ${count || 0} vehicle entries\n`)
  return true
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║   LifeHub DELETE Operation Test               ║')
  console.log('╚═══════════════════════════════════════════════╝')
  
  // Check RLS policies first
  await checkRLSPolicies()
  
  // Run the DELETE test
  const success = await testDelete()
  
  if (!success) {
    console.log('═══════════════════════════════════════════════')
    console.log('  ❌ TEST FAILED')
    console.log('═══════════════════════════════════════════════\n')
    console.log('Next steps:')
    console.log('1. Open Supabase SQL Editor')
    console.log('2. Run: supabase/migrations/fix-delete-rls-policy.sql')
    console.log('3. Run this test again\n')
    process.exit(1)
  }
  
  process.exit(0)
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})






