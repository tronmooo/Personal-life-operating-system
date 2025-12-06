'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { MapPin, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

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

  useEffect(() => {
    setIsClient(true)
    checkPermission()
  }, [])

  const checkPermission = async () => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        setPermissionState(result.state)
      } catch (err) {
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
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        }

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
      },
      (err) => {
        setLoading(false)
        let errorMsg = ''
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permission denied. Click the location icon in your browser address bar.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Position unavailable. Try again.'
            break
          case err.TIMEOUT:
            errorMsg = 'Request timed out.'
            break
          default:
            errorMsg = `Error: ${err.message}`
        }
        setError(errorMsg)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  if (!isClient) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-900 p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <MapPin className="w-6 h-6 text-blue-500" />
          Location Detection Diagnostics
        </h1>

        {/* Permission Status */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {permissionState === 'granted' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {permissionState === 'denied' && <XCircle className="w-5 h-5 text-red-500" />}
            {permissionState === 'prompt' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            Permission Status: <span className="text-blue-600">{permissionState}</span>
          </h3>
        </div>

        {/* Browser Info */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Browser Information</h3>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>Geolocation API: {typeof navigator !== 'undefined' && navigator.geolocation ? 'Supported' : 'Not Supported'}</li>
            <li>Secure Context: {typeof window !== 'undefined' && window.isSecureContext ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {loading ? 'Detecting...' : 'Detect Location'}
          </button>
          <button
            onClick={checkPermission}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Check Permission
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Location Detected!</h4>
                <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <p>Latitude: {location.latitude.toFixed(6)}</p>
                  <p>Longitude: {location.longitude.toFixed(6)}</p>
                  <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
                  {location.city && <p>City: {location.city}</p>}
                  {location.state && <p>State: {location.state}</p>}
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
