import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, keyword, type, radius } = await request.json()

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    // Nearby Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&type=${type}&key=${apiKey}`

    console.log('🔍 Google Places API request:', { latitude, longitude, keyword, type, radius })

    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error:', searchData.status, searchData.error_message)
      return NextResponse.json(
        { error: `Google Places API error: ${searchData.status}`, status: searchData.status },
        { status: 400 }
      )
    }

    if (searchData.status === 'ZERO_RESULTS') {
      return NextResponse.json({ results: [], status: 'ZERO_RESULTS' })
    }

    // Get details for each place (including phone numbers)
    const placesWithDetails = await Promise.all(
      searchData.results.slice(0, 5).map(async (place: any) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,rating,geometry&key=${apiKey}`
          
          const detailsResponse = await fetch(detailsUrl)
          const detailsData = await detailsResponse.json()

          if (detailsData.result) {
            return {
              place_id: place.place_id,
              name: detailsData.result.name,
              formatted_phone_number: detailsData.result.formatted_phone_number,
              formatted_address: detailsData.result.formatted_address,
              rating: detailsData.result.rating,
              geometry: detailsData.result.geometry,
              types: place.types
            }
          }
          return null
        } catch (error) {
          console.error('Error fetching place details:', error)
          return null
        }
      })
    )

    const validPlaces = placesWithDetails.filter(p => p !== null && p.formatted_phone_number)

    console.log(`✅ Found ${validPlaces.length} places with phone numbers`)

    return NextResponse.json({
      results: validPlaces,
      status: 'OK'
    })

  } catch (error) {
    console.error('❌ Error in Google Places search:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}








