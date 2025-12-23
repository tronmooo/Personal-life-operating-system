#!/usr/bin/env node

/**
 * Test AI Concierge API endpoints
 * Verifies the calling system is working
 */

const http = require('http')

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

console.log('\n' + '='.repeat(70))
console.log('🧪 TESTING AI CONCIERGE API')
console.log('='.repeat(70) + '\n')

// Test data
const testRequest = {
  phoneNumber: '+18135551234', // Test phone number
  businessName: 'Test Pizza Shop',
  userRequest: 'I need to order a large pepperoni pizza for delivery',
  category: 'restaurant',
  userName: 'Test User',
  userLocation: {
    latitude: 27.9506,
    longitude: -82.4572,
    address: 'Tampa, FL'
  }
}

async function testServer() {
  console.log(`${BLUE}1. Checking if server is running...${RESET}`)
  
  try {
    const healthCheck = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => resolve({ status: res.statusCode, data }))
      })
      
      req.on('error', reject)
      req.on('timeout', () => reject(new Error('Request timeout')))
      req.end()
    })
    
    if (healthCheck.status === 200 || healthCheck.status === 404) {
      console.log(`${GREEN}   ✅ Server is running on http://localhost:3000${RESET}\n`)
    }
  } catch (error) {
    console.log(`${RED}   ❌ Server is not running!${RESET}`)
    console.log(`${YELLOW}   Run: npm run dev:server${RESET}\n`)
    process.exit(1)
  }
  
  console.log(`${BLUE}2. Testing Voice Initiate Call API...${RESET}`)
  
  try {
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testRequest)
      
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/voice/initiate-call',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) })
          } catch {
            resolve({ status: res.statusCode, data })
          }
        })
      })
      
      req.on('error', reject)
      req.on('timeout', () => reject(new Error('Request timeout')))
      req.write(postData)
      req.end()
    })
    
    console.log(`   Status: ${result.status}`)
    console.log(`   Response:`, JSON.stringify(result.data, null, 2))
    
    if (result.status === 200 && result.data.success) {
      console.log(`\n${GREEN}   ✅ API is working! Call SID: ${result.data.callSid}${RESET}`)
      console.log(`${GREEN}   ✅ WebSocket endpoint: ${result.data.websocketEndpoint}${RESET}\n`)
    } else if (result.data.simulation) {
      console.log(`\n${YELLOW}   ⚠️  API returned simulation mode${RESET}`)
      console.log(`${YELLOW}   This means Twilio credentials might not be configured correctly${RESET}\n`)
    } else {
      console.log(`\n${RED}   ❌ API call failed${RESET}\n`)
    }
    
  } catch (error) {
    console.log(`${RED}   ❌ API Error: ${error.message}${RESET}\n`)
  }
  
  console.log('='.repeat(70))
  console.log(`${GREEN}✅ TEST COMPLETE${RESET}\n`)
  console.log('📞 NEXT STEPS:\n')
  console.log('1. Update Twilio webhooks:')
  console.log('   - A call comes in: https://life-hub.me/api/voice/twiml')
  console.log('   - Call status: https://life-hub.me/api/webhooks/call-status')
  console.log('')
  console.log('2. Open the AI Concierge in your app at:')
  console.log('   http://localhost:3000')
  console.log('')
  console.log('3. Try a real request like:')
  console.log('   "I need an oil change for my car"')
  console.log('')
  console.log('='.repeat(70) + '\n')
}

testServer().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error)
  process.exit(1)
})



























