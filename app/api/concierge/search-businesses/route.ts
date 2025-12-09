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

    if (!intent) {
      return NextResponse.json({ error: 'Intent required' }, { status: 400 })
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
        error: 'Location required. Please enable location access or enter your address manually.',
        needsLocation: true
      }, { status: 400 })
    }

    // Build search query
    const searchQuery = specificBusiness 
      ? `${specificBusiness}` 
      : intent

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

    // Enrich with phone numbers if missing
    const enrichedBusinesses: BusinessResult[] = []
    
    for (const biz of businesses) {
      let phone = biz.formattedPhone || biz.phone

      // Get details if no phone
      if (!phone && biz.placeId) {
        try {
          const details = await businessSearch.getBusinessDetails(biz.placeId)
          phone = details?.formattedPhone || details?.phone
        } catch (e) {
          console.warn('Failed to get details for', biz.name)
        }
      }

      enrichedBusinesses.push({
        id: biz.id || biz.placeId,
        placeId: biz.placeId,
        name: biz.name,
        phone: phone,
        formattedPhone: phone,
        address: biz.address,
        rating: biz.rating,
        distance: biz.distance,
        coordinates: biz.coordinates
      })
    }

    // Sort by distance (should already be sorted, but ensure)
    enrichedBusinesses.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      return 0
    })

    console.log(`✅ Found ${enrichedBusinesses.length} businesses:`)
    enrichedBusinesses.forEach((b, i) => {
      const distStr = b.distance ? `${b.distance.toFixed(2)} mi` : 'unknown'
      console.log(`  ${i + 1}. ${b.name} - ${distStr} - ${b.address}`)
    })

    return NextResponse.json({
      success: true,
      businesses: enrichedBusinesses,
      userLocation: location,
      searchQuery,
      totalFound: enrichedBusinesses.length
    })

  } catch (error: unknown) {
    console.error('Business search error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search for businesses'
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

