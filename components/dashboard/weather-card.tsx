'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WeatherData {
  current: {
    temp: number
    feels_like: number
    humidity: number
    weather: {
      main: string
      description: string
      icon: string
    }[]
  }
  daily: {
    dt: number
    temp: {
      day: number
      min: number
      max: number
    }
    weather: {
      main: string
      description: string
      icon: string
    }[]
  }[]
}

const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear':
      return <Sun className="w-6 h-6 text-yellow-500" />
    case 'clouds':
      return <Cloud className="w-6 h-6 text-gray-400" />
    case 'rain':
      return <CloudRain className="w-6 h-6 text-blue-500" />
    case 'snow':
      return <CloudSnow className="w-6 h-6 text-blue-200" />
    default:
      return <Wind className="w-6 h-6 text-gray-400" />
  }
}

const getDayName = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        // Get user's location
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported')
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            // OpenWeatherMap API - You'll need to add NEXT_PUBLIC_OPENWEATHER_API_KEY to env
            const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'
            
            // Using One Call API 3.0 for weekly forecast
            const response = await fetch(
              `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,hourly,alerts&appid=${apiKey}`
            )

            if (!response.ok) {
              // Fallback to mock data if API fails
              throw new Error('Weather API failed')
            }

            const data = await response.json()
            setWeather(data)
            setError(null)
          },
          (error) => {
            console.error('Geolocation error:', error)
            setError('Location access denied')
            // Use mock data for demo
            setWeather({
              current: {
                temp: 72,
                feels_like: 70,
                humidity: 65,
                weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
              },
              daily: [
                { dt: Date.now() / 1000, temp: { day: 72, min: 65, max: 78 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
                { dt: Date.now() / 1000 + 86400, temp: { day: 75, min: 68, max: 80 }, weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }] },
                { dt: Date.now() / 1000 + 172800, temp: { day: 70, min: 63, max: 75 }, weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }] },
                { dt: Date.now() / 1000 + 259200, temp: { day: 68, min: 60, max: 73 }, weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }] },
                { dt: Date.now() / 1000 + 345600, temp: { day: 73, min: 66, max: 79 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
                { dt: Date.now() / 1000 + 432000, temp: { day: 76, min: 69, max: 82 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
                { dt: Date.now() / 1000 + 518400, temp: { day: 74, min: 67, max: 80 }, weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }] }
              ]
            })
          }
        )
      } catch (err) {
        console.error('Weather fetch error:', err)
        setError('Using demo data')
        // Mock data for demo
        setWeather({
          current: {
            temp: 72,
            feels_like: 70,
            humidity: 65,
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
          },
          daily: [
            { dt: Date.now() / 1000, temp: { day: 72, min: 65, max: 78 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
            { dt: Date.now() / 1000 + 86400, temp: { day: 75, min: 68, max: 80 }, weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }] },
            { dt: Date.now() / 1000 + 172800, temp: { day: 70, min: 63, max: 75 }, weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }] },
            { dt: Date.now() / 1000 + 259200, temp: { day: 68, min: 60, max: 73 }, weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }] },
            { dt: Date.now() / 1000 + 345600, temp: { day: 73, min: 66, max: 79 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
            { dt: Date.now() / 1000 + 432000, temp: { day: 76, min: 69, max: 82 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
            { dt: Date.now() / 1000 + 518400, temp: { day: 74, min: 67, max: 80 }, weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }] }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  if (loading) {
    return (
      <Card className="border-2 border-sky-200 dark:border-sky-900 hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-sky-500" />
            <span className="text-lg">Weather</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-sky-200 dark:border-sky-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-sky-500" />
          <span className="text-lg">Weather Forecast</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weather && (
          <div className="space-y-4">
            {/* Current Weather */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 rounded-lg">
              <div>
                <div className="text-3xl font-bold text-sky-700 dark:text-sky-300">
                  {Math.round(weather.current.temp)}°F
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {weather.current.weather[0].description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                  <Droplets className="w-3 h-3" />
                  {weather.current.humidity}%
                </div>
              </div>
              <div>
                {getWeatherIcon(weather.current.weather[0].main)}
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="grid grid-cols-7 gap-1">
              {weather.daily.slice(0, 7).map((day, idx) => (
                <div
                  key={idx}
                  className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {idx === 0 ? 'Today' : getDayName(day.dt)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(day.weather[0].main)}
                  </div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {Math.round(day.temp.max)}°
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(day.temp.min)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



