'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: Date
  city?: string
  state?: string
}

export default function TestLocationPage() {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<string>('unknown')
  const [isClient, setIsClient] = useState(false)
  
  // Use Supabase-backed preferences for clearing stored address
  const { deleteValue: clearStoredAddress } = useUserPreferences<string>('concierge_manual_address', '')

  useEffect(() => {
    setIsClient(true)
    checkPermission()
  }, [])

  const checkPermission = async () => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        setPermissionState(result.state)
        console.log('📍 Geolocation permission:', result.state)
      } catch (err) {
        console.warn('Permission API not supported:', err)
        setPermissionState('unavailable')
      }
    } else {
      setPermissionState('unavailable')
    }
  }

  const detectLocation = () => {
    setLoading(true)
    setError(null)
    setLocation(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('❌ Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    console.log('🔍 Starting location detection...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Location detected:', position)
        
        const locData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        }

        // Try to get city/state
        try {
          const geoResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locData.latitude}&longitude=${locData.longitude}&localityLanguage=en`
          )
          if (geoResponse.ok) {
            const geoData = await geoResponse.json()
            locData.city = geoData.city || geoData.locality
            locData.state = geoData.principalSubdivision
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err)
        }

        setLocation(locData)
        setLoading(false)

        // Try to save to database
        try {
          const saveResponse = await fetch('/api/user-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: locData.latitude,
              longitude: locData.longitude,
              city: locData.city,
              state: locData.state
            })
          })
          
          if (saveResponse.ok) {
            console.log('✅ Location saved to database')
          } else {
            console.warn('⚠️ Failed to save location to database')
          }
        } catch (err) {
          console.warn('⚠️ Database save error:', err)
        }
      },
      (err) => {
        console.error('❌ Location error:', err)
        setLoading(false)
        
        let errorMsg = '❌ '
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg += 'Permission denied. Click the 🎯 icon in your browser address bar and select "Allow"'
            break
          case err.POSITION_UNAVAILABLE:
            errorMsg += 'Position unavailable. Try again in a moment.'
            break
          case err.TIMEOUT:
            errorMsg += 'Request timed out. Check your connection and try again.'
            break
          default:
            errorMsg += `Error: ${err.message}`
        }
        
        setError(errorMsg)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const clearBrowserData = async () => {
    if (confirm('This will clear the saved address preference. Continue?')) {
      await clearStoredAddress()
      alert('✅ Cleared! Now try detecting location again.')
    }
  }

  if (!isClient) {
    return <div className="p-8">Loading diagnostics...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card className="border-2 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            Location Detection Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {permissionState === 'granted' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {permissionState === 'denied' && <XCircle className="w-5 h-5 text-red-500" />}
              {permissionState === 'prompt' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              Permission Status: <span className="text-blue-600 dark:text-blue-400">{permissionState}</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {permissionState === 'granted' && '✅ Location permission is granted'}
              {permissionState === 'denied' && '❌ Location permission is blocked. Click the 🎯 icon in your address bar to reset.'}
              {permissionState === 'prompt' && '⚠️ Will prompt for permission when you click "Detect Location"'}
              {permissionState === 'unknown' && 'ℹ️ Permission status unknown'}
            </p>
          </div>

          {/* Browser Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Browser Information</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>✅ Geolocation API: {navigator.geolocation ? 'Supported' : '❌ Not Supported'}</li>
              <li>✅ Secure Context (HTTPS): {typeof window !== 'undefined' && window.isSecureContext ? 'Yes' : '⚠️ No (required in production)'}</li>
              <li>✅ User Agent: {navigator.userAgent.slice(0, 80)}...</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={detectLocation} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Detect Location
                </>
              )}
            </Button>
            <Button 
              onClick={checkPermission} 
              variant="outline"
            >
              Check Permission
            </Button>
            <Button 
              onClick={clearBrowserData} 
              variant="outline"
            >
              Clear Cache
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Error</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Location Display */}
          {location && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Location Detected!</h4>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                    <p><strong>Accuracy:</strong> ±{Math.round(location.accuracy)}m</p>
                    {location.city && <p><strong>City:</strong> {location.city}</p>}
                    {location.state && <p><strong>State:</strong> {location.state}</p>}
                    <p><strong>Timestamp:</strong> {location.timestamp.toLocaleString()}</p>
                    <p className="pt-2">
                      <a 
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline"
                      >
                        📍 View on Google Maps
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Troubleshooting Tips</h4>
            <ul className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
              <li>1️⃣ <strong>Check Browser Permissions:</strong> Look for the 🎯 location icon in your address bar</li>
              <li>2️⃣ <strong>Enable Location Services:</strong> Make sure your device's location services are ON</li>
              <li>3️⃣ <strong>Use HTTPS:</strong> Location API requires secure connection (localhost is OK)</li>
              <li>4️⃣ <strong>Clear Site Data:</strong> If stuck, clear browser cache for this site</li>
              <li>5️⃣ <strong>Try Another Browser:</strong> Test in Chrome, Safari, or Firefox</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
