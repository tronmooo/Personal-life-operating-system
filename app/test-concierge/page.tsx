'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function TestConciergePage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [intent, setIntent] = useState('pizza')
  const [businessCount, setBusinessCount] = useState(3)

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          toast.success(`Location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        },
        (error) => {
          toast.error('Unable to get location: ' + error.message)
        }
      )
    } else {
      toast.error('Geolocation is not supported by this browser')
    }
  }

  const testConcierge = async () => {
    if (!location) {
      toast.error('Please get your location first')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/concierge/initiate-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent,
          businessCount,
          userLocation: location,
          details: {
            size: 'large',
            toppings: 'cheese'
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        toast.success(`Initiated ${data.calls?.length || 0} calls!`)
      } else {
        toast.error(data.error || 'Failed to initiate calls')
        setResults({ error: data.error })
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🤖 AI Concierge Test</CardTitle>
          <CardDescription>
            Test the real business integration - searches Google Places and calls businesses near you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Get Location */}
          <div className="space-y-2">
            <Label>Step 1: Get Your Location</Label>
            <div className="flex gap-2 items-center">
              <Button onClick={getLocation} variant="outline">
                📍 Detect My Location
              </Button>
              {location && (
                <span className="text-sm text-muted-foreground">
                  ✅ {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          {/* Step 2: Configure Search */}
          <div className="space-y-4">
            <Label>Step 2: Configure Search</Label>
            
            <div className="space-y-2">
              <Label htmlFor="intent">What are you looking for?</Label>
              <Input
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="pizza, plumber, dentist, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">How many businesses?</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={5}
                value={businessCount}
                onChange={(e) => setBusinessCount(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Step 3: Test */}
          <div className="space-y-2">
            <Label>Step 3: Search & Call</Label>
            <Button 
              onClick={testConcierge} 
              disabled={!location || loading}
              className="w-full"
              size="lg"
            >
              {loading ? '⏳ Searching & Calling...' : '🚀 Search Real Businesses & Call'}
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <Label>Results:</Label>
              
              {results.error ? (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <p className="text-red-600">❌ {results.error}</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <p className="text-green-600 font-semibold">
                        ✅ {results.message}
                      </p>
                      {results.sessionId && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Session ID: {results.sessionId}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {results.calls && results.calls.length > 0 && (
                    <div className="space-y-2">
                      {results.calls.map((call: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="pt-6">
                            <div className="space-y-1">
                              <p className="font-semibold">{idx + 1}. {call.business}</p>
                              <p className="text-sm">📞 {call.phone}</p>
                              <p className="text-sm text-muted-foreground">{call.address}</p>
                              {call.rating && (
                                <p className="text-sm">⭐ {call.rating}</p>
                              )}
                              <p className="text-sm">
                                Status: <span className={call.status === 'initiated' ? 'text-green-600' : 'text-red-600'}>
                                  {call.status}
                                </span>
                                {call.callId && ` (${call.callId})`}
                              </p>
                              {call.error && (
                                <p className="text-sm text-red-600">Error: {call.error}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                ℹ️ What This Does:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Searches Google Places for real businesses near you</li>
                <li>Finds businesses that match your intent (pizza, plumber, etc.)</li>
                <li>Initiates Twilio voice calls to each business</li>
                <li>AI agent speaks your request to each business</li>
                <li>All calls are tracked in the database</li>
              </ul>
            </CardContent>
          </Card>

          {/* Environment Status */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold mb-2">🔧 Configuration Status:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>✅ Google Places API - Real business search</p>
                <p>✅ Twilio - Voice calls</p>
                <p>✅ OpenAI - AI agent</p>
                <p>✅ Supabase - Database tracking</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}



