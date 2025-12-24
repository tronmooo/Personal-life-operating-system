/**
 * Quick test script for property price API
 * Run: node test-property-api.js
 */

const testAddresses = [
  '1600 Pennsylvania Avenue NW, Washington, DC 20500',
  '123 Main St, Tampa, FL 33607',
  '456 Oak Ave, Los Angeles, CA 90001'
]

async function testAPI() {
  console.log('🧪 Testing Property Price API...\n')
  
  for (const address of testAddresses) {
    console.log(`📍 Testing: ${address}`)
    
    try {
      const response = await fetch('http://localhost:3000/api/zillow-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ SUCCESS: $${data.estimatedValue.toLocaleString()}`)
        console.log(`   Source: ${data.source}`)
        console.log(`   Confidence: ${data.confidence}`)
      } else {
        console.log(`❌ FAILED: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
    
    console.log('')
  }
}

testAPI()





































