import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// RapidAPI credentials for Zillow property data
// NOTE: zillow-com1 was deprecated Dec 9 2025, migrated to us-housing-market-data1
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '2657638a72mshdc028c9a0485f14p157dbbjsn28df901ae355'
const RAPIDAPI_HOST = 'us-housing-market-data1.p.rapidapi.com'

// Gemini API for AI-powered property estimation fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

// AI-powered property value estimation when RapidAPI fails
async function estimatePropertyValueWithAI(address: string): Promise<{ value: number; confidence: string } | null> {
  if (!GEMINI_API_KEY) {
    console.log('⚠️ No Gemini API key available for AI estimation')
    return null
  }

  try {
    console.log('🤖 Using Gemini AI to estimate property value...')
    
    const prompt = `You are a real estate valuation expert. Based on the address provided, estimate the current market value of this property.

Address: ${address}

Consider:
- Location and neighborhood (use your knowledge of US real estate markets)
- Property type (assume single-family home if not specified)
- Current market conditions (late 2024/early 2025)
- Regional price trends for Florida (if applicable)

For Tarpon Springs, FL area (Pinellas County), typical home values range from $250,000 to $500,000 for standard single-family homes.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"estimatedValue": 350000, "confidence": "medium", "reasoning": "brief explanation"}

The estimatedValue should be a realistic number based on the location.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    )

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status)
      return null
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('🤖 Gemini response:', textResponse)

    // Parse JSON from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.estimatedValue && typeof parsed.estimatedValue === 'number') {
        console.log(`✅ AI estimated value: $${parsed.estimatedValue.toLocaleString()}`)
        return {
          value: parsed.estimatedValue,
          confidence: parsed.confidence || 'medium'
        }
      }
    }
  } catch (error) {
    console.error('❌ AI estimation error:', error)
  }
  return null
}

export async function POST(request: Request) {
  console.log('\n==================== ZILLOW API REQUEST ====================')
  console.log('🕐 Timestamp:', new Date().toISOString())
  
  try {
    // Verify authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const { address } = await request.json()

    if (!address) {
      console.error('❌ ERROR: No address provided')
      return NextResponse.json(
        { error: 'Address is required', estimatedValue: null },
        { status: 400 }
      )
    }

    console.log('📍 Input Address:', address)

    // Check API key
    if (!RAPIDAPI_KEY) {
      console.error('❌ CRITICAL ERROR: RapidAPI key is missing!')
      return NextResponse.json(
        { error: 'RapidAPI key not configured', estimatedValue: null },
        { status: 500 }
      )
    }
    
    console.log('🔑 API Key found:', RAPIDAPI_KEY.substring(0, 15) + '...')

    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(address)
    console.log('🔐 Encoded Address:', encodedAddress)
    
    // RapidAPI Zillow endpoint - property details by address
    const rapidApiUrl = `https://${RAPIDAPI_HOST}/propertyExtendedSearch?location=${encodedAddress}&status_type=ForSale&home_type=Houses`
    
    console.log('🌐 Full API URL:', rapidApiUrl)
    console.log('📡 Request Headers:', {
      'X-RapidAPI-Key': RAPIDAPI_KEY.substring(0, 15) + '...',
      'X-RapidAPI-Host': RAPIDAPI_HOST
    })
    
    console.log('⏳ Calling RapidAPI...')
    const startTime = Date.now()
    
    const response = await fetch(rapidApiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    })
    
    const endTime = Date.now()
    console.log(`⚡ API Response Time: ${endTime - startTime}ms`)
    console.log('📥 HTTP Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ RapidAPI ERROR:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      
      // Try AI fallback when RapidAPI fails
      console.log('🔄 RapidAPI failed, trying AI estimation fallback...')
      const aiEstimate = await estimatePropertyValueWithAI(address)
      
      if (aiEstimate) {
        return NextResponse.json({
          success: true,
          estimatedValue: aiEstimate.value,
          address: address,
          source: 'AI Estimation (Gemini)',
          confidence: aiEstimate.confidence,
          marketTrends: 'AI-estimated based on location and market data',
          comparables: ['AI estimation based on regional market analysis'],
          timestamp: new Date().toISOString()
        })
      }
      
      // Return error only if AI fallback also fails
      return NextResponse.json({
        success: false,
        error: 'Property value lookup failed',
        estimatedValue: null,
        message: 'Could not retrieve property value. Please enter value manually.'
      }, { status: 200 })
    }

    const data = await response.json()
    console.log('📊 RapidAPI Raw Response (first 1000 chars):', JSON.stringify(data).substring(0, 1000))
    console.log('📊 Response Keys:', Object.keys(data))
    
    // If ForSale search returns no results, try propertyByAddress endpoint
    let altData = null
    if ((!data.props || data.props.length === 0) && !data.zpid) {
      try {
        // Try the property search endpoint without ForSale filter
        const altUrl = `https://${RAPIDAPI_HOST}/propertyByAddress?address=${encodedAddress}`
        console.log('🔄 Trying alternative endpoint: propertyByAddress')
        
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          }
        })
        
        if (altResponse.ok) {
          altData = await altResponse.json()
          console.log('📊 propertyByAddress response keys:', Object.keys(altData))
        } else {
          console.log('⚠️ propertyByAddress failed:', altResponse.status)
        }
      } catch (altError) {
        console.log('⚠️ propertyByAddress error:', altError)
      }
    }

    // Extract property value from the response
    let estimatedValue = null
    let foundAddress = address
    
    console.log('🔍 Searching for property value in response...')
    
    // Check if we only got a zpid (Zillow Property ID)
    if (data.zpid && !data.price && !data.zestimate) {
      console.log('🔑 Got zpid:', data.zpid, '- Making follow-up call for property details...')
      
      try {
        // Make a second API call to get property details using the zpid
        const detailsUrl = `https://${RAPIDAPI_HOST}/property?zpid=${data.zpid}`
        console.log('📡 Calling property details API:', detailsUrl)
        
        const detailsResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          }
        })
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          console.log('📊 Property details response keys:', Object.keys(detailsData))
          
          // Extract value from details response
          estimatedValue = detailsData.price || 
                          detailsData.zestimate ||
                          detailsData.hdpData?.homeInfo?.price ||
                          detailsData.hdpData?.homeInfo?.zestimate ||
                          null
          
          console.log('💡 Extracted value from details:', estimatedValue)
        } else {
          console.warn('⚠️ Details API failed:', detailsResponse.status)
        }
      } catch (detailsError) {
        console.error('❌ Error fetching property details:', detailsError)
      }
    }
    
    // RapidAPI Zillow response structure varies, check multiple possible fields
    if (data.props && Array.isArray(data.props) && data.props.length > 0) {
      console.log('✅ Found data.props array with', data.props.length, 'properties')
      const property = data.props[0]
      console.log('🔍 Property data keys:', Object.keys(property))
      console.log('🔍 Checking fields:', {
        price: property.price,
        zestimate: property.zestimate,
        unformattedPrice: property.unformattedPrice,
        'hdpData?.homeInfo?.price': property.hdpData?.homeInfo?.price,
        'hdpData?.homeInfo?.zestimate': property.hdpData?.homeInfo?.zestimate
      })
      
      // Try to get the price/zestimate from multiple possible fields
      estimatedValue = property.price || 
                       property.zestimate || 
                       property.unformattedPrice ||
                       property.hdpData?.homeInfo?.price ||
                       property.hdpData?.homeInfo?.zestimate ||
                       null
      
      console.log('💡 Extracted value:', estimatedValue)
      
      if (property.address) {
        foundAddress = property.address
        console.log('📍 Found address in response:', foundAddress)
      }
    } else if (data.result && Array.isArray(data.result)) {
      console.log('✅ Found data.result array')
      // Alternative response structure
      const property = data.result[0]
      if (property) {
        console.log('🔍 Result property keys:', Object.keys(property))
        estimatedValue = property.price || property.zestimate || null
        foundAddress = property.address || address
        console.log('💡 Extracted value:', estimatedValue, 'Address:', foundAddress)
      }
    } else if (!estimatedValue) {
      console.warn('⚠️ Unexpected response structure. Keys:', Object.keys(data))
      console.log('📄 Full response:', JSON.stringify(data, null, 2))
    }
    
    // Try to extract from altData if we got it from propertyByAddress
    if (!estimatedValue && altData) {
      estimatedValue = altData.zestimate || 
                       altData.price || 
                       altData.hdpData?.homeInfo?.zestimate ||
                       altData.hdpData?.homeInfo?.price ||
                       altData.rentZestimate ||
                       null
      
      if (altData.address) {
        foundAddress = typeof altData.address === 'object' 
          ? `${altData.address.streetAddress}, ${altData.address.city}, ${altData.address.state} ${altData.address.zipcode}`
          : altData.address
      }
    }

    if (estimatedValue && estimatedValue > 0) {
      console.log(`✅ SUCCESS! Property value: $${estimatedValue.toLocaleString()}`)
      console.log('==================== END REQUEST ====================\n')
      return NextResponse.json({
        success: true,
        estimatedValue,
        address: foundAddress,
        source: 'RapidAPI Zillow',
        confidence: 'high',
        marketTrends: 'Property value from Zillow via RapidAPI',
        comparables: [`Zillow data via RapidAPI`],
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⚠️ No value from RapidAPI, trying AI estimation fallback...')
      
      // Try AI fallback when RapidAPI returns no value
      const aiEstimate = await estimatePropertyValueWithAI(address)
      
      if (aiEstimate) {
        console.log(`✅ AI Fallback SUCCESS! Estimated value: $${aiEstimate.value.toLocaleString()}`)
        console.log('==================== END REQUEST ====================\n')
        return NextResponse.json({
          success: true,
          estimatedValue: aiEstimate.value,
          address: foundAddress,
          source: 'AI Estimation (Gemini)',
          confidence: aiEstimate.confidence,
          marketTrends: 'AI-estimated based on location and market data',
          comparables: ['AI estimation based on regional market analysis'],
          timestamp: new Date().toISOString()
        })
      }
      
      console.error('❌ FAILED: Could not find property value from any source')
      console.log('==================== END REQUEST ====================\n')
      return NextResponse.json({
        success: false,
        estimatedValue: null,
        address: foundAddress,
        source: 'No data available',
        confidence: 'none',
        marketTrends: 'Could not retrieve property value. Please enter value manually.',
        comparables: [],
        timestamp: new Date().toISOString(),
        error: 'Property value not found',
        message: 'Please enter property value manually.'
      })
    }

  } catch (error) {
    console.error('❌❌❌ FATAL ERROR in Zillow API ❌❌❌')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('==================== END REQUEST (ERROR) ====================\n')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch from RapidAPI Zillow',
        message: error instanceof Error ? error.message : 'Unknown error',
        estimatedValue: null,
        address: '',
        source: 'Error',
        confidence: 'none',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 200 } // Return 200 so frontend can handle gracefully
    )
  }
}
