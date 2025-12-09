'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  colorId?: string
  htmlLink: string
}

export function useCalendarEvents(days: number = 7) {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchEvents = async () => {
    let token = session?.provider_token
    
    // If no provider_token in session, try fetching from user_settings
    if (!token && session?.user?.id) {
      console.log('📅 Fetching token from user_settings...')
      const { data: settings } = await supabase
        .from('user_settings')
        .select('google_access_token')
        .eq('user_id', session.user.id)
        .single()
      
      token = settings?.google_access_token || null
    }
    
    console.log('📅 useCalendarEvents - fetchEvents called', {
      hasSession: !!session,
      hasProviderToken: !!token,
      userEmail: session?.user?.email,
    })

    if (!session || !token) {
      console.log('📅 useCalendarEvents - Skipping fetch (no provider token)')
      setEvents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Calculate time range
      const timeMin = new Date()
      const timeMax = new Date()
      timeMax.setDate(timeMax.getDate() + days)

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin.toISOString()}&` +
        `timeMax=${timeMax.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`

      console.log(`📅 useCalendarEvents - Fetching events for next ${days} days from Google Calendar API`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to fetch events (${response.status})`)
      }

      const data = await response.json()
      const fetchedEvents = data.items || []

      console.log('📅 useCalendarEvents - Response:', {
        ok: response.ok,
        status: response.status,
        eventCount: fetchedEvents.length,
        firstEvent: fetchedEvents[0]?.summary
      })

      setEvents(fetchedEvents)
      console.log(`✅ useCalendarEvents - Successfully set ${fetchedEvents.length} events`)
    } catch (err: any) {
      console.error('❌ useCalendarEvents - Error:', err.message)
      setError(err.message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.provider_token) {
      fetchEvents()

      // Refresh every 15 minutes
      const interval = setInterval(fetchEvents, 15 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [session, days])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    // Check if user has an active session and has granted calendar permissions
    // Provider token might be null initially but get populated after OAuth
    isAuthenticated: !!session?.user && (!!session?.provider_token || events.length > 0),
  }
}

