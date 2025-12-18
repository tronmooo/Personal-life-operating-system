/**
 * MULTI-SOURCE PROPERTY PRICE SCRAPER
 * Tries multiple real estate sites to get REAL property values
 * Priority: Redfin → Realtor.com → Zillow → Market Estimate
 */

export interface ZillowScraperResult {
  value: number
  source: string
  confidence: string
  details?: {
    address?: string
    beds?: number
    baths?: number
    sqft?: number
    yearBuilt?: number
    propertyType?: string
  }
}

// ===================================================================================
// METHOD 1: REDFIN SCRAPER (Often less protected than Zillow!)
// ===================================================================================
export async function scrapeRedfinPrice(address: string): Promise<ZillowScraperResult | null> {
  try {
    console.log('🏠 [REDFIN] Attempting to scrape Redfin.com...')
    
    // Redfin search URL
    const searchQuery = encodeURIComponent(address)
    const redfinSearchUrl = `https://www.redfin.com/stingray/do/location-autocomplete?location=${searchQuery}&v=2`
    
    console.log('🔗 [REDFIN] Search URL:', redfinSearchUrl)
    
    // Step 1: Search for property
    const searchResponse = await fetch(redfinSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.redfin.com/'
      }
    })
    
    if (!searchResponse.ok) {
      console.log('⚠️ [REDFIN] Search failed:', searchResponse.status)
      return null
    }
    
    const searchText = await searchResponse.text()
    
    // Redfin returns JSONP, extract JSON
    const jsonMatch = searchText.match(/&&&&/)
    ? searchText.split('&&&&')[1]
    : searchText.match(/\{.*\}/)
    ? searchText.match(/\{.*\}/)?.[0]
    : null
    
    if (!jsonMatch) {
      console.log('⚠️ [REDFIN] Could not parse search response')
      return null
    }
    
    const searchData = JSON.parse(jsonMatch)
    
    // Get first property result
    const property = searchData.payload?.sections?.[0]?.rows?.[0]
    if (!property) {
      console.log('⚠️ [REDFIN] No property found')
      return null
    }
    
    console.log('✅ [REDFIN] Property found:', property.name)
    
    // Try to get price directly from search results
    const price = property.price || property.priceInfo?.amount
    
    if (price && price > 10000) {
      console.log(`✅ [REDFIN] Found price: $${price.toLocaleString()}`)
      return {
        value: Number(price),
        source: 'Redfin.com (Live Scrape)',
        confidence: 'high',
        details: {
          address: property.name || address,
          beds: property.beds,
          baths: property.baths,
          sqft: property.sqFt
        }
      }
    }
    
    // If no price in search, try to fetch property page
    if (property.url) {
      const propertyUrl = `https://www.redfin.com${property.url}`
      console.log('🔗 [REDFIN] Fetching property page:', propertyUrl)
      
      const propResponse = await fetch(propertyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://www.redfin.com/'
        }
      })
      
      if (propResponse.ok) {
        const html = await propResponse.text()
        
        // Look for price in HTML
        const pricePatterns = [
          /statsValue[^>]*>\$?([0-9,]+)/i,
          /price[^>]*>\$?([0-9,]+)/i,
          /"price":"?\$?([0-9,]+)"?/i,
          /Redfin Estimate[^\d]*\$?([0-9,]+)/i,
        ]
        
        for (const pattern of pricePatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            const priceStr = match[1].replace(/,/g, '')
            const parsedPrice = parseInt(priceStr, 10)
            if (parsedPrice > 10000 && parsedPrice < 100000000) {
              console.log(`✅ [REDFIN] Found price in HTML: $${parsedPrice.toLocaleString()}`)
              return {
                value: parsedPrice,
                source: 'Redfin.com (Live Scrape)',
                confidence: 'high'
              }
            }
          }
        }
      }
    }
    
    console.log('⚠️ [REDFIN] No price found')
    return null
    
  } catch (error) {
    console.error('❌ [REDFIN] Error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// ===================================================================================
// METHOD 2: REALTOR.COM SCRAPER
// ===================================================================================
export async function scrapeRealtorPrice(address: string): Promise<ZillowScraperResult | null> {
  try {
    console.log('🏠 [REALTOR] Attempting to scrape Realtor.com...')
    
    const searchQuery = encodeURIComponent(address)
    const realtorUrl = `https://www.realtor.com/realestateandhomes-search/${searchQuery}`
    
    console.log('🔗 [REALTOR] URL:', realtorUrl)
    
    const response = await fetch(realtorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.realtor.com/'
      }
    })
    
    if (!response.ok) {
      console.log('⚠️ [REALTOR] HTTP', response.status)
      return null
    }
    
    const html = await response.text()
    
    // Look for price in HTML
    const pricePatterns = [
      /data-label="pc-price"[^>]*>\$([0-9,]+)/i,
      /class="[^"]*price[^"]*"[^>]*>\$([0-9,]+)/i,
      /"price":"?\$?([0-9,]+)"?/i,
      /\$([0-9,]+)<\/span>/i,
    ]
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '')
        const price = parseInt(priceStr, 10)
        if (price > 10000 && price < 100000000) {
          console.log(`✅ [REALTOR] Found price: $${price.toLocaleString()}`)
          return {
            value: price,
            source: 'Realtor.com (Live Scrape)',
            confidence: 'high'
          }
        }
      }
    }
    
    console.log('⚠️ [REALTOR] No price found')
    return null
    
  } catch (error) {
    console.error('❌ [REALTOR] Error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// ===================================================================================
// METHOD 3: ZILLOW SCRAPER (Original)
// ===================================================================================
export async function scrapeZillowPrice(address: string): Promise<ZillowScraperResult | null> {
  try {
    console.log('🏠 [ZILLOW] Attempting to scrape Zillow.com...')
    
    const searchQuery = address
      .replace(/,/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
    
    const zillowUrl = `https://www.zillow.com/homes/${encodeURIComponent(searchQuery)}_rb/`
    
    console.log('🔗 [ZILLOW] URL:', zillowUrl)
    
    const response = await fetch(zillowUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.zillow.com/'
      }
    })
    
    if (!response.ok) {
      console.log('⚠️ [ZILLOW] HTTP', response.status)
      return null
    }
    
    const html = await response.text()
    
    // Multiple price extraction patterns
    const pricePatterns = [
      /"zestimate":(\d+)/i,
      /Zestimate[^$]*\$([0-9,]+)/i,
      /"price":(\d+)/i,
      /data-test="property-card-price"[^>]*>\$([0-9,]+)/i,
      /class="[^"]*price[^"]*"[^>]*>\$([0-9,]+)/i,
    ]
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '')
        const price = parseInt(priceStr, 10)
        if (price > 10000 && price < 100000000) {
          console.log(`✅ [ZILLOW] Found price: $${price.toLocaleString()}`)
          return {
            value: price,
            source: 'Zillow.com (Live Scrape)',
            confidence: 'high'
          }
        }
      }
    }
    
    console.log('⚠️ [ZILLOW] No price found')
    return null
    
  } catch (error) {
    console.error('❌ [ZILLOW] Error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// ===================================================================================
// MAIN FUNCTION: Try all sources in priority order
// ===================================================================================
export async function scrapePropertyPrice(address: string): Promise<ZillowScraperResult | null> {
  console.log('\n🔍 Trying multiple real estate sites...\n')
  
  // Priority 1: Redfin (often less protected)
  let result = await scrapeRedfinPrice(address)
  if (result) return result
  
  // Priority 2: Realtor.com
  result = await scrapeRealtorPrice(address)
  if (result) return result
  
  // Priority 3: Zillow
  result = await scrapeZillowPrice(address)
  if (result) return result
  
  console.log('⚠️ All scraping attempts failed')
  return null
}
