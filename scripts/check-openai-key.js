#!/usr/bin/env node

/**
 * Quick script to verify OpenAI API key is configured
 * Run: node scripts/check-openai-key.js
 */

const fs = require('fs')
const path = require('path')

console.log('\n🔍 Checking OpenAI API Key Configuration...\n')

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file NOT FOUND')
  console.log('\n📝 To fix this:')
  console.log('1. Create .env.local in your project root')
  console.log('2. Add this line: OPENAI_API_KEY=sk-your-key-here')
  console.log('3. Get your API key from: https://platform.openai.com/api-keys')
  console.log('\n')
  process.exit(1)
}

// Read and check for OPENAI_API_KEY
const envContent = fs.readFileSync(envPath, 'utf8')
const keyMatch = envContent.match(/OPENAI_API_KEY=(.+)/)

if (!keyMatch) {
  console.log('❌ OPENAI_API_KEY is NOT set in your .env.local file')
  console.log('\n📝 To fix this:')
  console.log('1. Open .env.local in your project root')
  console.log('2. Add this line: OPENAI_API_KEY=sk-your-key-here')
  console.log('3. Get your API key from: https://platform.openai.com/api-keys')
  console.log('\n')
  process.exit(1)
}

const key = keyMatch[1].trim()

if (key.startsWith('sk-')) {
  console.log('✅ OPENAI_API_KEY is configured!')
  console.log(`   Key starts with: ${key.substring(0, 10)}...`)
  console.log('\n💡 If upload is still failing, restart your dev server:')
  console.log('   Ctrl+C to stop, then run: npm run dev')
  console.log('\n')
  process.exit(0)
} else {
  console.log('⚠️  OPENAI_API_KEY is set but doesn\'t look valid')
  console.log('   OpenAI keys should start with "sk-"')
  console.log(`   Your key starts with: ${key.substring(0, 10)}...`)
  console.log('\n')
  process.exit(1)
}
