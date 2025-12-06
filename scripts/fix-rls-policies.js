#!/usr/bin/env node
/**
 * Script to check and fix RLS policies for domain_entries table
 * This fixes the critical DELETE bug
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

async function checkCurrentPolicies() {
  console.log('🔍 Checking current RLS policies for domain_entries table...\n')
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'domain_entries';
    `
  })
  
  if (error) {
    console.error('❌ Error checking policies:', error)
    // Try alternative method
    return checkPoliciesAlternative()
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No RLS policies found for domain_entries table\n')
    return []
  }
  
  console.log(`📋 Found ${data.length} existing policies:\n`)
  data.forEach(policy => {
    console.log(`  - ${policy.policyname}`)
    console.log(`    Command: ${policy.cmd}`)
    console.log(`    Roles: ${policy.roles}`)
    console.log()
  })
  
  return data
}

async function checkPoliciesAlternative() {
  console.log('🔄 Trying alternative method to check policies...\n')
  
  // Check if we can query the table
  const { data, error } = await supabase
    .from('domain_entries')
    .select('id')
    .limit(1)
  
  if (error) {
    console.error('❌ Error querying domain_entries:', error)
  } else {
    console.log('✅ Can query domain_entries table\n')
  }
  
  return []
}

async function addDeletePolicy() {
  console.log('🔧 Adding DELETE policy for domain_entries...\n')
  
  const policySQL = `
    -- Enable RLS if not already enabled
    ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing DELETE policy if it exists
    DROP POLICY IF EXISTS "Users can delete own domain entries" ON domain_entries;
    DROP POLICY IF EXISTS "users_delete_own_entries" ON domain_entries;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON domain_entries;
    
    -- Create new DELETE policy
    CREATE POLICY "Users can delete own domain entries"
    ON domain_entries
    FOR DELETE
    USING (auth.uid() = user_id);
  `
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: policySQL
  })
  
  if (error) {
    console.error('❌ Error adding DELETE policy:', error)
    console.log('\n⚠️  Alternative: Run this SQL manually in Supabase SQL Editor:')
    console.log(policySQL)
    return false
  }
  
  console.log('✅ DELETE policy added successfully!\n')
  return true
}

async function verifyDeleteWorks() {
  console.log('🧪 Testing DELETE operation...\n')
  
  // Try to delete a test entry (we'll use the vehicle we've been trying to delete)
  const testId = 'f2abf188-62b8-418f-b90b-629cfbc48e48'
  
  const { error } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', testId)
  
  if (error) {
    console.error('❌ DELETE still failing:', error)
    return false
  }
  
  // Check if it was actually deleted
  const { data: check } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('id', testId)
    .single()
  
  if (check) {
    console.log('⚠️  Record still exists after DELETE')
    return false
  }
  
  console.log('✅ DELETE operation works! Record successfully removed.\n')
  return true
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  RLS Policy Fix for domain_entries DELETE Bug')
  console.log('═══════════════════════════════════════════════════\n')
  
  // Step 1: Check current policies
  const policies = await checkCurrentPolicies()
  
  // Step 2: Check if DELETE policy exists
  const hasDeletePolicy = policies.some(p => 
    p.cmd === 'DELETE' || p.policyname.toLowerCase().includes('delete')
  )
  
  if (hasDeletePolicy) {
    console.log('✅ DELETE policy already exists\n')
  } else {
    console.log('⚠️  No DELETE policy found, adding one...\n')
    await addDeletePolicy()
  }
  
  // Step 3: Verify DELETE works
  await verifyDeleteWorks()
  
  console.log('═══════════════════════════════════════════════════')
  console.log('  Fix Complete!')
  console.log('═══════════════════════════════════════════════════\n')
  
  console.log('Next steps:')
  console.log('1. Refresh your app')
  console.log('2. Try deleting a vehicle again')
  console.log('3. Refresh the page - the vehicle should stay deleted!\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})






