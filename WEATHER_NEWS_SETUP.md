# Weather & News Widget Setup Guide

## Overview
Two new cards have been added to the Command Center:
1. **Weather Widget** - 7-day forecast with current conditions
2. **Breaking News** - Latest headlines from around the world

Both cards work with demo/fallback data by default, but you can enable live data by adding API keys.

---

## Weather Widget Setup

### Provider: OpenWeatherMap
- **Free Tier**: 1,000 calls/day, 7-day forecast
- **Sign up**: https://openweathermap.org/api

### Setup Steps:
1. Create account at https://openweathermap.org/users/sign_up
2. Navigate to API Keys section
3. Copy your API key
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

### Features:
- ✅ Auto-detects user location via browser geolocation
- ✅ Shows current temperature, humidity, and conditions
- ✅ 7-day forecast with high/low temperatures
- ✅ Weather icons (sun, clouds, rain, snow)
- ✅ Fallback to demo data if API fails or location denied

---

## Breaking News Widget Setup

### Provider: NewsAPI.org
- **Free Tier**: 100 requests/day, top headlines
- **Sign up**: https://newsapi.org/register

### Setup Steps:
1. Create account at https://newsapi.org/register
2. Get your API key from the dashboard
3. Add to `.env.local`:

```bash
NEXT_PUBLIC_NEWS_API_KEY=your_api_key_here
```

### Features:
- ✅ Top 4 breaking news headlines (US general news)
- ✅ Source attribution and time stamps
- ✅ Click to read full article (opens in new tab)
- ✅ Live badge indicator
- ✅ Fallback to demo data if API fails

---

## Alternative Free APIs

### Weather Alternatives:
1. **WeatherAPI.com** - 1M calls/month free
2. **OpenMeteo** - Completely free, no API key needed
3. **WeatherBit** - 500 calls/day free

### News Alternatives:
1. **NewsData.io** - 200 requests/day free
2. **Currents API** - 600 requests/day free
3. **GNews** - 100 requests/day free

---

## Environment Variables Template

Add these to your `.env.local` file:

```bash
# Weather API (OpenWeatherMap)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key

# News API (NewsAPI.org)
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key
```

---

## Demo Mode

Both widgets work WITHOUT API keys:
- **Weather**: Shows mock forecast data with realistic temperatures
- **News**: Shows sample headlines with working UI

This allows you to:
- Test the UI immediately
- See how the cards look and function
- Decide if you want to add API keys later

---

## Customization

### Weather Widget (`components/dashboard/weather-card.tsx`)
- Change temperature units: Line 79 `units=imperial` → `units=metric`
- Change location: Replace geolocation with static coordinates
- Adjust forecast days: Line 205 `slice(0, 7)` → `slice(0, 5)` for 5-day

### News Widget (`components/dashboard/news-card.tsx`)
- Change category: Line 37 `category=general` → `category=technology|business|sports`
- Change country: Line 37 `country=us` → `country=gb|ca|au`
- Adjust article count: Line 112 `slice(0, 4)` → `slice(0, 6)`

---

## Troubleshooting

### Weather not loading?
1. Check browser console for errors
2. Allow location access when prompted
3. Verify API key is correct in `.env.local`
4. Restart dev server after adding env vars

### News not loading?
1. Check if you've exceeded free tier limits (100 req/day)
2. Verify API key is active
3. Try different category or country code
4. Check NewsAPI.org dashboard for usage stats

### Neither working?
- Both widgets fallback to demo data automatically
- Check Network tab in DevTools for API responses
- Ensure `.env.local` variables start with `NEXT_PUBLIC_`

---

## Cost Considerations

Both services are **FREE** for personal use:
- **OpenWeatherMap**: 1,000 calls/day = ~30,000/month
- **NewsAPI.org**: 100 calls/day = ~3,000/month

With caching and reasonable refresh rates, you'll never hit these limits.

---

## Next Steps

1. Add API keys to `.env.local`
2. Restart your dev server: `npm run dev`
3. Navigate to Command Center: http://localhost:3000/command-center
4. Grant location access when prompted (for weather)
5. Enjoy live weather and news updates!

---

## Visual Layout

The Command Center grid now includes:

```
┌─────────────────┬─────────────────┐
│ Smart Inbox     │ Critical Alerts │
├─────────────────┼─────────────────┤
│ Tasks           │ Habits          │
├─────────────────┼─────────────────┤
│ Google Calendar │ Special Dates   │
├─────────────────┼─────────────────┤
│ Weekly Insights │ Weather 🌤️      │
├─────────────────┼─────────────────┤
│ Breaking News📰 │ [Empty]         │
└─────────────────┴─────────────────┘
```

Weather and News now fill the empty spaces! 🎉



