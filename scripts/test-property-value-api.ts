/**
 * Test script for the improved property value API
 * Tests multiple addresses with different reliable API sources
 */

async function testPropertyValueAPI() {
  console.log('🏠 Testing Property Value API with Reliable Sources\n')
  console.log('=' .repeat(80))
  
  const testAddresses = [
    '123 Main St, Tampa, FL 33606',
    '456 Ocean Ave, Miami, FL 33139',
    '789 Park Place, New York, NY 10001',
    '321 Market St, San Francisco, CA 94102',
  ]
  
  for (const address of testAddresses) {
    console.log(`\n📍 Testing Address: ${address}`)
    console.log('-'.repeat(80))
    
    try {
      const response = await fetch('http://localhost:3000/api/zillow-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })
      
      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Response:', errorText)
        continue
      }
      
      const data = await response.json()
      
      console.log('\n✅ SUCCESS!')
      console.log('  💰 Estimated Value:', `$${data.estimatedValue?.toLocaleString() || 'N/A'}`)
      console.log('  📊 Data Source:', data.source)
      console.log('  🎯 Confidence:', data.confidence)
      console.log('  📈 Market Trends:', data.marketTrends)
      
      if (data.propertyDetails) {
        console.log('\n  🏡 Property Details:')
        console.log('    - Beds:', data.propertyDetails.beds || 'N/A')
        console.log('    - Baths:', data.propertyDetails.baths || 'N/A')
        console.log('    - Sq Ft:', data.propertyDetails.sqft || 'N/A')
        console.log('    - Year Built:', data.propertyDetails.yearBuilt || 'N/A')
        console.log('    - Type:', data.propertyDetails.propertyType || 'N/A')
      }
      
    } catch (error) {
      console.error(`❌ Error testing address "${address}":`, error)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🎉 Test Complete!')
}

// Run the test
testPropertyValueAPI().catch(console.error)

