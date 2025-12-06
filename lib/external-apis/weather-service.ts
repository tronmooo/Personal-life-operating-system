/**
 * Weather API Integration Service
 * 
 * Provides weather data for outdoor activities and travel planning
 * Uses OpenWeatherMap API (free tier available)
 */

export interface WeatherData {
  location: string
  temperature: number
  feels_like: number
  humidity: number
  description: string
  icon: string
  wind_speed: number
  timestamp: Date
}

export interface ForecastData {
  date: string
  temp_max: number
  temp_min: number
  description: string
  icon: string
  precipitation_chance: number
}

export class WeatherService {
  private apiKey: string
  private baseURL = 'https://api.openweathermap.org/data/2.5'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(city: string): Promise<WeatherData> {
    if (!this.isConfigured()) {
      throw new Error('Weather API key not configured')
    }

    const url = `${this.baseURL}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=imperial`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      location: data.name,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      timestamp: new Date()
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getForecast(city: string): Promise<ForecastData[]> {
    if (!this.isConfigured()) {
      throw new Error('Weather API key not configured')
    }

    const url = `${this.baseURL}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=imperial`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.statusText}`)
    }

    const data = await response.json()

    // Group by date and take one forecast per day (noon)
    const dailyForecasts: { [key: string]: any } = {}
    
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyForecasts[date] && item.dt_txt.includes('12:00:00')) {
        dailyForecasts[date] = item
      }
    })

    return Object.entries(dailyForecasts).slice(0, 5).map(([date, item]: [string, any]) => ({
      date,
      temp_max: Math.round(item.main.temp_max),
      temp_min: Math.round(item.main.temp_min),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      precipitation_chance: item.pop * 100
    }))
  }

  /**
   * Get weather icon URL
   */
  getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  /**
   * Determine if weather is suitable for outdoor activity
   */
  isGoodForOutdoor(weather: WeatherData): { suitable: boolean; reason: string } {
    if (weather.temperature < 32) {
      return { suitable: false, reason: 'Too cold (below freezing)' }
    }
    if (weather.temperature > 95) {
      return { suitable: false, reason: 'Too hot (above 95°F)' }
    }
    if (weather.wind_speed > 25) {
      return { suitable: false, reason: 'Too windy (above 25 mph)' }
    }
    if (weather.description.toLowerCase().includes('rain')) {
      return { suitable: false, reason: 'Rain expected' }
    }
    if (weather.description.toLowerCase().includes('storm')) {
      return { suitable: false, reason: 'Storm conditions' }
    }

    return { suitable: true, reason: 'Good conditions' }
  }
}

// Export singleton instance
export const weatherService = new WeatherService()






