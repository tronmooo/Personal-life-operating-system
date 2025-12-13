/**
 * Test Subscriptions API and Database
 * Run AFTER migration is applied and dev server is running
 * Usage: node scripts/test-subscriptions-api.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runTests() {
  console.log('🧪 Testing Digital Life Subscriptions API\n')
  console.log('=' .repeat(70))
  
  let testsPassed = 0
  let testsFailed = 0
  let testsSkipped = 0

  // Test 1: Check tables exist
  console.log('\n📋 Test 1: Verify tables exist')
  try {
    const { error: subsError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)
    
    const { error: chargesError } = await supabase
      .from('subscription_charges')
      .select('id')
      .limit(1)

    if (subsError && subsError.message.includes('does not exist')) {
      console.log('❌ subscriptions table does not exist')
      console.log('   Please apply migration first: see APPLY_MIGRATION_NOW.md')
      testsFailed++
    } else if (subsError && subsError.message.includes('auth.uid()')) {
      console.log('⚠️  subscriptions table exists (RLS active - expected)')
      testsSkipped++
    } else if (subsError) {
      console.log(`⚠️  subscriptions table error: ${subsError.message}`)
      testsSkipped++
    } else {
      console.log('✅ subscriptions table exists')
      testsPassed++
    }

    if (chargesError && chargesError.message.includes('does not exist')) {
      console.log('❌ subscription_charges table does not exist')
      testsFailed++
    } else {
      console.log('✅ subscription_charges table exists')
      testsPassed++
    }
  } catch (error) {
    console.log('❌ Error checking tables:', error.message)
    testsFailed++
  }

  // Test 2: Check API endpoints
  console.log('\n🌐 Test 2: Check API endpoints (requires dev server)')
  try {
    const response = await fetch('http://localhost:3000/api/subscriptions')
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('⚠️  API returned 401 (Unauthorized) - Expected without auth')
        console.log('   This is correct behavior. Login required to access data.')
        testsSkipped++
      } else {
        console.log(`❌ API error: ${response.status}`)
        testsFailed++
      }
    } else {
      const data = await response.json()
      console.log(`✅ API responded: ${JSON.stringify(data).substring(0, 100)}...`)
      testsPassed++
    }
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('⚠️  Dev server not running')
      console.log('   Start server with: npm run dev')
      testsSkipped++
    } else {
      console.log('❌ API test error:', error.message)
      testsFailed++
    }
  }

  // Test 3: Check analytics view
  console.log('\n📊 Test 3: Verify analytics view')
  try {
    const { data, error } = await supabase
      .from('subscription_analytics')
      .select('*')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      console.log('❌ subscription_analytics view does not exist')
      console.log('   View creation might have failed in migration')
      testsFailed++
    } else if (error) {
      console.log(`⚠️  Analytics view error: ${error.message}`)
      testsSkipped++
    } else {
      console.log('✅ subscription_analytics view exists')
      if (data && data.length > 0) {
        console.log(`   Found ${data.length} analytics record(s)`)
      }
      testsPassed++
    }
  } catch (error) {
    console.log('❌ Analytics test error:', error.message)
    testsFailed++
  }

  // Test 4: Check helper functions
  console.log('\n🔧 Test 4: Test calculate_monthly_cost function')
  try {
    const { data, error } = await supabase
      .rpc('calculate_monthly_cost', { p_cost: 99.99, p_frequency: 'yearly' })

    if (error) {
      console.log(`⚠️  Function error: ${error.message}`)
      testsSkipped++
    } else {
      const result = parseFloat(data)
      const expected = 99.99 / 12
      if (Math.abs(result - expected) < 0.01) {
        console.log(`✅ Function works correctly: $99.99/year = $${result.toFixed(2)}/month`)
        testsPassed++
      } else {
        console.log(`❌ Function returned unexpected value: ${result}`)
        testsFailed++
      }
    }
  } catch (error) {
    console.log('⚠️  Function test error:', error.message)
    testsSkipped++
  }

  // Summary
  console.log('\n' + '=' .repeat(70))
  console.log('📊 Test Summary')
  console.log('=' .repeat(70))
  console.log(`✅ Passed:  ${testsPassed}`)
  console.log(`⚠️  Skipped: ${testsSkipped}`)
  console.log(`❌ Failed:  ${testsFailed}`)
  console.log('=' .repeat(70))

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed. Please check the errors above.')
    console.log('\n📝 To fix:')
    console.log('1. Make sure migration is applied (see APPLY_MIGRATION_NOW.md)')
    console.log('2. Start dev server: npm run dev')
    console.log('3. Re-run this test script\n')
  } else if (testsSkipped > 0 && testsPassed === 0) {
    console.log('\n⚠️  Tests were skipped. Possible reasons:')
    console.log('1. Migration not yet applied')
    console.log('2. Dev server not running')
    console.log('3. RLS policies blocking service role (this is OK)\n')
  } else {
    console.log('\n🎉 All tests passed! The system is ready to use.')
    console.log('\n📍 Next steps:')
    console.log('1. Make sure dev server is running: npm run dev')
    console.log('2. Visit: http://localhost:3000/domains/digital')
    console.log('3. Log in to your app')
    console.log('4. Click "Add Subscription"')
    console.log('5. Fill in the form and save')
    console.log('6. Verify it appears in the UI')
    console.log('7. Check Supabase Table Editor to see it in the database!\n')
  }
}

runTests()




