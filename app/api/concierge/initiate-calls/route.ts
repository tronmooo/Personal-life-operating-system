import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { businessSearch } from '@/lib/services/business-search'
import { userContextBuilder } from '@/lib/services/user-context-builder'
import { getPublicBaseUrl } from '@/lib/utils/public-url'

interface Business {
  name: string
  phone: string
  address: string
  rating?: number
  placeId?: string
}

/**
 * POST /api/concierge/initiate-calls
 * 
 * Initiates multiple phone calls to businesses
 * - Finds nearby businesses based on intent
 * - Makes parallel calls
 * - Tracks call status
 */
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { intent, businessCount, userLocation, specificBusiness, locationAddress } = requestBody
    // Default details to empty object to avoid crash in buildUserRequest
    const details = requestBody.details || {}

    console.log('📞 Initiating calls for:', { intent, locationAddress, specificBusiness })

    if (!intent) {
      return NextResponse.json({ error: 'Intent required' }, { status: 400 })
    }

    // Get user (optional - can work without auth if location provided)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine a search location
    // Priority: 1. Geocoded address 2. Lat/Long payload 3. User profile 4. Default
    const location = await resolveUserLocation(user?.id, userLocation, locationAddress)
    
    // Debug logging to trace location resolution
    console.log('📍 Resolved Location:', { 
      source: locationAddress ? 'Manual Address' : userLocation ? 'Browser GPS' : user?.id ? 'User Profile' : 'Default',
      inputAddress: locationAddress, 
      resolved: location 
    })

    // Require an explicit location for real concierge behavior (no silent defaults)
    if (!location) {
      return NextResponse.json({
        success: false,
        error: 'Location required. Please enable location access or enter your address manually.',
        needsLocation: true
      }, { status: 400 })
    }

    // Find businesses based on intent and specific business name if provided
    const businesses = await findBusinesses(intent, businessCount || 3, location, specificBusiness)

    if (businesses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No businesses found for your request'
      })
    }

    // Build user request description
    let userRequest = details?.userRequest || buildUserRequest(intent, details)
    
    // If we have a manual address, append it to the user request so the AI knows where to deliver
    if (locationAddress && !userRequest.includes(locationAddress)) {
       userRequest += ` My address is ${locationAddress}.`
    }

    // Initiate calls to all businesses
    const callPromises = businesses.map(async (business) => {
      try {
        const baseUrl = getPublicBaseUrl(request)
        const callResponse = await fetch(`${baseUrl}/api/voice/initiate-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: business.phone,
            businessName: business.name,
            userRequest,
            category: intent,
            userName: user?.email?.split('@')[0] || 'User',
            userLocation,
            userData: details
          })
        })

        const callData = await callResponse.json()

        return {
          business: business.name,
          phone: business.phone,
          address: business.address,
          rating: business.rating,
          callId: callData.callId || callData.callSid,
          status: callData.success ? 'initiated' : 'failed',
          error: callData.error,
          simulation: callData.simulation
        }
      } catch (error: any) {
        return {
          business: business.name,
          phone: business.phone,
          address: business.address,
          rating: business.rating,
          status: 'failed',
          error: error.message
        }
      }
    })

    const calls = await Promise.all(callPromises)

    // Store call session in database (only if user is authenticated)
    let session: { id: string } | null = null
    if (user?.id) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('concierge_sessions')
        .insert({
          user_id: user.id,
          intent,
          details,
          business_count: businessCount || 3,
          status: 'in_progress'
        })
        .select()
        .single()

      if (!sessionError && sessionData) {
        session = sessionData as { id: string }
        // Store individual calls
        const callRecords = calls.map(call => ({
          session_id: session!.id,
          business_name: call.business,
          business_phone: call.phone,
          call_id: call.callId,
          status: call.status,
          error: call.error
        }))

        await supabase
          .from('concierge_calls')
          .insert(callRecords)
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session?.id,
      calls,
      message: `Initiated ${calls.length} calls to ${intent} businesses`,
      unauthenticated: !user
    })

  } catch (error: any) {
    console.error('Initiate calls error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function resolveUserLocation(
  userId: string | undefined,
  providedLocation?: { lat?: number; lng?: number; latitude?: number; longitude?: number },
  address?: string
) {
  // 1. Try provided lat/long
  if (providedLocation?.lat && providedLocation?.lng) {
    return { latitude: providedLocation.lat, longitude: providedLocation.lng }
  }

  if (providedLocation?.latitude && providedLocation?.longitude) {
    return { latitude: providedLocation.latitude, longitude: providedLocation.longitude }
  }

  // 2. Try provided address string
  if (address) {
    const geocoded = await businessSearch.geocode(address)
    if (geocoded) {
      return geocoded
    }
  }

  // 3. Try stored user location
  if (!userId) {
    return undefined
  }

  const context = await userContextBuilder.buildFullContext(userId)
  if (context.location?.latitude && context.location?.longitude) {
    return {
      latitude: context.location.latitude,
      longitude: context.location.longitude
    }
  }

  return undefined
}

/**
 * Find businesses using the shared businessSearch service
 */
async function findBusinesses(
  intent: string,
  count: number,
  location: { latitude: number; longitude: number },
  specificBusiness?: string
): Promise<Business[]> {
  const searchQuery = specificBusiness 
    ? `${specificBusiness} ${intent}` 
    : intent

  const searchResults = await businessSearch.searchBusinesses(searchQuery, {
    latitude: location.latitude,
    longitude: location.longitude
  }, {
    maxResults: count,
    radius: 10 // 10 miles for truly nearby results
  })

  // Enrich businesses with phone numbers if missing
  const enrichedBusinesses: Business[] = []
  
  for (const biz of searchResults) {
    let phone = biz.formattedPhone || biz.phone

    if (!phone) {
      const details = await businessSearch.getBusinessDetails(biz.placeId)
      phone = details?.formattedPhone || details?.phone
    }

    // Only add businesses with valid phone numbers
    if (phone) {
      enrichedBusinesses.push({
        name: biz.name,
        phone: phone,
        address: biz.address,
        rating: biz.rating,
        placeId: biz.placeId
      })
    }

    // Stop once we have enough businesses
    if (enrichedBusinesses.length >= count) {
      break
    }
  }

  return enrichedBusinesses
}

/**
 * Build a user request description for the AI agent to use in the call
 */
function buildUserRequest(intent: string, details: Record<string, any>): string {
  const requests: Record<string, string> = {
    'pizza': `I'd like to order a ${details.size || 'large'} ${details.toppings || 'cheese'} pizza. ${details.budget ? `My budget is around ${details.budget}.` : ''}`,
    'plumber': `I need a plumber for ${details.issue || 'a plumbing issue'}. ${details.urgent ? 'This is urgent.' : ''}`,
    'oil_change': `I need an oil change for my ${details.vehicle || 'vehicle'}. ${details.budget ? `My budget is around ${details.budget}.` : ''}`,
    'electrician': `I need an electrician for ${details.issue || 'electrical work'}. ${details.urgent ? 'This is urgent.' : ''}`,
    'dentist': `I'd like to schedule a ${details.appointmentType || 'dental appointment'}. ${details.insurance ? `I have ${details.insurance} insurance.` : ''}`
  }

  return requests[intent] || `I'm interested in ${intent} services.`
}

