#!/usr/bin/env node
/**
 * Test Pizza Order Call
 * The AI will call you acting as YOUR assistant ordering pizza
 */

require('dotenv').config({ path: '.env.local' })

const phoneNumber = process.argv[2] || '+17272377394'
const TUNNEL_URL = 'https://silence-cuisine-thousand-gauge.trycloudflare.com'

console.log('\n🍕 PIZZA ORDER TEST\n')
console.log('═'.repeat(50))
console.log('The AI will call you and you pretend to be a pizza shop.')
console.log('')
console.log('Example conversation:')
console.log('  AI: "Hi, I\'d like to order a large cheese pizza for pickup"')
console.log('  You: "Sure, that\'ll be $15.99, ready in 20 minutes"')
console.log('  AI: "Great, let me confirm with Robert and call back. Thanks!"')
console.log('═'.repeat(50) + '\n')

const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function orderPizza() {
  try {
    const callContext = {
      businessName: 'Pizza Palace',
      userRequest: 'order a large cheese pizza for pickup',
      category: 'food',
      userId: 'test-user',
      userData: {
        name: 'Robert'
      }
    }

    const twimlUrl = `${TUNNEL_URL}/api/voice/twiml?callContext=${encodeURIComponent(JSON.stringify(callContext))}`

    console.log('📞 Calling:', phoneNumber)
    console.log('🍕 Order: Large cheese pizza for pickup')
    console.log('👤 On behalf of: Robert\n')

    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      statusCallback: `${TUNNEL_URL}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      timeout: 30
    })

    console.log('✅ Call initiated! SID:', call.sid)
    console.log('\n📱 Answer your phone and pretend to be a pizza shop!')
    console.log('   - Tell the AI a price (e.g., "$15.99")')
    console.log('   - Tell them when it\'ll be ready (e.g., "20 minutes")')
    console.log('')
    console.log('Watch the server terminal for the quote extraction! 💰\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

orderPizza()

