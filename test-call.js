#!/usr/bin/env node
/**
 * Direct Phone Call Test
 * This script makes an ACTUAL phone call to test the Twilio integration
 * 
 * Usage: node test-call.js +15551234567
 * (Replace with a real phone number you can answer)
 */

require('dotenv').config({ path: '.env.local' })

const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.log('❌ Usage: node test-call.js +15551234567')
  console.log('   Replace +15551234567 with YOUR phone number to receive the test call')
  process.exit(1)
}

// Check environment
console.log('\n🔍 Checking configuration...\n')

const required = {
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
  'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER
}

let missing = false
for (const [key, value] of Object.entries(required)) {
  if (value) {
    console.log(`✅ ${key}: ${key.includes('TOKEN') ? '***configured***' : value}`)
  } else {
    console.log(`❌ ${key}: MISSING`)
    missing = true
  }
}

if (missing) {
  console.log('\n❌ Missing required environment variables. Check your .env.local file.\n')
  process.exit(1)
}

console.log('\n📞 Making test call...\n')

const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Simple TwiML that speaks a test message
const twimlUrl = 'http://twimlets.com/message?Message%5B0%5D=Hello!%20This%20is%20a%20test%20call%20from%20your%20Life%20Hub%20AI%20Concierge.%20Your%20phone%20calling%20system%20is%20working!%20Goodbye.'

async function makeCall() {
  try {
    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      timeout: 30
    })

    console.log('✅ Call initiated successfully!')
    console.log(`   Call SID: ${call.sid}`)
    console.log(`   From: ${process.env.TWILIO_PHONE_NUMBER}`)
    console.log(`   To: ${phoneNumber}`)
    console.log(`   Status: ${call.status}`)
    console.log('\n📱 Answer your phone! You should receive a call in a few seconds.\n')
    console.log('💡 If the call works, your Twilio integration is properly configured.')
    console.log('   Next step: Set up ngrok and update webhooks for AI voice conversations.\n')
  } catch (error) {
    console.error('❌ Call failed:', error.message)
    
    if (error.code === 21215) {
      console.log('\n💡 Your Twilio account may not have access to call this number.')
      console.log('   - If using trial account: You can only call verified numbers')
      console.log('   - Verify the number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified')
    } else if (error.code === 21217) {
      console.log('\n💡 Invalid phone number format. Use E.164 format: +15551234567')
    } else if (error.message.includes('authenticate')) {
      console.log('\n💡 Authentication failed. Check your TWILIO_AUTH_TOKEN is correct.')
      console.log('   Go to Twilio Console → click "Show" next to Auth Token → copy the full value')
    }
    
    process.exit(1)
  }
}

makeCall()






