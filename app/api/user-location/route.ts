import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { geocodeAddress } from '@/lib/server/geocoding'

/**
 * GET /api/user-location
 * Retrieves the user's saved primary location
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    // Return null location for unauthenticated users (don't error)
    if (!user) {
      return NextResponse.json({ location: null })
    }

    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user location:', error)
      return NextResponse.json({ location: null })
    }

    if (!data) {
      return NextResponse.json({ location: null })
    }

    return NextResponse.json({
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        state: data.state,
        address: data.address,
        zipCode: data.zip_code
      }
    })
  } catch (error) {
    console.error('User location GET error:', error)
    return NextResponse.json({ location: null })
  }
}

/**
 * POST /api/user-location
 * Saves/updates the user's primary location
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      latitude,
      longitude,
      city,
      state,
      address,
      zipCode
    }: {
      latitude?: number | string | null
      longitude?: number | string | null
      city?: string | null
      state?: string | null
      address?: string | null
      zipCode?: string | null
    } = body

    let lat = typeof latitude === 'string' ? Number(latitude) : latitude ?? undefined
    let lng = typeof longitude === 'string' ? Number(longitude) : longitude ?? undefined
    let resolvedCity = city ?? undefined
    let resolvedState = state ?? undefined
    let resolvedAddress = address ?? undefined
    let resolvedZip = zipCode ?? undefined

    if ((!lat || !lng) && (address || city || state || zipCode)) {
      const geocoded = await geocodeAddress({
        address,
        city,
        state,
        zipCode
      })

      if (geocoded) {
        lat = geocoded.latitude
        lng = geocoded.longitude
        resolvedAddress = geocoded.address ?? resolvedAddress
        resolvedCity = geocoded.city ?? resolvedCity
        resolvedState = geocoded.state ?? resolvedState
        resolvedZip = geocoded.zipCode ?? resolvedZip
      } else {
        return NextResponse.json(
          { error: 'Could not geocode address. Please verify the entered address.' },
          { status: 400 }
        )
      }
    }

    if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required to save your location.' },
        { status: 400 }
      )
    }

    // First, set all existing locations to non-primary
    await supabase
      .from('user_locations')
      .update({ is_primary: false })
      .eq('user_id', user.id)

    // Check if user already has a primary location
    const { data: existing } = await supabase
      .from('user_locations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      // Update existing location
      const { error } = await supabase
        .from('user_locations')
        .update({
          latitude: lat,
          longitude: lng,
          city: resolvedCity || null,
          state: resolvedState || null,
          address: resolvedAddress || null,
          zip_code: resolvedZip || null,
          is_primary: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating location:', error)
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
      }
    } else {
      // Insert new location
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: user.id,
          latitude: lat,
          longitude: lng,
          city: resolvedCity || null,
          state: resolvedState || null,
          address: resolvedAddress || null,
          zip_code: resolvedZip || null,
          is_primary: true
        })

      if (error) {
        console.error('Error inserting location:', error)
        return NextResponse.json({ error: 'Failed to save location' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      location: {
        latitude: lat,
        longitude: lng,
        city: resolvedCity ?? null,
        state: resolvedState ?? null,
        address: resolvedAddress ?? null,
        zipCode: resolvedZip ?? null
      }
    })
  } catch (error) {
    console.error('User location POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

