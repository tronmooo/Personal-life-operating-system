import { NextResponse } from 'next/server'

/**
 * REALTOR.COM PROPERTY PRICE API
 * Gets REAL property values from Realtor.com
 */

interface PropertyResult {
  value: number
  source: string
  confidence: string
  details?: any
}

async function getRealtorPrice(address: string): Promise<PropertyResult | null> {
  try {
    console.log('🏠 [REALTOR] Searching for property:', address)
    
    // Realtor.com search URL
    const searchQuery = encodeURIComponent(address.replace(/,/g, ''))
    const searchUrl = `https://www.realtor.com/realestateandhomes-search/${searchQuery}`
    
    console.log('🔗 [REALTOR] URL:', searchUrl)
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.realtor.com/'
      }
    })
    
    if (!response.ok) {
      console.log('⚠️ [REALTOR] HTTP', response.status)
      return null
    }
    
    const html = await response.text()
    console.log('✅ [REALTOR] Page loaded, extracting price...')
    
    // Multiple patterns to find price
    const pricePatterns = [
      // Price in data attributes
      /data-label="pc-price"[^>]*>\$([0-9,]+)/i,
      
      // Price in structured data
      /"price":"?\$?([0-9,]+)"?/i,
      /"price":(\d+)/i,
      
      // Price in meta tags
      /property="og:price:amount"[^>]*content="([0-9,]+)"/i,
      
      // Price in class names
      /class="[^"]*price[^"]*"[^>]*>\$([0-9,]+)/i,
      
      // Price in spans
      /<span[^>]*>\$([0-9,]+)</i,
      
      // Listed price
      /Listed.*?\$([0-9,]+)/i,
      /List Price.*?\$([0-9,]+)/i
    ]
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        const priceStr = match[1].replace(/,/g, '')
        const price = parseInt(priceStr, 10)
        
        if (price > 10000 && price < 100000000) {
          console.log(`✅ [REALTOR] Found price: $${price.toLocaleString()}`)
          
          // Try to extract property details
          const bedsMatch = html.match(/(\d+)\s*(?:bed|bd)/i)
          const bathsMatch = html.match(/(\d+)\s*(?:bath|ba)/i)
          const sqftMatch = html.match(/([\d,]+)\s*(?:sqft|sq\.?\s*ft)/i)
          
          return {
            value: price,
            source: 'Realtor.com',
            confidence: 'high',
            details: {
              address: address,
              beds: bedsMatch ? parseInt(bedsMatch[1]) : undefined,
              baths: bathsMatch ? parseInt(bathsMatch[1]) : undefined,
              sqft: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : undefined
            }
          }
        }
      }
    }
    
    // Try to find JSON data embedded in the page
    // Avoid the `s` (dotAll) regex flag so we remain compatible with older TS targets.
    // Equivalent to dotAll: [\s\S]*?
    const jsonMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1])
        
        // Check different JSON structures
        const price = jsonData.offers?.price || 
                     jsonData.offers?.lowPrice ||
                     jsonData.price
        
        if (price) {
          const parsedPrice = parseInt(String(price).replace(/[^0-9]/g, ''), 10)
          if (parsedPrice > 10000 && parsedPrice < 100000000) {
            console.log(`✅ [REALTOR] Found price in JSON: $${parsedPrice.toLocaleString()}`)
            return {
              value: parsedPrice,
              source: 'Realtor.com',
              confidence: 'high'
            }
          }
        }
      } catch (e) {
        // JSON parse failed
      }
    }
    
    console.log('⚠️ [REALTOR] Could not extract price from page')
    return null
    
  } catch (error) {
    console.error('❌ [REALTOR] Error:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// Fallback estimate
function getMarketEstimate(address: string): PropertyResult {
  console.log('📊 [FALLBACK] Using market estimate')
  
  const lower = address.toLowerCase()
  let baseValue = 350000
  
  // State-based pricing
  if (lower.includes('california') || lower.includes(', ca')) {
    baseValue = 750000
  } else if (lower.includes('florida') || lower.includes(', fl')) {
    baseValue = 400000
    if (lower.includes('miami') || lower.includes('fort lauderdale')) baseValue = 550000
    else if (lower.includes('tampa') || lower.includes('tarpon springs')) baseValue = 380000
  } else if (lower.includes('new york') || lower.includes(', ny')) {
    baseValue = 600000
  } else if (lower.includes('texas') || lower.includes(', tx')) {
    baseValue = 380000
  } else if (lower.includes('washington') || lower.includes(', wa')) {
    baseValue = 550000
  } else if (lower.includes('colorado') || lower.includes(', co')) {
    baseValue = 500000
  }
  
  const variance = (Math.random() - 0.5) * 0.1
  const finalValue = Math.round(baseValue * (1 + variance))
  
  return {
    value: finalValue,
    source: 'Market Estimate',
    confidence: 'medium'
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('\n🏡 ==================== PROPERTY PRICE LOOKUP ====================')
  
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json(
        { error: 'Address required', success: false },
        { status: 400 }
      )
    }

    const cleanAddress = address.trim()
    console.log('📍 Address:', cleanAddress)

    // Try Realtor.com
    let result = await getRealtorPrice(cleanAddress)
    
    // Fallback to market estimate if scraping fails
    if (!result) {
      console.log('⚠️ Realtor.com lookup failed, using market estimate')
      result = getMarketEstimate(cleanAddress)
    }

    const duration = Date.now() - startTime
    
    const isRealData = result.source === 'Realtor.com'
    console.log(`${isRealData ? '✅' : '📊'} RESULT: $${result.value.toLocaleString()} from ${result.source}`)
    console.log(`⚡ ${duration}ms`)
    console.log('==================== END ====================\n')
    
    return NextResponse.json({
      success: true,
      estimatedValue: result.value,
      address: cleanAddress,
      source: result.source,
      confidence: result.confidence,
      propertyDetails: result.details || null,
      responseTime: duration,
      isRealData: isRealData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ ERROR:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch property data',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
