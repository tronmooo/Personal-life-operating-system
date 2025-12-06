#!/usr/bin/env ts-node

/**
 * Health Domain CRUD Testing Script
 * Tests Create, Read, Update, Delete operations for health_metrics
 * Verifies data integrity and proper error handling
 * 
 * Usage: npx ts-node scripts/test-health-domain.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TestResult {
  operation: string
  status: 'PASS' | 'FAIL'
  message: string
  error?: string
}

const results: TestResult[] = []

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

async function testCreate(userId: string): Promise<string | null> {
  const operation = 'CREATE'
  try {
    console.log(`\n🔄 Testing ${operation}...`)
    
    const testMetric = {
      user_id: userId,
      metric_type: 'test_metric',
      recorded_at: new Date().toISOString(),
      value: 100,
      secondary_value: 80,
      unit: 'test_unit',
      metadata: {
        test: true,
        source: 'automated_test'
      }
    }

    const { data, error } = await supabase
      .from('health_metrics')
      .insert(testMetric)
      .select()
      .single()

    if (error) throw error

    results.push({
      operation,
      status: 'PASS',
      message: `Created metric with ID: ${data.id}`
    })

    console.log(`✅ ${operation} PASSED`)
    return data.id
  } catch (error: any) {
    results.push({
      operation,
      status: 'FAIL',
      message: 'Failed to create metric',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return null
  }
}

async function testRead(userId: string, metricId?: string): Promise<boolean> {
  const operation = 'READ'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    // Test 1: Read all metrics for user
    const { data: allMetrics, error: allError } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)

    if (allError) throw allError

    console.log(`   Found ${allMetrics?.length || 0} metrics for user`)

    // Test 2: Read specific metric if ID provided
    if (metricId) {
      const { data: specificMetric, error: specificError } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('id', metricId)
        .eq('user_id', userId)
        .single()

      if (specificError) throw specificError

      console.log(`   Retrieved specific metric: ${specificMetric.metric_type}`)
    }

    results.push({
      operation,
      status: 'PASS',
      message: `Read ${allMetrics?.length || 0} metrics successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      status: 'FAIL',
      message: 'Failed to read metrics',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testUpdate(userId: string, metricId: string): Promise<boolean> {
  const operation = 'UPDATE'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const updates = {
      value: 150,
      secondary_value: 90,
      metadata: {
        test: true,
        source: 'automated_test',
        updated: true
      }
    }

    const { data, error } = await supabase
      .from('health_metrics')
      .update(updates)
      .eq('id', metricId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Verify update
    if (data.value !== 150) {
      throw new Error('Update verification failed: value not updated')
    }

    results.push({
      operation,
      status: 'PASS',
      message: `Updated metric ${metricId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      status: 'FAIL',
      message: 'Failed to update metric',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testDelete(userId: string, metricId: string): Promise<boolean> {
  const operation = 'DELETE'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    // First verify metric exists
    const { data: beforeDelete } = await supabase
      .from('health_metrics')
      .select('id')
      .eq('id', metricId)
      .eq('user_id', userId)
      .single()

    if (!beforeDelete) {
      throw new Error('Metric not found before delete')
    }

    // Delete the metric
    const { error } = await supabase
      .from('health_metrics')
      .delete()
      .eq('id', metricId)
      .eq('user_id', userId)

    if (error) throw error

    // Verify deletion
    const { data: afterDelete } = await supabase
      .from('health_metrics')
      .select('id')
      .eq('id', metricId)
      .eq('user_id', userId)
      .single()

    if (afterDelete) {
      throw new Error('Metric still exists after delete')
    }

    results.push({
      operation,
      status: 'PASS',
      message: `Deleted metric ${metricId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    // 'PGRST116' means no rows found, which is expected after successful delete
    if (error.code === 'PGRST116') {
      results.push({
        operation,
        status: 'PASS',
        message: `Deleted metric ${metricId} successfully (verified)`
      })
      console.log(`✅ ${operation} PASSED`)
      return true
    }

    results.push({
      operation,
      status: 'FAIL',
      message: 'Failed to delete metric',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testHealthDomain() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║       HEALTH DOMAIN CRUD TESTING - Integration Tests         ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  // Get user
  console.log('\n🔍 Getting authenticated user...')
  const user = await getCurrentUser()
  
  if (!user) {
    console.log('❌ No authenticated user found')
    console.log('💡 Log in to the app first, then run this script')
    process.exit(1)
  }

  console.log(`✅ User: ${user.email} (${user.id})`)

  // Run CRUD tests in sequence
  let testMetricId: string | null = null

  // CREATE
  testMetricId = await testCreate(user.id)
  if (!testMetricId) {
    console.log('\n❌ CREATE failed - stopping tests')
    printSummary()
    process.exit(1)
  }

  // READ
  await testRead(user.id, testMetricId)

  // UPDATE
  await testUpdate(user.id, testMetricId)

  // READ again to verify update
  await testRead(user.id, testMetricId)

  // DELETE
  await testDelete(user.id, testMetricId)

  // READ again to verify deletion
  await testRead(user.id, testMetricId)

  // Print summary
  printSummary()

  // Exit with appropriate code
  const failedTests = results.filter(r => r.status === 'FAIL')
  process.exit(failedTests.length > 0 ? 1 : 0)
}

function printSummary() {
  console.log('\n' + '═'.repeat(65))
  console.log('📊 TEST SUMMARY - HEALTH DOMAIN')
  console.log('═'.repeat(65) + '\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${icon} ${result.operation}: ${result.message}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '─'.repeat(65))
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('─'.repeat(65))

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('   Health domain CRUD operations are working correctly.\n')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED!')
    console.log('   Please review errors above and fix issues.\n')
  }
}

// Run tests
testHealthDomain().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

