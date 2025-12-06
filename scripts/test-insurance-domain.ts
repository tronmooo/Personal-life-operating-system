#!/usr/bin/env ts-node

/**
 * Insurance Domain CRUD Testing Script
 * Tests Create, Read, Update, Delete operations for insurance_policies and insurance_claims
 * Verifies foreign key relationships and data integrity
 * 
 * Usage: npx ts-node scripts/test-insurance-domain.ts
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
  table: string
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

async function testCreatePolicy(userId: string): Promise<string | null> {
  const operation = 'CREATE POLICY'
  try {
    console.log(`\n🔄 Testing ${operation}...`)
    
    const testPolicy = {
      user_id: userId,
      provider: 'Test Insurance Co',
      policy_number: 'TEST-' + Date.now(),
      type: 'test',
      premium: 99.99,
      starts_on: new Date().toISOString().split('T')[0],
      ends_on: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coverage: {
        test_coverage: 10000
      },
      metadata: {
        test: true,
        source: 'automated_test'
      }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .insert(testPolicy)
      .select()
      .single()

    if (error) throw error

    results.push({
      operation,
      table: 'insurance_policies',
      status: 'PASS',
      message: `Created policy with ID: ${data.id}`
    })

    console.log(`✅ ${operation} PASSED`)
    return data.id
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_policies',
      status: 'FAIL',
      message: 'Failed to create policy',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return null
  }
}

async function testReadPolicies(userId: string, policyId?: string): Promise<boolean> {
  const operation = 'READ POLICIES'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const { data, error } = await supabase
      .from('insurance_policies')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    console.log(`   Found ${data?.length || 0} policies for user`)

    if (policyId) {
      const { data: specificPolicy, error: specificError } = await supabase
        .from('insurance_policies')
        .select('*')
        .eq('id', policyId)
        .eq('user_id', userId)
        .single()

      if (specificError) throw specificError

      console.log(`   Retrieved specific policy: ${specificPolicy.policy_number}`)
    }

    results.push({
      operation,
      table: 'insurance_policies',
      status: 'PASS',
      message: `Read ${data?.length || 0} policies successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_policies',
      status: 'FAIL',
      message: 'Failed to read policies',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testUpdatePolicy(userId: string, policyId: string): Promise<boolean> {
  const operation = 'UPDATE POLICY'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const updates = {
      premium: 149.99,
      metadata: {
        test: true,
        source: 'automated_test',
        updated: true
      }
    }

    const { data, error } = await supabase
      .from('insurance_policies')
      .update(updates)
      .eq('id', policyId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    if (data.premium !== 149.99) {
      throw new Error('Update verification failed: premium not updated')
    }

    results.push({
      operation,
      table: 'insurance_policies',
      status: 'PASS',
      message: `Updated policy ${policyId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_policies',
      status: 'FAIL',
      message: 'Failed to update policy',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testCreateClaim(userId: string, policyId: string): Promise<string | null> {
  const operation = 'CREATE CLAIM'
  try {
    console.log(`\n🔄 Testing ${operation}...`)
    
    const testClaim = {
      user_id: userId,
      policy_id: policyId,
      status: 'filed',
      amount: 500,
      filed_on: new Date().toISOString().split('T')[0],
      details: {
        test: true,
        source: 'automated_test',
        description: 'Test claim for automated testing'
      }
    }

    const { data, error } = await supabase
      .from('insurance_claims')
      .insert(testClaim)
      .select()
      .single()

    if (error) throw error

    results.push({
      operation,
      table: 'insurance_claims',
      status: 'PASS',
      message: `Created claim with ID: ${data.id}`
    })

    console.log(`✅ ${operation} PASSED`)
    return data.id
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_claims',
      status: 'FAIL',
      message: 'Failed to create claim',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return null
  }
}

async function testReadClaims(userId: string, claimId?: string): Promise<boolean> {
  const operation = 'READ CLAIMS'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    console.log(`   Found ${data?.length || 0} claims for user`)

    if (claimId) {
      const { data: specificClaim, error: specificError } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('id', claimId)
        .eq('user_id', userId)
        .single()

      if (specificError) throw specificError

      console.log(`   Retrieved specific claim: ${specificClaim.status}`)
    }

    results.push({
      operation,
      table: 'insurance_claims',
      status: 'PASS',
      message: `Read ${data?.length || 0} claims successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_claims',
      status: 'FAIL',
      message: 'Failed to read claims',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testUpdateClaim(userId: string, claimId: string): Promise<boolean> {
  const operation = 'UPDATE CLAIM'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const updates = {
      status: 'approved',
      amount: 450,
      resolved_on: new Date().toISOString().split('T')[0],
      details: {
        test: true,
        source: 'automated_test',
        updated: true,
        approved_amount: 450
      }
    }

    const { data, error } = await supabase
      .from('insurance_claims')
      .update(updates)
      .eq('id', claimId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    if (data.status !== 'approved') {
      throw new Error('Update verification failed: status not updated')
    }

    results.push({
      operation,
      table: 'insurance_claims',
      status: 'PASS',
      message: `Updated claim ${claimId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_claims',
      status: 'FAIL',
      message: 'Failed to update claim',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testDeleteClaim(userId: string, claimId: string): Promise<boolean> {
  const operation = 'DELETE CLAIM'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    const { error } = await supabase
      .from('insurance_claims')
      .delete()
      .eq('id', claimId)
      .eq('user_id', userId)

    if (error) throw error

    // Verify deletion
    const { data: afterDelete } = await supabase
      .from('insurance_claims')
      .select('id')
      .eq('id', claimId)
      .eq('user_id', userId)
      .single()

    if (afterDelete) {
      throw new Error('Claim still exists after delete')
    }

    results.push({
      operation,
      table: 'insurance_claims',
      status: 'PASS',
      message: `Deleted claim ${claimId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      results.push({
        operation,
        table: 'insurance_claims',
        status: 'PASS',
        message: `Deleted claim ${claimId} successfully (verified)`
      })
      console.log(`✅ ${operation} PASSED`)
      return true
    }

    results.push({
      operation,
      table: 'insurance_claims',
      status: 'FAIL',
      message: 'Failed to delete claim',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testDeletePolicy(userId: string, policyId: string): Promise<boolean> {
  const operation = 'DELETE POLICY'
  try {
    console.log(`\n🔄 Testing ${operation}...`)

    // Note: This will also delete associated claims due to CASCADE
    const { error } = await supabase
      .from('insurance_policies')
      .delete()
      .eq('id', policyId)
      .eq('user_id', userId)

    if (error) throw error

    results.push({
      operation,
      table: 'insurance_policies',
      status: 'PASS',
      message: `Deleted policy ${policyId} successfully`
    })

    console.log(`✅ ${operation} PASSED`)
    return true
  } catch (error: any) {
    results.push({
      operation,
      table: 'insurance_policies',
      status: 'FAIL',
      message: 'Failed to delete policy',
      error: error.message
    })
    console.log(`❌ ${operation} FAILED: ${error.message}`)
    return false
  }
}

async function testInsuranceDomain() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║     INSURANCE DOMAIN CRUD TESTING - Integration Tests        ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  const user = await getCurrentUser()
  
  if (!user) {
    console.log('❌ No authenticated user found')
    process.exit(1)
  }

  console.log(`✅ User: ${user.email} (${user.id})`)

  let policyId: string | null = null
  let claimId: string | null = null

  // Test Policy CRUD
  policyId = await testCreatePolicy(user.id)
  if (!policyId) {
    printSummary()
    process.exit(1)
  }

  await testReadPolicies(user.id, policyId)
  await testUpdatePolicy(user.id, policyId)

  // Test Claim CRUD (depends on policy)
  claimId = await testCreateClaim(user.id, policyId)
  if (claimId) {
    await testReadClaims(user.id, claimId)
    await testUpdateClaim(user.id, claimId)
    await testDeleteClaim(user.id, claimId)
  }

  // Delete policy (should cascade delete claims)
  await testDeletePolicy(user.id, policyId)

  printSummary()

  const failedTests = results.filter(r => r.status === 'FAIL')
  process.exit(failedTests.length > 0 ? 1 : 0)
}

function printSummary() {
  console.log('\n' + '═'.repeat(65))
  console.log('📊 TEST SUMMARY - INSURANCE DOMAIN')
  console.log('═'.repeat(65) + '\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${icon} ${result.table} - ${result.operation}: ${result.message}`)
    if (result.error) console.log(`   Error: ${result.error}`)
  })

  console.log('\n' + '─'.repeat(65))
  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('─'.repeat(65))

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('   Insurance domain CRUD operations are working correctly.\n')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED!')
    console.log('   Please review errors above.\n')
  }
}

testInsuranceDomain().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

