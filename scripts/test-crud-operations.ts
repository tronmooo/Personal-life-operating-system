/**
 * Script to test CRUD operations across all domains
 * Run with: npx tsx scripts/test-crud-operations.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jphpxqqilrjyypztkswc.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODczODAsImV4cCI6MjA3MDE2MzM4MH0.MPMupsJ3qw5SUxIqQ3lBT2NZ054LtBV_5e6w5RvZT9Y'

const supabase = createClient(supabaseUrl, supabaseKey)

const ALL_DOMAINS = [
  'health', 'financial', 'insurance', 'home', 'vehicles', 'appliances',
  'pets', 'education', 'relationships', 'digital', 'mindfulness',
  'fitness', 'nutrition', 'legal'
]

async function testCRUDOperations() {
  console.log('🧪 Testing CRUD Operations Across All Domains\n')
  console.log('=' .repeat(60))

  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    console.error('❌ Not authenticated. Please ensure you are logged in.')
    console.log('\nTo fix this:')
    console.log('1. Start the dev server: npm run dev')
    console.log('2. Login at http://localhost:3000/auth')
    console.log('3. Run this script again\n')
    return
  }

  console.log(`✅ Authenticated as: ${session.user.email}\n`)

  const results: Record<string, any> = {}

  for (const domain of ALL_DOMAINS) {
    console.log(`\n📂 Testing domain: ${domain}`)
    console.log('-'.repeat(60))

    try {
      // 1. COUNT existing entries
      const { count: beforeCount, error: countError } = await supabase
        .from('domain_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('domain', domain)

      if (countError) {
        console.error(`   ❌ Count failed:`, countError.message)
        results[domain] = { error: 'count_failed', details: countError }
        continue
      }

      console.log(`   📊 Current entries: ${beforeCount}`)

      // 2. CREATE a test entry
      const testEntry = {
        user_id: session.user.id,
        domain,
        title: `Test ${domain} Entry - ${new Date().toISOString()}`,
        description: 'Test entry created by CRUD test script',
        metadata: {
          test: true,
          createdBy: 'crud-test-script',
          timestamp: new Date().toISOString()
        }
      }

      const { data: created, error: createError } = await supabase
        .from('domain_entries')
        .insert(testEntry)
        .select()
        .single()

      if (createError) {
        console.error(`   ❌ CREATE failed:`, createError.message)
        results[domain] = { error: 'create_failed', details: createError }
        continue
      }

      console.log(`   ✅ CREATE successful - ID: ${created.id}`)

      // 3. READ the entry back
      const { data: read, error: readError } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('id', created.id)
        .single()

      if (readError) {
        console.error(`   ❌ READ failed:`, readError.message)
        results[domain] = { error: 'read_failed', details: readError, createdId: created.id }
        continue
      }

      console.log(`   ✅ READ successful - Title: ${read.title}`)

      // 4. UPDATE the entry
      const { data: updated, error: updateError } = await supabase
        .from('domain_entries')
        .update({
          title: `Updated ${domain} Entry`,
          metadata: {
            ...read.metadata,
            updated: true,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', created.id)
        .select()
        .single()

      if (updateError) {
        console.error(`   ❌ UPDATE failed:`, updateError.message)
        results[domain] = { error: 'update_failed', details: updateError, createdId: created.id }
        // Try to cleanup
        await supabase.from('domain_entries').delete().eq('id', created.id)
        continue
      }

      console.log(`   ✅ UPDATE successful - Title: ${updated.title}`)

      // 5. DELETE the entry
      const { error: deleteError } = await supabase
        .from('domain_entries')
        .delete()
        .eq('id', created.id)

      if (deleteError) {
        console.error(`   ❌ DELETE failed:`, deleteError.message)
        results[domain] = { error: 'delete_failed', details: deleteError, createdId: created.id }
        continue
      }

      console.log(`   ✅ DELETE successful`)

      // 6. Verify deletion
      const { data: verifyDeleted, error: verifyError } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('id', created.id)
        .maybeSingle()

      if (verifyError) {
        console.error(`   ⚠️  DELETE verification failed:`, verifyError.message)
      } else if (verifyDeleted) {
        console.error(`   ❌ DELETE verification failed - entry still exists`)
        results[domain] = { error: 'delete_not_verified', details: 'Entry still exists after delete' }
      } else {
        console.log(`   ✅ DELETE verified - entry removed`)
        results[domain] = { success: true }
      }

    } catch (error: any) {
      console.error(`   ❌ Unexpected error:`, error.message || error)
      results[domain] = { error: 'unexpected', details: error }
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const successDomains = Object.entries(results).filter(([_, r]) => r.success).map(([d]) => d)
  const failedDomains = Object.entries(results).filter(([_, r]) => !r.success)

  console.log(`\n✅ Successful: ${successDomains.length}/${ALL_DOMAINS.length}`)
  if (successDomains.length > 0) {
    console.log(`   ${successDomains.join(', ')}`)
  }

  if (failedDomains.length > 0) {
    console.log(`\n❌ Failed: ${failedDomains.length}/${ALL_DOMAINS.length}`)
    failedDomains.forEach(([domain, result]) => {
      console.log(`   ${domain}: ${result.error}`)
      if (result.details) {
        console.log(`      ${JSON.stringify(result.details).substring(0, 100)}...`)
      }
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Test completed!\n')
}

// Run the tests
testCRUDOperations().catch(console.error)
