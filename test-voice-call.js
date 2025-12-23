#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })

const phoneNumber = process.argv[2] || '+17272377394'
// Use the main app tunnel for TwiML (port 3000)
const APP_TUNNEL = 'https://wma-pencil-conceptual-eur.trycloudflare.com'

console.log('\n🍕 PIZZA ORDER TEST (Separate Voice Server)\n')

const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function makeCall() {
  const callContext = {
    businessName: 'Pizza Palace',
    userRequest: 'order a large cheese pizza for pickup',
    category: 'food',
    userId: 'test',
    userData: { name: 'Robert' }
  }

  const twimlUrl = `${APP_TUNNEL}/api/voice/twiml?callContext=${encodeURIComponent(JSON.stringify(callContext))}`

  console.log('📞 Calling:', phoneNumber)
  console.log('🍕 Order: Large cheese pizza')
  console.log('📡 TwiML:', twimlUrl.substring(0, 60) + '...')
  console.log('')

  const call = await client.calls.create({
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: twimlUrl,
    statusCallback: `${APP_TUNNEL}/api/voice/status`,
    timeout: 30
  })

  console.log('✅ Call SID:', call.sid)
  console.log('\n📱 ANSWER YOUR PHONE!')
  console.log('   Say: "Pizza Palace, how can I help you?"')
  console.log('   AI will say: "Hi, I\'d like to order a large cheese pizza"')
  console.log('   You say: "That\'s $15.99, ready in 20 minutes"')
  console.log('\n💡 Watch terminal 13 for the conversation!\n')
}

makeCall().catch(console.error)

