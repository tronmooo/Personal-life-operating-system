#!/usr/bin/env node
require('dotenv').config()
const twilio = require('twilio')

const APP_URL = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL

if (!APP_URL) {
  console.error('Usage: node setup-twilio-webhooks.js <APP_URL>')
  process.exit(1)
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

async function updateWebhooks() {
  try {
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: TWILIO_PHONE_NUMBER })
    
    if (numbers.length === 0) {
      console.error('Phone number not found:', TWILIO_PHONE_NUMBER)
      process.exit(1)
    }

    await numbers[0].update({
      voiceUrl: `${APP_URL}/api/voice/twiml`,
      statusCallback: `${APP_URL}/api/voice/status`,
      voiceMethod: 'POST',
      statusCallbackMethod: 'POST'
    })

    console.log('✅ Twilio webhooks updated:')
    console.log(`   Voice URL: ${APP_URL}/api/voice/twiml`)
    console.log(`   Status URL: ${APP_URL}/api/voice/status`)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

updateWebhooks()
