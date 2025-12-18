/**
 * Test script for property value scraper
 * Tests Zillow and Redfin scraping with real addresses
 */

async function testPropertyScraper() {
  console.log('🧪 Testing Property Value Scraper\n')
  console.log('=' .repeat(60))
  
  // Test addresses (real properties)
  const testAddresses = [
    '1600 Pennsylvania Avenue NW, Washington, DC 20500', // White House
    '350 5th Ave, New York, NY 10118', // Empire State Building (commercial, might not work)
    '1 Apple Park Way, Cupertino, CA 95014', // Apple Park (commercial)
    '1313 Disneyland Dr, Anaheim, CA 92802', // Disneyland (won't work)
    '742 Evergreen Terrace, Springfield, OR 97477', // Simpsons house (fake)
  ]
  
  // Use a real residential address for testing
  const realTestAddresses = [
    '123 Main St, Tampa, FL 33602',
    '456 Oak Avenue, Los Angeles, CA 90001',
    '789 Pine Street, Austin, TX 78701',
  ]
  
  console.log('📍 Testing with sample addresses...\n')
  
  for (const address of realTestAddresses) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`Testing: ${address}`)
    console.log('─'.repeat(60))
    
    try {
      const response = await fetch('http://localhost:3000/api/zillow-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ SUCCESS')
        console.log(`   💰 Estimated Value: $${data.estimatedValue?.toLocaleString() || 'N/A'}`)
        console.log(`   📊 Source: ${data.source}`)
        console.log(`   🎯 Confidence: ${data.confidence}`)
        console.log(`   📈 Market Trends: ${data.marketTrends}`)
      } else {
        console.log('❌ FAILED')
        console.log(`   Error: ${data.error}`)
      }
    } catch (error) {
      console.log('❌ REQUEST ERROR')
      console.log(`   ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Testing Complete!')
  console.log('\n📝 NOTES:')
  console.log('   - Zillow scraping works best with real residential addresses')
  console.log('   - Commercial properties may not have Zestimates')
  console.log('   - If scraping fails, it will fall back to API → AI → Statistical estimate')
  console.log('   - Rate limiting: Wait 2-3 seconds between requests')
}

// Run test
testPropertyScraper().catch(console.error)

