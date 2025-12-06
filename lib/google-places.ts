// Google Places API Integration for Business Search

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

export interface PlaceResult {
  name: string
  formattedAddress: string
  phoneNumber?: string
  rating?: number
  priceLevel?: number
  businessStatus?: string
  placeId: string
}

/**
 * Search for businesses using Google Places API
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius: number = 5000 // 5km default
): Promise<PlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured')
    return []
  }

  try {
    // Use Text Search API for natural language queries
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.append('query', query)
    searchUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY)
    
    if (location) {
      searchUrl.searchParams.append('location', `${location.lat},${location.lng}`)
      searchUrl.searchParams.append('radius', radius.toString())
    }

    const response = await fetch(searchUrl.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)
      return []
    }

    if (!data.results || data.results.length === 0) {
      return []
    }

    // Get detailed information for each place (including phone numbers)
    const detailedResults = await Promise.all(
      data.results.slice(0, 5).map((place: any) => getPlaceDetails(place.place_id))
    )

    return detailedResults.filter((result): result is PlaceResult => result !== null)
  } catch (error) {
    console.error('Error searching places:', error)
    return []
  }
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null
  }

  try {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    detailsUrl.searchParams.append('place_id', placeId)
    detailsUrl.searchParams.append('fields', 'name,formatted_address,formatted_phone_number,rating,price_level,business_status')
    detailsUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY)

    const response = await fetch(detailsUrl.toString())
    const data = await response.json()

    if (data.status !== 'OK' || !data.result) {
      console.error('Place details error:', data.status)
      return null
    }

    const result = data.result
    return {
      name: result.name,
      formattedAddress: result.formatted_address,
      phoneNumber: result.formatted_phone_number,
      rating: result.rating,
      priceLevel: result.price_level,
      businessStatus: result.business_status,
      placeId: placeId
    }
  } catch (error) {
    console.error('Error getting place details:', error)
    return null
  }
}

/**
 * Find the best match for a business type near a location
 */
export async function findBestBusiness(
  businessType: string,
  location: { city?: string; state?: string; lat?: number; lng?: number }
): Promise<PlaceResult | null> {
  // Build search query (use coordinates, not city names)
  const query = businessType
  
  // Log search details
  if (location.lat && location.lng) {
    console.log(`🔍 Google Places search: "${query}" near (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`)
  } else {
    console.log(`🔍 Google Places search: "${query}"`)
  }

  // Search for places (retry once on transient network error)
  let places: PlaceResult[] = []
  try {
    places = await searchPlaces(
      query,
      location.lat && location.lng ? { lat: location.lat, lng: location.lng } : undefined,
      16000
    )
  } catch (e) {
    await new Promise(r => setTimeout(r, 500))
    places = await searchPlaces(
      query,
      location.lat && location.lng ? { lat: location.lat, lng: location.lng } : undefined,
      16000
    )
  }

  if (places.length === 0) {
    console.log(`❌ No businesses found for "${query}"`)
    return null
  }

  console.log(`📊 Found ${places.length} businesses:`)
  places.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.formattedAddress} - Phone: ${p.phoneNumber || 'N/A'}`)
  })

  // Use Google Places results as-is (already sorted by relevance + distance from coordinates)
  console.log(`📍 Showing results by distance from your location:`)
  places.forEach((p, i) => {
    console.log(`  ${i + 1}. 📍 ${p.name} - ${p.formattedAddress}`)
  })

  // Prefer businesses with phone numbers
  const placesWithPhone = places.filter(p => p.phoneNumber)
  const searchPool = placesWithPhone.length > 0 ? placesWithPhone : places

  // Return highest rated business that's open
  const openBusinesses = searchPool.filter(p => p.businessStatus === 'OPERATIONAL')
  if (openBusinesses.length > 0) {
    const best = openBusinesses.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
    console.log(`✅ Selected: ${best.name} - ${best.formattedAddress}`)
    return best
  }

  console.log(`✅ Selected: ${searchPool[0].name} - ${searchPool[0].formattedAddress}`)
  return searchPool[0]
}

