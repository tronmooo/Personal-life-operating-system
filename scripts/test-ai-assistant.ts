#!/usr/bin/env npx tsx

/**
 * Test script for AI Assistant commands
 * Run with: npx tsx scripts/test-ai-assistant.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TEST_COMMANDS = [
  // Financial commands
  { cmd: 'add expense $50 for groceries', expected: 'financial' },
  { cmd: 'spent $25 on lunch', expected: 'financial' },
  { cmd: 'add income $5000 salary', expected: 'financial' },
  
  // Health commands
  { cmd: 'log blood pressure 120/80', expected: 'health' },
  { cmd: 'my weight is 185 pounds', expected: 'health' },
  { cmd: 'heart rate 72 bpm', expected: 'health' },
  
  // Fitness commands
  { cmd: 'walked 5000 steps today', expected: 'fitness' },
  { cmd: 'ran 3 miles', expected: 'fitness' },
  { cmd: 'burned 400 calories at the gym', expected: 'fitness' },
  
  // Nutrition commands
  { cmd: 'ate breakfast 450 calories', expected: 'nutrition' },
  { cmd: 'drank 16oz water', expected: 'nutrition' },
  { cmd: 'had lunch, 600 calories salad', expected: 'nutrition' },
  
  // Task commands
  { cmd: 'add task buy groceries', expected: 'task' },
  { cmd: 'remind me to call doctor', expected: 'task' },
  
  // Vehicle commands
  { cmd: 'car mileage 45000 miles', expected: 'vehicles' },
  { cmd: 'oil change due next week', expected: 'vehicles' },
  
  // Pet commands
  { cmd: 'max weighs 65 pounds', expected: 'pets' },
  { cmd: 'vet appointment for dog $150', expected: 'pets' },
  
  // Multi-entity commands
  { cmd: 'spent $50 on groceries and walked 30 minutes', expected: 'multiple' },
  { cmd: 'my weight is 180, blood pressure 118/75, drank 24oz water', expected: 'multiple' },
]

async function testCommand(command: string, expectedDomain: string) {
  console.log(`\n📝 Testing: "${command}"`)
  console.log(`   Expected: ${expectedDomain}`)
  
  try {
    // Simulate the API call that the frontend would make
    const response = await fetch('http://localhost:3000/api/ai-assistant/multi-entry', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // We'll need to pass auth differently for service-side testing
      },
      body: JSON.stringify({
        message: command,
        userContext: {
          recentEntries: [],
          preferences: {}
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`   ❌ HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const result = await response.json()
    
    if (result.success && result.results?.length > 0) {
      console.log(`   ✅ SUCCESS: ${result.results.length} entries created`)
      result.results.forEach((r: any) => {
        console.log(`      - ${r.domain}: ${r.title}`)
      })
      return { success: true, result }
    } else if (result.error) {
      console.log(`   ❌ API Error: ${result.error}`)
      return { success: false, error: result.error }
    } else {
      console.log(`   ⚠️ No entities extracted: ${result.message || 'Unknown'}`)
      return { success: false, error: 'No entities extracted' }
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testChatCommand(command: string) {
  console.log(`\n💬 Testing chat: "${command}"`)
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-assistant/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: command,
        userData: {},
        conversationHistory: []
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`   ❌ HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const result = await response.json()
    
    if (result.response) {
      console.log(`   ✅ Response received (${result.response.length} chars)`)
      console.log(`      "${result.response.substring(0, 100)}..."`)
      return { success: true, result }
    } else {
      console.log(`   ❌ Error: ${result.error || 'Unknown'}`)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🧪 AI Assistant Test Suite')
  console.log('=' .repeat(50))
  
  // First check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000')
    if (!healthCheck.ok) {
      console.log('❌ Server not responding. Make sure `npm run dev` is running.')
      process.exit(1)
    }
    console.log('✅ Server is running')
  } catch {
    console.log('❌ Cannot connect to server. Make sure `npm run dev` is running.')
    process.exit(1)
  }
  
  console.log('\n📦 Testing Multi-Entity Extraction API...')
  console.log('   (Note: These tests require authentication)')
  
  let passed = 0
  let failed = 0
  
  // Test a few commands
  for (const test of TEST_COMMANDS.slice(0, 5)) {
    const result = await testCommand(test.cmd, test.expected)
    if (result.success) passed++
    else failed++
  }
  
  console.log('\n💬 Testing Chat API...')
  
  const chatTests = [
    'hello',
    'what can you do?',
    'show me my financial summary'
  ]
  
  for (const cmd of chatTests) {
    const result = await testChatCommand(cmd)
    if (result.success) passed++
    else failed++
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.log('\n⚠️ Some tests failed. This is expected if:')
    console.log('   1. You are not authenticated (most APIs require auth)')
    console.log('   2. The server is not running')
    console.log('   3. Environment variables are not set')
  }
}

main().catch(console.error)








