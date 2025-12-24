#!/usr/bin/env node

/**
 * Test Google Places API
 * Run: node test-google-places.js
 */

const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

console.log('\n' + '='.repeat(70))
console.log('🔍 TESTING GOOGLE PLACES API')
console.log('='.repeat(70) + '\n')

const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

if (!apiKey) {
  console.log(`${RED}❌ No Google Places API key found in .env.local${RESET}`)
  console.log('\nAdd this to your .env.local:')
  console.log('GOOGLE_PLACES_API_KEY=your-api-key-here\n')
  process.exit(1)
}

console.log(`${BLUE}API Key:${RESET} ${apiKey.substring(0, 20)}...`)

// Test coordinates (Tampa, FL)
const lat = 27.9506
const lng = -82.4572
const query = 'Pizza Hut'

console.log(`${BLUE}Location:${RESET} Tampa, FL (${lat}, ${lng})`)
console.log(`${BLUE}Search:${RESET} "${query}"`)
console.log('')

const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(query)}&location=${lat},${lng}&radius=8000&key=${apiKey}`

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('='.repeat(70))
    
    if (data.status === 'OK') {
      console.log(`${GREEN}✅ GOOGLE PLACES API IS WORKING!${RESET}\n`)
      console.log(`Found ${data.results.length} results for "${query}" near Tampa, FL:\n`)
      
      data.results.slice(0, 5).forEach((r, i) => {
        console.log(`${GREEN}${i + 1}. ${r.name}${RESET}`)
        console.log(`   📍 ${r.vicinity}`)
        console.log(`   🆔 ${r.place_id}`)
        if (r.rating) console.log(`   ⭐ ${r.rating} (${r.user_ratings_total} reviews)`)
        if (r.opening_hours) {
          console.log(`   🕐 ${r.opening_hours.open_now ? 'Open Now' : 'Closed'}`)
        }
        console.log('')
      })
      
      console.log('='.repeat(70))
      console.log(`${GREEN}✅ SUCCESS! Real business data is available.${RESET}`)
      console.log(`${GREEN}✅ The AI Concierge should now find real businesses!${RESET}\n`)
      
    } else if (data.status === 'REQUEST_DENIED') {
      console.log(`${RED}❌ API REQUEST DENIED${RESET}\n`)
      console.log(`Error: ${data.error_message}\n`)
      
      console.log(`${YELLOW}⚠️  YOU NEED TO ENABLE THE PLACES API:${RESET}\n`)
      console.log('1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com')
      console.log('2. Click "ENABLE"')
      console.log('3. Wait 2-3 minutes')
      console.log('4. Run this test again\n')
      
    } else if (data.status === 'ZERO_RESULTS') {
      console.log(`${YELLOW}⚠️  API is working but no results found${RESET}`)
      console.log('Try a different search query or location.\n')
      
    } else {
      console.log(`${RED}❌ API Error: ${data.status}${RESET}`)
      if (data.error_message) {
        console.log(`Error: ${data.error_message}\n`)
      }
    }
    
    console.log('='.repeat(70) + '\n')
  })
  .catch(err => {
    console.log(`${RED}❌ Network Error: ${err.message}${RESET}\n`)
    process.exit(1)
  })































