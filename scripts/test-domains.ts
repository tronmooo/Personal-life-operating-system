#!/usr/bin/env tsx
/**
 * Domain Functionality Test Script
 * Tests all 14 domains to ensure they're working correctly
 */

import { createClient } from '@supabase/supabase-js'
// import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
// const envPath = path.join(__dirname, '..', '.env.local')
// try {
//   dotenv.config({ path: envPath })
// } catch (e) {
//   console.log('⚠️  Note: dotenv not installed, using environment variables from shell')
// }
console.log('📝 Note: Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test user ID (use your actual user ID)
const TEST_USER_ID = process.env.TEST_USER_ID || '713c0e33-31aa-4bb8-bf27-476b5eba942e'

interface TestResult {
  domain: string
  icon: string
  passed: boolean
  tests: {
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  errors: string[]
  entryCount: number
}

const DOMAINS = [
  { id: 'financial', name: 'Financial', icon: '💰', testData: { title: 'Test Account', metadata: { accountType: 'checking', balance: 1000 } } },
  { id: 'health', name: 'Health', icon: '❤️', testData: { title: 'Test Vital', metadata: { type: 'vitals', weight: 150, bloodPressure: '120/80' } } },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', testData: { title: 'Test Policy', metadata: { itemType: 'policy', provider: 'Test Insurance', type: 'health' } } },
  { id: 'home', name: 'Home', icon: '🏠', testData: { title: 'Test Property', metadata: { type: 'property', address: '123 Test St', propertyType: 'primary' } } },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', testData: { title: 'Test Car', metadata: { make: 'Toyota', model: 'Camry', year: 2020, vin: 'TEST123456' } } },
  { id: 'appliances', name: 'Appliances', icon: '🔧', testData: { title: 'Test Appliance', metadata: { name: 'Test Fridge', category: 'Kitchen', brand: 'TestBrand' } } },
  { id: 'pets', name: 'Pets', icon: '🐾', testData: { title: 'Test Pet', metadata: { itemType: 'profile', name: 'Test Dog', species: 'Dog', breed: 'Labrador' } } },
  { id: 'relationships', name: 'Relationships', icon: '👥', testData: { title: 'Test Contact', metadata: { name: 'Test Person', relationship: 'friend', phone: '555-0100' } } },
  { id: 'digital', name: 'Digital', icon: '💻', testData: { title: 'Test Subscription', metadata: { serviceName: 'Test Service', monthlyCost: 9.99, billingCycle: 'monthly' } } },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', testData: { title: 'Test Meditation', metadata: { type: 'meditation', duration: 10, date: new Date().toISOString() } } },
  { id: 'fitness', name: 'Fitness', icon: '💪', testData: { title: 'Test Workout', metadata: { type: 'workout', activityType: 'running', duration: 30 } } },
  { id: 'nutrition', name: 'Nutrition', icon: '🍎', testData: { title: 'Test Meal', metadata: { type: 'meal', mealType: 'breakfast', calories: 400 } } },
  { id: 'legal', name: 'Legal', icon: '⚖️', testData: { title: 'Test Document', metadata: { type: 'document', documentType: 'contract', issueDate: new Date().toISOString() } } },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: '🎨', testData: { title: 'Test Item', metadata: { category: 'general', notes: 'Test miscellaneous item' } } },
]

async function testDomain(domain: typeof DOMAINS[0]): Promise<TestResult> {
  const result: TestResult = {
    domain: domain.name,
    icon: domain.icon,
    passed: true,
    tests: { read: false, create: false, update: false, delete: false },
    errors: [],
    entryCount: 0
  }

  let testEntryId: string | null = null

  try {
    // TEST 1: READ - Count existing entries
    console.log(`\n  📖 Testing READ for ${domain.icon} ${domain.name}...`)
    const { data: readData, error: readError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('domain', domain.id)

    if (readError) {
      result.errors.push(`Read error: ${readError.message}`)
      result.passed = false
    } else {
      result.tests.read = true
      result.entryCount = readData?.length || 0
      console.log(`     ✅ Read successful: ${result.entryCount} entries found`)
    }

    // TEST 2: CREATE - Add a test entry
    console.log(`  ➕ Testing CREATE for ${domain.icon} ${domain.name}...`)
    const { data: createData, error: createError } = await supabase
      .from('domain_entries')
      .insert({
        user_id: TEST_USER_ID,
        domain: domain.id,
        title: domain.testData.title,
        description: `Test entry for ${domain.name}`,
        metadata: domain.testData.metadata
      })
      .select()
      .single()

    if (createError) {
      result.errors.push(`Create error: ${createError.message}`)
      result.passed = false
    } else {
      result.tests.create = true
      testEntryId = createData.id
      console.log(`     ✅ Create successful: ID ${testEntryId}`)
    }

    // TEST 3: UPDATE - Modify the test entry
    if (testEntryId) {
      console.log(`  ✏️  Testing UPDATE for ${domain.icon} ${domain.name}...`)
      const { error: updateError } = await supabase
        .from('domain_entries')
        .update({
          title: `${domain.testData.title} (Updated)`,
          description: 'Updated test entry'
        })
        .eq('id', testEntryId)
        .eq('user_id', TEST_USER_ID)

      if (updateError) {
        result.errors.push(`Update error: ${updateError.message}`)
        result.passed = false
      } else {
        result.tests.update = true
        console.log(`     ✅ Update successful`)
      }
    }

    // TEST 4: DELETE - Remove the test entry
    if (testEntryId) {
      console.log(`  🗑️  Testing DELETE for ${domain.icon} ${domain.name}...`)
      const { error: deleteError } = await supabase
        .from('domain_entries')
        .delete()
        .eq('id', testEntryId)
        .eq('user_id', TEST_USER_ID)

      if (deleteError) {
        result.errors.push(`Delete error: ${deleteError.message}`)
        result.passed = false
      } else {
        result.tests.delete = true
        console.log(`     ✅ Delete successful`)
      }
    }

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`)
    result.passed = false
  }

  return result
}

async function runTests() {
  console.log('🧪 LifeHub Domain Functionality Tests\n')
  console.log('=' .repeat(60))
  console.log(`Testing ${DOMAINS.length} domains for user: ${TEST_USER_ID}`)
  console.log('=' .repeat(60))

  const results: TestResult[] = []

  for (const domain of DOMAINS) {
    console.log(`\n🔍 Testing: ${domain.icon} ${domain.name}`)
    console.log('-'.repeat(60))
    const result = await testDomain(domain)
    results.push(result)
  }

  // Print Summary
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`\n✅ Passed: ${passed}/${DOMAINS.length}`)
  console.log(`❌ Failed: ${failed}/${DOMAINS.length}\n`)

  // Detailed results table
  console.log('Domain'.padEnd(20) + 'Read  Create  Update  Delete  Entries  Status')
  console.log('-'.repeat(70))

  results.forEach(r => {
    const read = r.tests.read ? '✅' : '❌'
    const create = r.tests.create ? '✅' : '❌'
    const update = r.tests.update ? '✅' : '❌'
    const del = r.tests.delete ? '✅' : '❌'
    const status = r.passed ? '✅ PASS' : '❌ FAIL'
    const entries = r.entryCount.toString().padStart(3)

    console.log(
      `${(r.icon + ' ' + r.domain).padEnd(20)}${read}    ${create}     ${update}     ${del}      ${entries}    ${status}`
    )
  })

  // Show errors if any
  const failedDomains = results.filter(r => !r.passed)
  if (failedDomains.length > 0) {
    console.log('\n❌ ERRORS:')
    failedDomains.forEach(r => {
      console.log(`\n${r.icon} ${r.domain}:`)
      r.errors.forEach(err => console.log(`  - ${err}`))
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log(failed === 0 ? '🎉 All tests passed!' : `⚠️  ${failed} domain(s) need attention`)
  console.log('='.repeat(60) + '\n')

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error running tests:', error)
  process.exit(1)
})

