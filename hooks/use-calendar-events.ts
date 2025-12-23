'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

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

/**
 * Hook to fetch Google Calendar events using the server-side API
 * This uses proper token refresh via the /api/calendar/events endpoint
 */
export function useCalendarEvents(days: number = 7) {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsAuthenticated(!!session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchEvents = useCallback(async () => {
    if (!session?.user) {
      console.log('📅 useCalendarEvents - No session, skipping fetch')
      setEvents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`📅 useCalendarEvents - Fetching events for next ${days} days via API`)

      // Use the server-side API which has proper token refresh
      const response = await fetch(`/api/calendar/events?days=${days}`, {
        credentials: 'include',
      })

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server error - please try again')
      }

      const data = await response.json()

      if (!response.ok) {
        // Check if re-authentication is needed
        if (data.requiresAuth || response.status === 401) {
          console.log('📅 useCalendarEvents - Auth required, user needs to re-authenticate')
          setError('Please sign in with Google to view calendar events')
          setIsAuthenticated(false)
          setEvents([])
          return
        }
        throw new Error(data.error || `Failed to fetch events (${response.status})`)
      }

      const fetchedEvents = data.events || []

      console.log('📅 useCalendarEvents - Response:', {
        ok: response.ok,
        eventCount: fetchedEvents.length,
        firstEvent: fetchedEvents[0]?.summary
      })

      setEvents(fetchedEvents)
      setIsAuthenticated(true)
      console.log(`✅ useCalendarEvents - Successfully set ${fetchedEvents.length} events`)
    } catch (err: any) {
      console.error('❌ useCalendarEvents - Error:', err.message)
      setError(err.message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [session, days])

  useEffect(() => {
    if (session?.user) {
      fetchEvents()

      // Refresh every 15 minutes
      const interval = setInterval(fetchEvents, 15 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [session, fetchEvents])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    isAuthenticated,
  }
}

