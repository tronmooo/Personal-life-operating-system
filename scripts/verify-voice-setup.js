#!/usr/bin/env node
/**
 * Voice Calling Setup Verification Script
 * Run with: node scripts/verify-voice-setup.js
 */

require('dotenv').config({ path: '.env.local' })

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 VOICE CALLING SETUP VERIFICATION')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let allGood = true
const issues = []

// Check Twilio credentials
console.log('📞 TWILIO CONFIGURATION:')

if (process.env.TWILIO_ACCOUNT_SID) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  if (sid.startsWith('AC') && sid.length >= 30) {
    console.log('   ✅ TWILIO_ACCOUNT_SID: Configured (AC...)')
  } else {
    console.log('   ⚠️  TWILIO_ACCOUNT_SID: Set but may be invalid (should start with AC)')
    issues.push('TWILIO_ACCOUNT_SID format looks incorrect')
    allGood = false
  }
} else {
  console.log('   ❌ TWILIO_ACCOUNT_SID: Missing')
  issues.push('Add TWILIO_ACCOUNT_SID to .env.local')
  allGood = false
}

if (process.env.TWILIO_AUTH_TOKEN) {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (token.length >= 30) {
    console.log('   ✅ TWILIO_AUTH_TOKEN: Configured (***hidden***)')
  } else {
    console.log('   ⚠️  TWILIO_AUTH_TOKEN: Set but seems short - click "Show" in Twilio Console to get full token')
    issues.push('TWILIO_AUTH_TOKEN may be truncated - get full token from Twilio Console')
    allGood = false
  }
} else {
  console.log('   ❌ TWILIO_AUTH_TOKEN: Missing')
  issues.push('Add TWILIO_AUTH_TOKEN to .env.local')
  allGood = false
}

if (process.env.TWILIO_PHONE_NUMBER) {
  const phone = process.env.TWILIO_PHONE_NUMBER
  if (phone.startsWith('+')) {
    console.log(`   ✅ TWILIO_PHONE_NUMBER: ${phone}`)
  } else {
    console.log(`   ⚠️  TWILIO_PHONE_NUMBER: ${phone} (should start with +)`)
    issues.push('TWILIO_PHONE_NUMBER should be in E.164 format (e.g., +17279662653)')
  }
} else {
  console.log('   ❌ TWILIO_PHONE_NUMBER: Missing')
  issues.push('Add TWILIO_PHONE_NUMBER to .env.local (buy one at console.twilio.com)')
  allGood = false
}

console.log('')

// Check OpenAI
console.log('🤖 OPENAI CONFIGURATION:')

if (process.env.OPENAI_API_KEY) {
  const key = process.env.OPENAI_API_KEY
  if (key.startsWith('sk-')) {
    console.log('   ✅ OPENAI_API_KEY: Configured (sk-...)')
    console.log('   ℹ️  Make sure your account has access to gpt-4o-realtime-preview model')
  } else {
    console.log('   ⚠️  OPENAI_API_KEY: Set but format looks wrong (should start with sk-)')
    issues.push('OPENAI_API_KEY format looks incorrect')
    allGood = false
  }
} else {
  console.log('   ❌ OPENAI_API_KEY: Missing')
  issues.push('Add OPENAI_API_KEY to .env.local')
  allGood = false
}

console.log('')

// Check URL configuration
console.log('🌐 URL CONFIGURATION:')

const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (appUrl) {
  console.log(`   ✅ NEXT_PUBLIC_APP_URL: ${appUrl}`)
  if (appUrl.includes('localhost')) {
    console.log('   ℹ️  For Twilio webhooks, you need a public URL (use ngrok)')
  }
} else {
  console.log('   ⚠️  NEXT_PUBLIC_APP_URL: Not set (will default to localhost:3000)')
}

console.log('')

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (allGood) {
  console.log('✅ ALL CORE CREDENTIALS CONFIGURED!')
  console.log('')
  console.log('📋 NEXT STEPS TO MAKE CALLS:')
  console.log('')
  console.log('1. Start ngrok in a new terminal:')
  console.log('   ngrok http 3000')
  console.log('')
  console.log('2. Copy the https URL from ngrok (e.g., https://abc123.ngrok.io)')
  console.log('')
  console.log('3. Update Twilio webhooks at:')
  console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/active')
  console.log('')
  console.log('   Set "A call comes in" webhook to:')
  console.log('   https://YOUR-NGROK-URL/api/voice/twiml')
  console.log('')
  console.log('   Set "Call status changes" webhook to:')
  console.log('   https://YOUR-NGROK-URL/api/voice/status')
  console.log('')
  console.log('4. Start the server with WebSocket support:')
  console.log('   node server.js')
  console.log('')
  console.log('5. Open http://localhost:3000 and try the AI Concierge!')
} else {
  console.log('❌ SOME CONFIGURATION ISSUES FOUND:')
  console.log('')
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`)
  })
  console.log('')
  console.log('📖 See TWILIO_SETUP_INSTRUCTIONS.md for detailed setup guide')
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')













