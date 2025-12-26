#!/usr/bin/env node

/**
 * Environment check for AI Concierge
 * Run: node check-env.js
 */

// Load .env.local the same way Next.js does
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

console.log('\n' + '='.repeat(70))
console.log('🔍 AI CONCIERGE - ENVIRONMENT CHECK')
console.log('='.repeat(70) + '\n')

const checks = [
  {
    section: '🤖 OPENAI (Required for voice AI)',
    vars: [
      { name: 'OPENAI_API_KEY', prefix: 'sk-', minLength: 40 }
    ]
  },
  {
    section: '📞 TWILIO (Required for phone calls)',
    vars: [
      { name: 'TWILIO_ACCOUNT_SID', prefix: 'AC', minLength: 34 },
      { name: 'TWILIO_AUTH_TOKEN', prefix: null, minLength: 30 },
      { name: 'TWILIO_PHONE_NUMBER', prefix: '+1', minLength: 10 }
    ]
  },
  {
    section: '🌐 APP CONFIGURATION',
    vars: [
      { name: 'NEXT_PUBLIC_APP_URL', prefix: 'http', minLength: 10 }
    ]
  },
  {
    section: '🗺️  GOOGLE PLACES (Optional - for business search)',
    vars: [
      { name: 'GOOGLE_PLACES_API_KEY', prefix: 'AIza', required: false },
      { name: 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY', prefix: 'AIza', required: false }
    ]
  }
]

let allRequired = true
let hasWarnings = false

checks.forEach(({ section, vars }) => {
  console.log(`${BLUE}${section}${RESET}`)
  
  vars.forEach(({ name, prefix, minLength, required = true }) => {
    const value = process.env[name]
    
    if (!value) {
      if (required) {
        console.log(`  ${RED}❌ ${name}: NOT SET${RESET}`)
        allRequired = false
      } else {
        console.log(`  ${YELLOW}⚠️  ${name}: Not set (optional)${RESET}`)
      }
      return
    }
    
    // Check prefix
    if (prefix && !value.startsWith(prefix)) {
      console.log(`  ${YELLOW}⚠️  ${name}: Set but should start with "${prefix}"${RESET}`)
      console.log(`     Current: ${value.substring(0, 20)}...`)
      hasWarnings = true
      return
    }
    
    // Check length
    if (minLength && value.length < minLength) {
      console.log(`  ${YELLOW}⚠️  ${name}: Too short (${value.length} chars, expected ${minLength}+)${RESET}`)
      console.log(`     Value: ${value.substring(0, 20)}...`)
      hasWarnings = true
      return
    }
    
    // All good
    const preview = value.length > 30 ? `${value.substring(0, 25)}...` : value
    console.log(`  ${GREEN}✅ ${name}${RESET}`)
    console.log(`     ${preview}`)
  })
  
  console.log('')
})

// Final status
console.log('='.repeat(70))

if (allRequired && !hasWarnings) {
  console.log(`${GREEN}✅ ALL SYSTEMS GO! Ready to make phone calls.${RESET}\n`)
  console.log('📞 NEXT STEPS:\n')
  console.log('1. Start server: ' + BLUE + 'npm run dev:server' + RESET)
  console.log('2. Open app: ' + BLUE + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + RESET)
  console.log('3. Update Twilio webhooks to:')
  console.log('   - A call comes in: ' + (process.env.NEXT_PUBLIC_APP_URL || 'YOUR_DOMAIN') + '/api/voice/twiml')
  console.log('   - Call status: ' + (process.env.NEXT_PUBLIC_APP_URL || 'YOUR_DOMAIN') + '/api/webhooks/call-status')
  console.log('4. Test via AI Concierge interface\n')
} else if (allRequired) {
  console.log(`${YELLOW}✅ Required variables set, but check warnings above.${RESET}\n`)
} else {
  console.log(`${RED}❌ MISSING REQUIRED VARIABLES${RESET}\n`)
  console.log('Edit your .env.local file and add:\n')
  console.log(YELLOW + '# ===== AI CONCIERGE PHONE CALLING =====' + RESET)
  console.log('')
  console.log(YELLOW + '# OpenAI (get from: https://platform.openai.com/api-keys)' + RESET)
  console.log('OPENAI_API_KEY=sk-your-openai-key-here')
  console.log('')
  console.log(YELLOW + '# Twilio (get from: https://console.twilio.com)' + RESET)
  console.log('TWILIO_ACCOUNT_SID=ACbe0fd20294a9...')
  console.log('TWILIO_AUTH_TOKEN=your-32-char-auth-token-here')
  console.log('TWILIO_PHONE_NUMBER=+17279662653')
  console.log('')
  console.log(YELLOW + '# Your domain' + RESET)
  console.log('NEXT_PUBLIC_APP_URL=https://life-hub.me')
  console.log('')
  console.log(YELLOW + '# Google Places (optional but recommended)' + RESET)
  console.log('GOOGLE_PLACES_API_KEY=your-google-places-key')
  console.log('')
}

console.log('='.repeat(70) + '\n')

process.exit(allRequired ? 0 : 1)











































