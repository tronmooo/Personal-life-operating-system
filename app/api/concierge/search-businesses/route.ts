import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { businessSearch } from '@/lib/services/business-search'

interface BusinessResult {
  id: string
  placeId: string
  name: string
  phone?: string
  formattedPhone?: string
  address: string
  rating?: number
  distance?: number
  coordinates?: {
    latitude: number
    longitude: number
  }
}

/**
 * POST /api/concierge/search-businesses
 * 
 * Searches for nearby businesses WITHOUT initiating calls
 * Returns a list for user to select from before calling
 */
export async function POST(request: NextRequest) {
  try {
    const { intent, userLocation, locationAddress, specificBusiness, maxResults = 5 } = await request.json()

    console.log('🔍 Searching businesses for:', { intent, specificBusiness, locationAddress })

    // Google Places is required for real business search
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!googleApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Places API is not configured. Set GOOGLE_PLACES_API_KEY (and enable billing + Places + Geocoding APIs).',
          needsConfig: true,
        },
        { status: 500 }
      )
    }

    // Allow either an intent ("pizza") or a specific business ("Pizza Hut")
    const resolvedIntent = intent || specificBusiness
    if (!resolvedIntent) {
      return NextResponse.json({ success: false, error: 'Intent required' }, { status: 400 })
    }

    // Get user (optional - for future use with personalization)
    const supabase = await createServerClient()
    const { data: { user: _user } } = await supabase.auth.getUser()

    // Resolve location - prioritize user-provided location
    const location = await resolveUserLocation(userLocation, locationAddress)
    
    console.log('📍 Resolved Location:', { 
      source: locationAddress ? 'Manual Address' : userLocation ? 'Browser GPS' : 'Default',
      inputAddress: locationAddress, 
      resolved: location 
    })

    if (!location) {
      return NextResponse.json({
        success: false,
        error: locationAddress
          ? 'Could not locate that address. Please enter a full address including city and state (e.g. "123 Main St, City, ST").'
          : 'Location required. Please enable location access or enter your address manually.',
        needsLocation: true
      }, { status: 400 })
    }

    // Build search query
    const searchQuery = specificBusiness ? `${specificBusiness}` : resolvedIntent

    // Search for businesses - sorted by distance (closest first)
    const businesses = await businessSearch.searchBusinesses(searchQuery, {
      latitude: location.latitude,
      longitude: location.longitude
    }, {
      maxResults: maxResults,
      radius: 15 // 15 miles radius
    })

    if (businesses.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No ${specificBusiness || intent} businesses found near your location. Try expanding your search or check your location settings.`,
        businesses: []
      })
    }

    // Enrich with phone numbers - REQUIRED for calling
    const enrichedBusinesses: BusinessResult[] = []
    const businessesWithoutPhone: string[] = []
    
    // Fetch phone numbers in parallel for better performance
    const enrichmentPromises = businesses.map(async (biz) => {
      let phone = biz.formattedPhone || biz.phone

      // Get details if no phone (call Place Details API)
      if (!phone && biz.placeId) {
        console.log(`📞 Fetching phone for ${biz.name} (placeId: ${biz.placeId})`)
        try {
          const details = await businessSearch.getBusinessDetails(biz.placeId)
          phone = details?.formattedPhone || details?.phone
          console.log(`📞 Got phone for ${biz.name}: ${phone || 'NOT FOUND'}`)
        } catch (e: any) {
          console.warn(`❌ Failed to get details for ${biz.name}:`, e.message)
        }
      }

      return {
        business: {
          id: biz.id || biz.placeId,
          placeId: biz.placeId,
          name: biz.name,
          phone: phone,
          formattedPhone: phone,
          address: biz.address,
          rating: biz.rating,
          distance: biz.distance,
          coordinates: biz.coordinates
        },
        hasPhone: !!phone
      }
    })

    const results = await Promise.all(enrichmentPromises)
    
    // Separate businesses with and without phone numbers
    for (const result of results) {
      if (result.hasPhone) {
        enrichedBusinesses.push(result.business)
      } else {
        businessesWithoutPhone.push(result.business.name)
      }
    }

    // Sort by distance (should already be sorted, but ensure)
    enrichedBusinesses.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return 0
    })

    console.log(`✅ Found ${enrichedBusinesses.length} callable businesses (${businessesWithoutPhone.length} without phone):`)
    enrichedBusinesses.forEach((b, i) => {
      const distStr = b.distance ? `${b.distance.toFixed(2)} mi` : 'unknown'
      console.log(`  ${i + 1}. ${b.name} - ${distStr} - ${b.phone} - ${b.address}`)
    })
    
    if (businessesWithoutPhone.length > 0) {
      console.log(`⚠️ Businesses without phone numbers (excluded): ${businessesWithoutPhone.join(', ')}`)
    }

    // If no businesses have phone numbers, return helpful error
    if (enrichedBusinesses.length === 0 && businessesWithoutPhone.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Found ${businessesWithoutPhone.length} ${specificBusiness || intent} location(s) but none have phone numbers available in Google. Try a different search term or business.`,
        businesses: [],
        businessesWithoutPhone
      })
    }

    return NextResponse.json({
      success: true,
      businesses: enrichedBusinesses,
      userLocation: location,
      searchQuery,
      totalFound: enrichedBusinesses.length,
      businessesWithoutPhone: businessesWithoutPhone.length > 0 ? businessesWithoutPhone : undefined
    })

  } catch (error: unknown) {
    console.error('Business search error:', error)
    const message = error instanceof Error ? error.message : 'Failed to search for businesses'

    // Convert common Google Places misconfig into actionable 400s (instead of opaque 500s)
    // Example: "REQUEST_DENIED - The provided API key is invalid."
    const lower = message.toLowerCase()
    const looksLikeGoogleConfig =
      lower.includes('google places api key not configured') ||
      lower.includes('google places api error: request_denied') ||
      lower.includes('api key is invalid') ||
      lower.includes('billing') ||
      lower.includes('request_denied')

    if (looksLikeGoogleConfig) {
      return NextResponse.json({
        success: false,
        error: message,
        needsGooglePlaces: true,
        help: 'Set GOOGLE_PLACES_API_KEY (or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) to a valid key with Places API + Geocoding API enabled and billing on.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 })
  }
}

/**
 * Resolve user location from various sources
 */
async function resolveUserLocation(
  providedLocation?: { lat?: number; lng?: number; latitude?: number; longitude?: number },
  address?: string
) {
  // 1. Try geocoding the manual address first (highest priority)
  if (address && address.trim()) {
    try {
      const geocoded = await businessSearch.geocode(address)
      if (geocoded) {
        console.log(`📍 Geocoded address "${address}" to:`, geocoded)
        return geocoded
      }
    } catch (e) {
      console.warn('Geocoding failed for address:', address, e)
    }
  }

  // 2. Use provided GPS coordinates
  if (providedLocation) {
    const lat = providedLocation.latitude || providedLocation.lat
    const lng = providedLocation.longitude || providedLocation.lng
    
    if (lat && lng) {
      return {
        latitude: lat,
        longitude: lng
      }
    }
  }

  // 3. No location available - DON'T use a default
  // This forces the user to provide their location for accurate results
  return null
}

