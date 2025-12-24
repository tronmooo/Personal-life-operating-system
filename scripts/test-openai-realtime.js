#!/usr/bin/env node
/**
 * Test OpenAI Realtime API Access
 * Run with: node scripts/test-openai-realtime.js
 */

require('dotenv').config({ path: '.env.local' })
const WebSocket = require('ws')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.log('❌ OPENAI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('🔍 Testing OpenAI Realtime API access...\n')

const ws = new WebSocket(
  'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
  {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  }
)

const timeout = setTimeout(() => {
  console.log('❌ Connection timed out after 10 seconds')
  console.log('   This might mean:')
  console.log('   - Your OpenAI account doesn\'t have Realtime API access')
  console.log('   - Network issues')
  console.log('')
  console.log('📋 To get Realtime API access:')
  console.log('   1. Go to https://platform.openai.com/settings/organization/limits')
  console.log('   2. Check if you have Tier 1 or higher')
  console.log('   3. The Realtime API requires a paid plan with sufficient usage')
  ws.close()
  process.exit(1)
}, 10000)

ws.on('open', () => {
  console.log('✅ Connected to OpenAI Realtime API!')
  console.log('✅ Your API key has Realtime API access')
  clearTimeout(timeout)
  ws.close()
  process.exit(0)
})

ws.on('message', (data) => {
  try {
    const event = JSON.parse(data.toString())
    if (event.type === 'session.created') {
      console.log('✅ Session created successfully!')
      console.log('✅ Voice calling should work!')
      clearTimeout(timeout)
      ws.close()
      process.exit(0)
    } else if (event.type === 'error') {
      console.log('❌ Error from OpenAI:', event.error?.message || JSON.stringify(event))
      clearTimeout(timeout)
      ws.close()
      process.exit(1)
    }
  } catch (e) {
    console.log('Received:', data.toString().substring(0, 200))
  }
})

ws.on('error', (error) => {
  clearTimeout(timeout)
  console.log('❌ Connection error:', error.message)
  
  if (error.message.includes('401')) {
    console.log('   Your API key is invalid or expired')
  } else if (error.message.includes('403')) {
    console.log('   Your account doesn\'t have Realtime API access')
    console.log('   This requires a paid OpenAI plan')
  }
  
  process.exit(1)
})

ws.on('close', () => {
  // Handled elsewhere
})






