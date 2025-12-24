'use client'

import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CollapsibleDashboardCard } from './collapsible-dashboard-card'

interface WeatherData {
  current_weather: {
    temperature: number
    weathercode: number
    windspeed: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
  }
  hourly: {
    relativehumidity_2m: number[]
  }
}

const getWeatherIcon = (code: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  // WMO Weather interpretation codes
  if (code === 0) return <Sun className={`${sizeClass} text-yellow-500`} />
  if (code >= 1 && code <= 3) return <Cloud className={`${sizeClass} text-gray-400`} />
  if (code >= 51 && code <= 67) return <CloudRain className={`${sizeClass} text-blue-500`} />
  if (code >= 71 && code <= 77) return <CloudSnow className={`${sizeClass} text-blue-200`} />
  return <Wind className={`${sizeClass} text-gray-400`} />
}

const getWeatherDescription = (code: number) => {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 75) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

const getDayName = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function WeatherFreeCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<string>('Your Location')
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords
                
                // Open-Meteo API - Completely FREE, no API key needed!
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=relativehumidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`
                )

                if (response.ok) {
                  const data = await response.json()
                  setWeather(data)
                  
                  // Get location name
                  try {
                    const geoResponse = await fetch(
                      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    )
                    if (geoResponse.ok) {
                      const geoData = await geoResponse.json()
                      setLocation(geoData.city || geoData.locality || 'Your Location')
                    }
                  } catch (err) {
                    console.log('Location name fetch failed:', err)
                  }
                }
              } catch (err) {
                console.error('Weather fetch error with location:', err)
              } finally {
                setLoading(false)
              }
            },
            async (error) => {
              console.error('Location access denied:', error.message, error.code)
              setLocationDenied(true)
              setLoading(false)
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000
            }
          )
        } else {
          // No geolocation support
          console.error('Geolocation not supported by browser')
          setLocationDenied(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('Weather fetch error:', err)
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const requestLocation = () => {
    setLocationDenied(false)
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=relativehumidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`
            )
            if (response.ok) {
              const data = await response.json()
              setWeather(data)
              try {
                const geoResponse = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                )
                if (geoResponse.ok) {
                  const geoData = await geoResponse.json()
                  setLocation(geoData.city || geoData.locality || 'Your Location')
                }
              } catch (err) {
                console.log('Location name fetch failed:', err)
                setLocation('Your Location')
              }
            }
          } catch (err) {
            console.error('Weather fetch error:', err)
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          console.error('Location denied again:', error.message, error.code)
          setLocationDenied(true)
          setLoading(false)
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    }
  }

  // Loading state
  if (loading) {
    return (
      <CollapsibleDashboardCard
        id="weather"
        title="Weather"
        icon={<Sun className="w-5 h-5 text-sky-500" />}
        borderColor="border-sky-200 dark:border-sky-900"
        defaultOpen={true}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
        </div>
      </CollapsibleDashboardCard>
    )
  }

  // Location denied state
  if (locationDenied) {
    return (
      <CollapsibleDashboardCard
        id="weather"
        title="Weather"
        icon={<Sun className="w-5 h-5 text-sky-500" />}
        borderColor="border-sky-200 dark:border-sky-900"
        defaultOpen={true}
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-center">
            <Wind className="w-16 h-16 mx-auto text-sky-300 dark:text-sky-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Location Access Needed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please allow location access to see your local weather forecast
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Sun className="w-4 h-4" />
            Enable Weather
          </button>
          <p className="text-xs text-gray-500 text-center">
            Click your browser's location icon 🎯 in the address bar<br />
            and select "Allow" to enable weather
          </p>
        </div>
      </CollapsibleDashboardCard>
    )
  }

  return (
    <CollapsibleDashboardCard
      id="weather"
      title={location}
      icon={<Sun className="w-5 h-5 text-sky-500" />}
      borderColor="border-sky-200 dark:border-sky-900"
      defaultOpen={true}
    >
      {weather && (
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 rounded-lg">
            <div>
              <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
                {Math.round(weather.current_weather.temperature)}°F
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {getWeatherDescription(weather.current_weather.weathercode)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                <Droplets className="w-3 h-3" />
                {weather.hourly.relativehumidity_2m[0]}%
              </div>
            </div>
            <div>
              {getWeatherIcon(weather.current_weather.weathercode, 'lg')}
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="grid grid-cols-7 gap-1">
            {weather.daily.time.slice(0, 7).map((date, idx) => (
              <div
                key={idx}
                className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors"
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {idx === 0 ? 'Today' : getDayName(date)}
                </div>
                <div className="flex justify-center mb-1">
                  {getWeatherIcon(weather.daily.weathercode[idx], 'sm')}
                </div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(weather.daily.temperature_2m_max[idx])}°
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {Math.round(weather.daily.temperature_2m_min[idx])}°
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-center text-gray-500">
            Powered by Open-Meteo (Free!)
          </div>
        </div>
      )}
    </CollapsibleDashboardCard>
  )
}
