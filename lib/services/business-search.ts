/**
 * Business Search Service
 * Search for businesses using Google Places API with caching
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

export interface Location {
  latitude: number
  longitude: number
  city?: string
  state?: string
}

export interface Business {
  id: string
  placeId: string
  name: string
  phone?: string
  formattedPhone?: string
  address: string
  category: string
  rating?: number
  priceLevel?: number
  businessHours?: Record<string, string>
  website?: string
  distance?: number
  hasOnlinePricing?: boolean
  cachedPricing?: PricingInfo
  lastCalled?: Date
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface PricingInfo {
  averagePrice?: number
  priceRange?: {
    min: number
    max: number
  }
  currency: string
  lastUpdated: Date
  dataSource: 'call' | 'website' | 'estimated'
}

export class BusinessSearchService {
  private supabase: ReturnType<typeof createClient>
  private cacheEnabled = true
  private cacheDurationDays = 7

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Search for businesses
   */
  async searchBusinesses(
    query: string,
    location: Location,
    options: {
      radius?: number // miles
      maxResults?: number
      category?: string
      minRating?: number
    } = {}
  ): Promise<Business[]> {
    const {
      radius = 10, // Reduced to 10 miles for more relevant nearby results
      maxResults = 10,
      category,
      minRating = 3.0
    } = options

    // Check cache first
    if (this.cacheEnabled) {
      const cached = await this.searchCache(query, location, radius)
      if (cached.length > 0) {
        console.log(`✅ Found ${cached.length} businesses in cache`)
        return cached.slice(0, maxResults)
      }
    }

    // Search Google Places
    if (!googleApiKey) {
      const errorMsg = '⚠️  Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY in .env.local'
      console.error(errorMsg)
      throw new Error('Google Places API key not configured. Cannot search for businesses.')
    }

    try {
      // Note: We can't use rankby=distance AND radius together in Google Places API textsearch
      // Instead, we'll fetch results within the radius, and sort them by distance manually if needed
      // or trust Google's ranking which is usually good for "nearest X" queries
      const businesses = await this.searchGooglePlaces(
        query,
        location,
        radius,
        // Fetch more initially to allow for better sorting/filtering
        maxResults * 2 
      )

      // Calculate distance for each business (Haversine formula)
      const businessesWithDistance = businesses.map(b => {
         if (b.coordinates && location) {
            const dist = this.calculateDistance(
                location.latitude, 
                location.longitude, 
                b.coordinates.latitude, 
                b.coordinates.longitude
            )
            return { ...b, distance: dist }
         }
         return b
      })

      // Sort by distance first (CLOSEST FIRST), then by rating
      // This ensures we get the *nearest* locations that match criteria
      businessesWithDistance.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance // Ascending order = closest first
          }
          // If one has distance and other doesn't, prefer the one with distance
          if (a.distance !== undefined) return -1
          if (b.distance !== undefined) return 1
          return 0
      })

      // Log sorted results with distances for debugging
      console.log(`📍 Results sorted by distance (closest first):`)
      businessesWithDistance.slice(0, 5).forEach((b, i) => {
        const distStr = b.distance ? `${b.distance.toFixed(2)} mi` : 'unknown distance'
        console.log(`  ${i + 1}. ${b.name} - ${distStr} - ${b.address}`)
      })

      // Filter by rating (but keep distance priority)
      const filtered = businessesWithDistance.filter(b => 
        !b.rating || b.rating >= minRating
      )

      // Cache results
      await this.cacheBusinesses(filtered)

      // Return only the requested amount
      return filtered.slice(0, maxResults)

    } catch (error: any) {
      console.error('Business search error:', error)
      
      // FALLBACK: If Google API fails (e.g. REQUEST_DENIED), use mock data so user can still test calls
      if (error.message && (error.message.includes('REQUEST_DENIED') || error.message.includes('Billing'))) {
        console.warn('⚠️ Google Places API failed. Falling back to MOCK data for testing.')
        return this.getMockBusinesses(query, location)
      }

      throw error
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocode(address: string): Promise<Location | null> {
    if (!googleApiKey) {
      console.warn('Google Places API key not configured for geocoding')
      return null
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
      )
      
      const data = await response.json()
      
      if (data.status !== 'OK' || !data.results?.[0]) {
        console.warn(`Geocoding failed for address: ${address}`, data.status)
        
        // FALLBACK: If Geocoding fails, return a mock location so the flow continues
        if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
             console.warn('⚠️ Geocoding API denied. Using mock location for testing.')
             // Return a default location (e.g. San Francisco)
             return {
                latitude: 37.7749,
                longitude: -122.4194,
                city: 'San Francisco',
                state: 'CA'
             }
        }
        
        return null
      }

      const result = data.results[0]
      const { lat, lng } = result.geometry.location
      
      // Extract city and state
      let city, state
      
      result.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          city = component.long_name
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name
        }
      })

      return {
        latitude: lat,
        longitude: lng,
        city,
        state
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Get business details
   */
  async getBusinessDetails(placeId: string): Promise<Business | null> {
    // Check cache
    const { data: cached } = await this.supabase
      .from('businesses')
      .select('*')
      .eq('place_id', placeId)
      .maybeSingle() as { data: any }

    if (cached && this.isCacheFresh(cached.cached_at)) {
      return this.mapDbToBusiness(cached)
    }

    // Fetch from Google Places
    if (!googleApiKey) {
      return null
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,rating,price_level,opening_hours,website&key=${googleApiKey}`
      )

      const data = await response.json()

      if (data.status !== 'OK' || !data.result) {
        return null
      }

      const business = this.mapGooglePlaceToBusiness(data.result)
      
      // Cache it
      await this.cacheBusinessInfo(business)

      return business

    } catch (error) {
      console.error('Failed to get business details:', error)
      return null
    }
  }

  /**
   * Check if business should be called
   */
  async shouldMakeCall(business: Business, query: string): Promise<{
    shouldCall: boolean
    reason: string
  }> {
    // Check 1: Do we have recent cached pricing?
    if (business.cachedPricing) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - business.cachedPricing.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceUpdate < 3) {
        return {
          shouldCall: false,
          reason: `Recent pricing from ${daysSinceUpdate} days ago`
        }
      }
    }

    // Check 2: Was business called recently?
    if (business.lastCalled) {
      const hoursSinceCall = Math.floor(
        (Date.now() - business.lastCalled.getTime()) / (1000 * 60 * 60)
      )
      
      if (hoursSinceCall < 24) {
        return {
          shouldCall: false,
          reason: `Called ${hoursSinceCall} hours ago`
        }
      }
    }

    // Check 3: Can we scrape pricing from website?
    if (business.website && business.hasOnlinePricing) {
      return {
        shouldCall: false,
        reason: 'Pricing available on website'
      }
    }

    // Check 4: Is business open now?
    if (business.businessHours) {
      const isOpen = this.isBusinessOpen(business.businessHours)
      if (!isOpen) {
        return {
          shouldCall: false,
          reason: 'Business is currently closed'
        }
      }
    }

    // Okay to call
    return {
      shouldCall: true,
      reason: 'No recent pricing data available'
    }
  }

  /**
   * Update business pricing after call
   */
  async updateBusinessPricing(
    placeId: string,
    pricing: PricingInfo
  ): Promise<void> {
    await (this.supabase
      .from('businesses') as any)
      .update({
        pricing_data: pricing,
        last_called_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('place_id', placeId)
  }

  /**
   * Search Google Places API
   * Uses nearbysearch for location-based queries prioritized by distance
   */
  private async searchGooglePlaces(
    query: string,
    location: Location,
    radiusMiles: number,
    maxResults: number
  ): Promise<Business[]> {
    const radiusMeters = radiusMiles * 1609.34 // miles to meters
    
    console.log(`🔍 Searching for "${query}" within ${radiusMiles} miles of (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`)

    // Use nearbysearch with rankby=distance for closest results
    // Note: When using rankby=distance, we can't specify radius (per Google API rules)
    // So we'll use rankby=prominence with radius, then sort by distance ourselves
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(query)}&location=${location.latitude},${location.longitude}&radius=${radiusMeters}&key=${googleApiKey}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      console.error(`❌ Google Places API error: ${data.status}`, data.error_message)
      throw new Error(`Google Places API error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`)
    }

    console.log(`📊 Found ${data.results.length} results from Google Places API`)

    const businesses = data.results
      .slice(0, maxResults)
      .map((place: any) => this.mapGooglePlaceToBusiness(place))

    return businesses
  }

  /**
   * Map Google Place to Business
   */
  private mapGooglePlaceToBusiness(place: any): Business {
    return {
      id: place.place_id,
      placeId: place.place_id,
      name: place.name,
      phone: place.formatted_phone_number,
      formattedPhone: place.formatted_phone_number,
      address: place.formatted_address || place.vicinity,
      category: place.types?.[0] || 'general',
      rating: place.rating,
      priceLevel: place.price_level,
      website: place.website,
      businessHours: place.opening_hours?.weekday_text?.reduce((acc: any, day: string) => {
        const [dayName, hours] = day.split(': ')
        acc[dayName] = hours
        return acc
      }, {}),
      hasOnlinePricing: false, // Will be updated after checking website
      coordinates: place.geometry?.location ? {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      } : undefined
    }
  }

  /**
   * Calculate Haversine distance between two points in miles
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8 // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Search cache
   */
  private async searchCache(
    query: string,
    location: Location,
    radius: number
  ): Promise<Business[]> {
    // Calculate bounding box for location
    const latDelta = radius / 69 // Rough miles to degrees
    const lonDelta = radius / (69 * Math.cos(location.latitude * Math.PI / 180))

    const { data } = await this.supabase
      .from('businesses')
      .select('*')
      .ilike('name', `%${query}%`)
      .gte('cached_at', this.getCacheExpiry())
      .limit(20)

    if (!data || data.length === 0) {
      return []
    }

    // Filter by distance (rough approximation)
    return data
      .map(this.mapDbToBusiness)
      .filter(b => {
        // Parse address for rough location match
        // In production, store lat/lon in DB
        return true
      })
  }

  /**
   * Cache businesses
   */
  private async cacheBusinesses(businesses: Business[]): Promise<void> {
    for (const business of businesses) {
      await this.cacheBusinessInfo(business)
    }
  }

  /**
   * Cache single business
   */
  private async cacheBusinessInfo(business: Business): Promise<void> {
    await this.supabase
      .from('businesses')
      .upsert({
        place_id: business.placeId,
        name: business.name,
        phone: business.phone,
        address: business.address,
        category: business.category,
        rating: business.rating,
        price_level: business.priceLevel,
        business_hours: business.businessHours,
        website: business.website,
        pricing_data: business.cachedPricing as any,
        last_called_at: business.lastCalled?.toISOString(),
        cached_at: new Date().toISOString()
      } as any, {
        onConflict: 'place_id'
      })
  }

  /**
   * Map DB record to Business
   */
  private mapDbToBusiness(record: any): Business {
    return {
      id: record.id,
      placeId: record.place_id,
      name: record.name,
      phone: record.phone,
      formattedPhone: record.phone,
      address: record.address,
      category: record.category,
      rating: record.rating,
      priceLevel: record.price_level,
      businessHours: record.business_hours,
      website: record.website,
      cachedPricing: record.pricing_data,
      lastCalled: record.last_called_at ? new Date(record.last_called_at) : undefined,
      hasOnlinePricing: !!record.pricing_data
    }
  }

  /**
   * Check if cache is fresh
   */
  private isCacheFresh(cachedAt: string): boolean {
    const cacheDate = new Date(cachedAt)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - this.cacheDurationDays)
    return cacheDate > expiryDate
  }

  /**
   * Get cache expiry date
   */
  private getCacheExpiry(): string {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() - this.cacheDurationDays)
    return expiry.toISOString()
  }

  /**
   * Check if business is open
   */
  private isBusinessOpen(hours: Record<string, string>): boolean {
    const now = new Date()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = dayNames[now.getDay()]
    
    const todayHours = hours[today]
    if (!todayHours) return true // Assume open if no hours data
    
    if (todayHours.toLowerCase().includes('closed')) return false
    
    // Parse hours (simplified - production would need more robust parsing)
    return true
  }

  /**
   * Get mock businesses (for testing without Google API)
   */
  private getMockBusinesses(query: string, location: Location): Business[] {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('pizza')) {
      const pizzaPlaces = [
        {
          id: 'mock-1',
          placeId: 'mock-dominos',
          name: "Domino's Pizza",
          phone: '+17609462323',
          formattedPhone: '+1 (760) 946-2323',
          address: '123 Main St, Apple Valley, CA 92308',
          category: 'restaurant',
          rating: 4.2,
          priceLevel: 2
        },
        {
          id: 'mock-2',
          placeId: 'mock-pizzahut',
          name: 'Pizza Hut',
          phone: '+17609460000',
          formattedPhone: '+1 (760) 946-0000',
          address: '456 Oak Ave, Apple Valley, CA 92308',
          category: 'restaurant',
          rating: 4.0,
          priceLevel: 2
        },
        {
          id: 'mock-4',
          placeId: 'mock-papajohns',
          name: "Papa John's Pizza",
          phone: '+17609469999',
          formattedPhone: '+1 (760) 946-9999',
          address: '789 Pine St, Apple Valley, CA 92308',
          category: 'restaurant',
          rating: 3.8,
          priceLevel: 2
        }
      ]

      // Filter if specific name requested
      if (queryLower.includes('hut')) {
        return pizzaPlaces.filter(p => p.name.toLowerCase().includes('hut'))
      }
      if (queryLower.includes('domino')) {
        return pizzaPlaces.filter(p => p.name.toLowerCase().includes('domino'))
      }
      if (queryLower.includes('papa')) {
        return pizzaPlaces.filter(p => p.name.toLowerCase().includes('papa'))
      }

      return pizzaPlaces
    }

    if (queryLower.includes('oil') || queryLower.includes('mechanic')) {
      return [
        {
          id: 'mock-3',
          placeId: 'mock-jiffy',
          name: 'Jiffy Lube',
          phone: '+17605551234',
          formattedPhone: '+1 (760) 555-1234',
          address: '789 Auto Blvd, Apple Valley, CA 92308',
          category: 'car_repair',
          rating: 4.5,
          priceLevel: 2
        },
        {
          id: 'mock-5',
          placeId: 'mock-valvoline',
          name: 'Valvoline Instant Oil Change',
          phone: '+17605555678',
          formattedPhone: '+1 (760) 555-5678',
          address: '101 Speed Way, Apple Valley, CA 92308',
          category: 'car_repair',
          rating: 4.3,
          priceLevel: 2
        }
      ]
    }

    if (queryLower.includes('plumber')) {
       return [
         {
           id: 'mock-plumber-1',
           placeId: 'mock-rooter',
           name: "Roto-Rooter Plumbing & Water Cleanup",
           phone: '+17605559000',
           formattedPhone: '+1 (760) 555-9000',
           address: '555 Pipe Ln, Apple Valley, CA 92308',
           category: 'home_services',
           rating: 4.7,
           priceLevel: 3
         },
         {
           id: 'mock-plumber-2',
           placeId: 'mock-mr-rooter',
           name: "Mr. Rooter Plumbing",
           phone: '+17605559001',
           formattedPhone: '+1 (760) 555-9001',
           address: '556 Drain St, Apple Valley, CA 92308',
           category: 'home_services',
           rating: 4.5,
           priceLevel: 3
         }
       ]
    }

    if (queryLower.includes('dentist')) {
        return [
          {
            id: 'mock-dentist-1',
            placeId: 'mock-smile',
            name: "Bright Smile Dental",
            phone: '+17605552000',
            formattedPhone: '+1 (760) 555-2000',
            address: '222 Tooth Rd, Apple Valley, CA 92308',
            category: 'health',
            rating: 4.8,
            priceLevel: 3
          }
        ]
    }

    // Default generic fallback if nothing matches
    return [
       {
          id: 'mock-generic-1',
          placeId: `mock-${Date.now()}`,
          name: `${query} Shop (Mock)`,
          phone: '+17609462323',
          formattedPhone: '+1 (760) 946-2323',
          address: '123 Mock St, Apple Valley, CA 92308',
          category: 'general',
          rating: 4.0,
          priceLevel: 2
       }
    ]
  }
}

// Singleton instance
export const businessSearch = new BusinessSearchService()

