import { NextResponse } from 'next/server'

// RapidAPI credentials for Zillow property data
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '2657638a72mshdc028c9a0485f14p157dbbjsn28df901ae355'
const RAPIDAPI_HOST = 'zillow-com1.p.rapidapi.com'

export async function POST(request: Request) {
  console.log('\n==================== ZILLOW API REQUEST ====================')
  console.log('🕐 Timestamp:', new Date().toISOString())
  
  try {
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
      
      // Return a helpful error message
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Property not found on Zillow',
          estimatedValue: null,
          message: 'This property may not be listed on Zillow. Please enter value manually.'
        }, { status: 200 }) // Return 200 so frontend doesn't crash
      } else if (response.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'RapidAPI access forbidden',
          estimatedValue: null,
          message: 'API key may be invalid or quota exceeded. Please enter value manually.'
        }, { status: 200 })
      } else if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          estimatedValue: null,
          message: 'Too many requests. Please try again later or enter value manually.'
        }, { status: 200 })
      }
      
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📊 RapidAPI Raw Response (first 1000 chars):', JSON.stringify(data).substring(0, 1000))
    console.log('📊 Response Keys:', Object.keys(data))

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
      console.error('❌ FAILED: Could not find property value in RapidAPI response')
      console.log('==================== END REQUEST ====================\n')
      return NextResponse.json({
        success: false,
        estimatedValue: null, // Don't auto-fill with fallback
        address: foundAddress,
        source: 'No data available',
        confidence: 'none',
        marketTrends: 'Could not retrieve property value from RapidAPI. Property may not be listed or address format may be incorrect.',
        comparables: [],
        timestamp: new Date().toISOString(),
        error: 'Property value not found in RapidAPI response',
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
