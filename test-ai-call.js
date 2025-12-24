#!/usr/bin/env node
/**
 * Test AI Voice Call
 * Makes a real call where the AI will have a conversation with you
 */

require('dotenv').config({ path: '.env.local' })

const phoneNumber = process.argv[2] || '+17272377394'
const TUNNEL_URL = 'https://lifehub-voice-1766184431.loca.lt'

console.log('\n🤖 Initiating AI Voice Call...\n')
console.log(`📞 Calling: ${phoneNumber}`)
console.log(`📡 Tunnel: ${TUNNEL_URL}`)

const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function makeAICall() {
  try {
    // Create TwiML that connects to our WebSocket for AI conversation
    const twimlUrl = `${TUNNEL_URL}/api/voice/twiml?` + new URLSearchParams({
      businessName: 'Test Call',
      userRequest: 'This is a test call to verify the AI voice system is working',
      category: 'test',
      userName: 'Robert'
    }).toString()

    console.log(`\n📝 TwiML URL: ${twimlUrl}`)

    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      statusCallback: `${TUNNEL_URL}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 30
    })

    console.log('\n✅ AI Call initiated!')
    console.log(`   Call SID: ${call.sid}`)
    console.log(`   From: ${process.env.TWILIO_PHONE_NUMBER}`)
    console.log(`   To: ${phoneNumber}`)
    console.log(`   Status: ${call.status}`)
    
    console.log('\n📱 Answer your phone! The AI will greet you and have a conversation.')
    console.log('\n💡 Watch the server terminal for WebSocket activity.\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('The AI will:')
    console.log('1. Greet you as "Robert"')
    console.log('2. Explain this is a test call')
    console.log('3. Listen to your responses')
    console.log('4. Respond naturally using OpenAI Realtime API')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Call failed:', error.message)
    
    if (error.code === 21215) {
      console.log('\n💡 Phone number not verified. Add it at:')
      console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified')
    }
    
    process.exit(1)
  }
}

makeAICall()













