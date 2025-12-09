'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MapPin, Search, Phone, Star, Loader2 } from 'lucide-react'

interface Place {
  place_id: string
  name: string
  formatted_phone_number?: string
  formatted_address: string
  rating?: number
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

export default function TestGooglePlacesPage() {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [keyword, setKeyword] = useState('pizza')
  const [results, setResults] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setLocation(loc)
          toast.success(`Location detected: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`)
        },
        (error) => {
          toast.error('Unable to get location: ' + error.message)
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser')
    }
  }

  const searchPlaces = async () => {
    if (!location) {
      toast.error('Please get your location first')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/google-places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          keyword,
          type: 'restaurant',
          radius: 5000 // 5km
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search places')
      }

      if (data.status === 'ZERO_RESULTS') {
        setError('No results found. Try a different keyword or location.')
        toast.info('No results found')
        return
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results)
        toast.success(`Found ${data.results.length} places!`)
      } else {
        setError('No places found with phone numbers')
        toast.warning('No places found with phone numbers')
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('Search failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-500" />
            Google Places API Test
          </CardTitle>
          <CardDescription>
            Test the Google Places API integration to search for businesses near you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Get Location */}
          <div className="space-y-2">
            <Label>Step 1: Get Your Location</Label>
            <div className="flex gap-2 items-center">
              <Button onClick={getLocation} variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Detect My Location
              </Button>
              {location && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          {/* Step 2: Search */}
          <div className="space-y-2">
            <Label htmlFor="keyword">Step 2: Search for Businesses</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="pizza, plumber, dentist, etc."
                className="flex-1"
              />
              <Button 
                onClick={searchPlaces} 
                disabled={!location || loading}
                className="gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-600">❌ {error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <Label>Results ({results.length} places found)</Label>
              <div className="grid gap-4">
                {results.map((place, idx) => (
                  <Card key={place.place_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{place.name}</h3>
                          
                          {place.formatted_phone_number && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <a 
                                href={`tel:${place.formatted_phone_number}`}
                                className="hover:underline hover:text-blue-600"
                              >
                                {place.formatted_phone_number}
                              </a>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{place.formatted_address}</span>
                          </div>
                          
                          {place.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{place.rating}</span>
                              <span className="text-gray-500">rating</span>
                            </div>
                          )}

                          <div className="text-xs text-gray-400 pt-2 border-t">
                            Place ID: {place.place_id}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h4 className="font-semibold text-blue-900 mb-2">ℹ️ What This Tests:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Google Places API configuration</li>
                <li>Nearby search functionality</li>
                <li>Place details with phone numbers</li>
                <li>Location-based queries</li>
              </ul>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">🔧 API Configuration:</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>• Endpoint: <code className="bg-slate-200 px-2 py-0.5 rounded">/api/google-places/search</code></p>
                <p>• Method: POST</p>
                <p>• Required: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</p>
                <p>• Radius: 5000m (5km)</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}





























