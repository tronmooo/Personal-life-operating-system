#!/usr/bin/env ts-node
/**
 * AI Assistant Command Tester
 * Systematically tests all AI assistant commands across all domains
 */

import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'

interface TestCommand {
  domain: string
  command: string
  expectedType: string
  expectedFields: string[]
}

// Comprehensive test commands for all domains
const TEST_COMMANDS: TestCommand[] = [
  // HEALTH
  { domain: 'health', command: 'I weigh 175 pounds', expectedType: 'weight', expectedFields: ['weight'] },
  { domain: 'health', command: 'blood pressure 120 over 80', expectedType: 'blood_pressure', expectedFields: ['systolic', 'diastolic'] },
  { domain: 'health', command: 'heart rate is 72', expectedType: 'heart_rate', expectedFields: ['heartRate', 'bpm'] },
  { domain: 'health', command: 'slept 8 hours', expectedType: 'sleep', expectedFields: ['sleepHours', 'hours'] },
  { domain: 'health', command: 'took 10000 steps', expectedType: 'steps', expectedFields: ['steps', 'value'] },
  
  // FITNESS
  { domain: 'fitness', command: 'walked 30 minutes', expectedType: 'workout', expectedFields: ['exercise', 'duration'] },
  { domain: 'fitness', command: 'ran 45 minutes', expectedType: 'workout', expectedFields: ['exercise', 'duration'] },
  { domain: 'fitness', command: 'did 30 minute cardio workout', expectedType: 'workout', expectedFields: ['exercise', 'duration'] },
  { domain: 'fitness', command: 'burned 350 calories', expectedType: 'calories_burned', expectedFields: ['value'] },
  
  // NUTRITION
  { domain: 'nutrition', command: 'drank 20 oz water', expectedType: 'water', expectedFields: ['value', 'water'] },
  { domain: 'nutrition', command: 'ate chicken salad 450 calories', expectedType: 'meal', expectedFields: ['description', 'calories'] },
  
  // FINANCIAL
  { domain: 'financial', command: 'spent $35 on groceries', expectedType: 'expense', expectedFields: ['amount', 'description'] },
  { domain: 'financial', command: 'earned $1500 for freelance work', expectedType: 'income', expectedFields: ['amount', 'description'] },
  
  // VEHICLES
  { domain: 'vehicles', command: 'filled up gas for $45', expectedType: 'gas', expectedFields: ['amount'] },
  { domain: 'vehicles', command: 'oil change $120 today', expectedType: 'maintenance', expectedFields: ['serviceType', 'cost', 'serviceName'] },
  { domain: 'vehicles', command: 'car has 50000 miles', expectedType: 'mileage_update', expectedFields: ['currentMileage'] },
  { domain: 'vehicles', command: 'tire rotation $80', expectedType: 'maintenance', expectedFields: ['serviceType', 'cost'] },
  
  // PROPERTY
  { domain: 'property', command: 'house worth $450000', expectedType: 'home_value', expectedFields: ['value'] },
  { domain: 'property', command: 'mortgage payment $2500', expectedType: 'mortgage_payment', expectedFields: ['amount'] },
  { domain: 'property', command: 'property tax $5000 annually', expectedType: 'property_tax', expectedFields: ['amount', 'frequency'] },
  
  // PETS
  { domain: 'pets', command: 'fed the dog', expectedType: 'feeding', expectedFields: ['petName'] },
  { domain: 'pets', command: 'walked the dog 30 minutes', expectedType: 'walk', expectedFields: ['duration'] },
  
  // CAREER
  { domain: 'career', command: 'interview at Amazon tomorrow', expectedType: 'interview', expectedFields: ['company'] },
  { domain: 'career', command: 'salary $120000 per year', expectedType: 'salary', expectedFields: ['amount', 'frequency'] },
  
  // EDUCATION
  { domain: 'education', command: 'studied 2 hours for math', expectedType: 'study_session', expectedFields: ['duration', 'subject'] },
  { domain: 'education', command: 'enrolled in Python course', expectedType: 'course', expectedFields: ['name'] },
  
  // RELATIONSHIPS
  { domain: 'relationships', command: 'called Mom', expectedType: 'interaction', expectedFields: ['person', 'method'] },
  
  // TRAVEL
  { domain: 'travel', command: 'planning trip to Paris', expectedType: 'trip', expectedFields: ['destination'] },
  { domain: 'travel', command: 'booked flight to New York', expectedType: 'flight', expectedFields: ['destination'] },
  
  // MINDFULNESS
  { domain: 'mindfulness', command: 'meditated 20 minutes', expectedType: 'meditation', expectedFields: ['duration'] },
  
  // HOBBIES
  { domain: 'hobbies', command: 'played guitar 30 minutes', expectedType: 'activity', expectedFields: ['activity', 'duration'] },
  
  // INSURANCE
  { domain: 'insurance', command: 'paid $200 for health insurance', expectedType: 'premium_payment', expectedFields: ['insuranceType', 'amount'] },
  
  // LEGAL
  { domain: 'legal', command: 'signed lease agreement', expectedType: 'document', expectedFields: ['documentType'] },
  
  // APPLIANCES
  { domain: 'appliances', command: 'serviced the washer for $80', expectedType: 'maintenance', expectedFields: ['appliance', 'cost'] },
  
  // DIGITAL-LIFE
  { domain: 'digital', command: 'subscribed to Netflix $15 per month', expectedType: 'subscription', expectedFields: ['service'] },
  
  // HOME
  { domain: 'home', command: 'paid $120 for electricity bill', expectedType: 'utility_payment', expectedFields: ['utilityType', 'amount'] },
]

interface TestResult {
  domain: string
  command: string
  passed: boolean
  apiCalled: boolean
  dataSaved: boolean
  dataVisible: boolean
  crudWorks: boolean
  issues: string[]
  entryId?: string
  metadata?: any
}

class AICommandTester {
  private supabase: any
  private testUserId: string | null = null
  private results: TestResult[] = []

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  async setup() {
    console.log('🔧 Setting up test environment...\n')
    
    // Find test user
    const { data: users, error } = await this.supabase
      .from('profiles')
      .select('id, email')
      .eq('email', TEST_USER_EMAIL)
      .single()
    
    if (error || !users) {
      console.error('❌ Test user not found. Please set TEST_USER_EMAIL env var.')
      console.error('   Or create a test user in Supabase Auth.')
      process.exit(1)
    }
    
    this.testUserId = users.id
    console.log(`✅ Found test user: ${TEST_USER_EMAIL} (${this.testUserId})\n`)
  }

  async testCommand(testCase: TestCommand): Promise<TestResult> {
    const result: TestResult = {
      domain: testCase.domain,
      command: testCase.command,
      passed: false,
      apiCalled: false,
      dataSaved: false,
      dataVisible: false,
      crudWorks: false,
      issues: []
    }

    try {
      console.log(`\n📝 Testing: "${testCase.command}"`)
      console.log(`   Expected domain: ${testCase.domain}`)
      console.log(`   Expected type: ${testCase.expectedType}`)

      // Call AI Assistant API
      const apiResponse = await fetch('http://localhost:3000/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.command,
          userData: {},
          conversationHistory: []
        })
      })

      if (!apiResponse.ok) {
        result.issues.push(`API call failed: ${apiResponse.statusText}`)
        return result
      }

      result.apiCalled = true
      const apiData = await apiResponse.json()
      
      console.log(`   API Response: ${apiData.response}`)
      console.log(`   Saved: ${apiData.saved}`)

      if (!apiData.saved) {
        result.issues.push('API did not save data (saved=false)')
        return result
      }

      // Wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if data was saved to domain_entries
      const { data: entries, error: fetchError } = await this.supabase
        .from('domain_entries')
        .select('*')
        .eq('user_id', this.testUserId)
        .eq('domain', testCase.domain)
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) {
        result.issues.push(`Database fetch error: ${fetchError.message}`)
        return result
      }

      if (!entries || entries.length === 0) {
        result.issues.push('No entry found in database after save')
        return result
      }

      const entry = entries[0]
      result.dataSaved = true
      result.entryId = entry.id
      result.metadata = entry.metadata

      console.log(`   ✅ Entry saved with ID: ${entry.id}`)
      console.log(`   Title: ${entry.title}`)
      console.log(`   Metadata type: ${entry.metadata?.type}`)

      // Verify metadata structure
      const metadata = entry.metadata || {}
      const actualType = metadata.type

      if (actualType !== testCase.expectedType) {
        result.issues.push(`Type mismatch: expected "${testCase.expectedType}", got "${actualType}"`)
      }

      // Check for expected fields
      const missingFields = testCase.expectedFields.filter(field => {
        return metadata[field] === undefined && metadata[field] === null
      })

      if (missingFields.length > 0) {
        result.issues.push(`Missing fields: ${missingFields.join(', ')}`)
      }

      result.dataVisible = true

      // Test CRUD operations
      try {
        // UPDATE test
        const { error: updateError } = await this.supabase
          .from('domain_entries')
          .update({ description: 'Test update' })
          .eq('id', entry.id)

        if (updateError) {
          result.issues.push(`Update failed: ${updateError.message}`)
        } else {
          console.log(`   ✅ Update works`)
        }

        // DELETE test
        const { error: deleteError } = await this.supabase
          .from('domain_entries')
          .delete()
          .eq('id', entry.id)

        if (deleteError) {
          result.issues.push(`Delete failed: ${deleteError.message}`)
        } else {
          result.crudWorks = true
          console.log(`   ✅ Delete works`)
        }
      } catch (crudError: any) {
        result.issues.push(`CRUD error: ${crudError.message}`)
      }

      // Overall pass/fail
      result.passed = result.apiCalled && result.dataSaved && result.dataVisible && result.crudWorks && result.issues.length === 0

      if (result.passed) {
        console.log(`   ✅ TEST PASSED`)
      } else {
        console.log(`   ❌ TEST FAILED: ${result.issues.join(', ')}`)
      }

    } catch (error: any) {
      result.issues.push(`Unexpected error: ${error.message}`)
      console.log(`   ❌ ERROR: ${error.message}`)
    }

    return result
  }

  async runAllTests() {
    console.log('\n🚀 Starting comprehensive AI command tests...\n')
    console.log(`Testing ${TEST_COMMANDS.length} commands across ${new Set(TEST_COMMANDS.map(t => t.domain)).size} domains\n`)
    console.log('='

.repeat(80))

    for (const testCase of TEST_COMMANDS) {
      const result = await this.testCommand(testCase)
      this.results.push(result)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit
    }

    this.printSummary()
  }

  printSummary() {
    console.log('\n\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80))

    const totalTests = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = totalTests - passed

    console.log(`\nTotal Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passed} (${((passed / totalTests) * 100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${failed} (${((failed / totalTests) * 100).toFixed(1)}%)`)

    // Group by domain
    const byDomain = new Map<string, TestResult[]>()
    this.results.forEach(r => {
      if (!byDomain.has(r.domain)) {
        byDomain.set(r.domain, [])
      }
      byDomain.get(r.domain)!.push(r)
    })

    console.log('\n📋 RESULTS BY DOMAIN:\n')
    
    byDomain.forEach((results, domain) => {
      const domainPassed = results.filter(r => r.passed).length
      const domainTotal = results.length
      const status = domainPassed === domainTotal ? '✅' : domainPassed > 0 ? '🟡' : '❌'
      
      console.log(`${status} ${domain.toUpperCase()}: ${domainPassed}/${domainTotal} passed`)
      
      results.forEach(r => {
        if (!r.passed) {
          console.log(`   ❌ "${r.command}"`)
          r.issues.forEach(issue => {
            console.log(`      → ${issue}`)
          })
        }
      })
    })

    // Save results to file
    const reportPath = '/Users/robertsennabaum/new project/AI_TEST_RESULTS.json'
    const fs = require('fs')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalTests,
      passed,
      failed,
      results: this.results
    }, null, 2))
    
    console.log(`\n💾 Full results saved to: AI_TEST_RESULTS.json`)
  }
}

// Run tests
async function main() {
  const tester = new AICommandTester()
  await tester.setup()
  await tester.runAllTests()
}

main().catch(console.error)

