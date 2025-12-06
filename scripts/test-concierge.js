#!/usr/bin/env node

/**
 * Test Concierge Real Business Integration
 * 
 * Usage:
 *   node scripts/test-concierge.js
 */

const testCases = [
  {
    name: 'Pizza Order',
    payload: {
      intent: 'pizza',
      businessCount: 3,
      userLocation: {
        latitude: 34.5008,
        longitude: -117.2897
      },
      details: {
        size: 'large',
        toppings: 'cheese',
        budget: '$20'
      }
    }
  },
  {
    name: 'Plumber Search',
    payload: {
      intent: 'plumber',
      businessCount: 2,
      userLocation: {
        latitude: 34.5008,
        longitude: -117.2897
      },
      details: {
        issue: 'leaky faucet',
        urgent: true
      }
    }
  },
  {
    name: 'Oil Change',
    payload: {
      intent: 'oil_change',
      businessCount: 2,
      userLocation: {
        latitude: 34.5008,
        longitude: -117.2897
      },
      details: {
        vehicle: '2020 Honda Civic'
      }
    }
  },
  {
    name: 'No Location (Should Fail)',
    payload: {
      intent: 'pizza',
      businessCount: 3,
      details: {
        size: 'large'
      }
    },
    expectError: true
  }
]

async function testConcierge() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║   CONCIERGE REAL BUSINESS INTEGRATION TEST               ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${baseUrl}/api/health`)
    console.log('✅ Server is running\n')
  } catch (error) {
    console.error('❌ Server is not running. Start with: npm run dev')
    process.exit(1)
  }

  // Check environment variables
  console.log('📋 Environment Check:')
  const requiredVars = [
    'GOOGLE_PLACES_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'OPENAI_API_KEY'
  ]

  for (const varName of requiredVars) {
    const isSet = process.env[varName] ? '✅' : '⚠️ '
    console.log(`  ${isSet} ${varName}`)
  }
  console.log('')

  // Run tests
  let passCount = 0
  let failCount = 0

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i]
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Test ${i + 1}/${testCases.length}: ${test.name}`)
    console.log('='.repeat(60))

    try {
      console.log('\n📤 Request:')
      console.log(JSON.stringify(test.payload, null, 2))

      const response = await fetch(`${baseUrl}/api/concierge/initiate-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.payload)
      })

      const data = await response.json()

      console.log('\n📥 Response:')
      console.log(JSON.stringify(data, null, 2))

      // Validate response
      if (test.expectError) {
        if (!data.success && data.error) {
          console.log('\n✅ Test PASSED (Expected error received)')
          passCount++
        } else {
          console.log('\n❌ Test FAILED (Expected error but got success)')
          failCount++
        }
      } else {
        if (data.success && data.calls && data.calls.length > 0) {
          console.log('\n✅ Test PASSED')
          console.log(`   - Found ${data.calls.length} businesses`)
          console.log(`   - Session ID: ${data.sessionId}`)
          
          data.calls.forEach((call, idx) => {
            console.log(`   - Call ${idx + 1}: ${call.business} (${call.phone})`)
            console.log(`     Status: ${call.status}${call.error ? ` - ${call.error}` : ''}`)
          })
          
          passCount++
        } else {
          console.log('\n❌ Test FAILED')
          console.log('   - No businesses returned or call failed')
          failCount++
        }
      }

    } catch (error) {
      console.log('\n❌ Test FAILED')
      console.error('   Error:', error.message)
      failCount++
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${testCases.length}`)
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(60))

  if (failCount === 0) {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
testConcierge().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})



