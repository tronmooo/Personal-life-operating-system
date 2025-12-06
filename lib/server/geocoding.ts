import { cache } from 'react'

interface GeocodeAddressInput {
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  formattedAddress?: string | null
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

const GEOCODING_API_KEY =
  process.env.GOOGLE_GEOCODING_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

/**
 * Geocode an address string using the Google Maps Geocoding API.
 * The result returns latitude/longitude and normalized address components.
 */
export const geocodeAddress = cache(async (input: GeocodeAddressInput): Promise<GeocodeResult | null> => {
  try {
    if (!GEOCODING_API_KEY) {
      console.warn('⚠️ Google Geocoding API key not configured')
      return null
    }

    const fullAddress =
      input.formattedAddress ||
      [input.address, input.city, input.state, input.zipCode]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(', ')

    if (!fullAddress) {
      console.warn('⚠️ Cannot geocode because no address parts were provided')
      return null
    }

    const encodedAddress = encodeURIComponent(fullAddress)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GEOCODING_API_KEY}`

    const response = await fetch(geocodeUrl)
    if (!response.ok) {
      console.error('❌ Geocoding HTTP error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    if (data.status !== 'OK' || !data.results?.length) {
      console.error('❌ Geocoding error:', data.status, data.error_message)
      return null
    }

    const result = data.results[0]
    const components: Record<string, string> = {}

    if (result.address_components) {
      for (const component of result.address_components) {
        if (!component.types?.length) continue
        components[component.types[0]] = component.long_name
      }
    }

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      address: result.formatted_address || fullAddress,
      city:
        components.locality ||
        components.postal_town ||
        components.administrative_area_level_2 ||
        input.city ||
        undefined,
      state: components.administrative_area_level_1 || input.state || undefined,
      zipCode: components.postal_code || input.zipCode || undefined
    }
  } catch (error) {
    console.error('❌ Exception while geocoding address:', error)
    return null
  }
})


