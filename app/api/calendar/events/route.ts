/**
 * Google Calendar Events API
 * 
 * GET /api/calendar/events - Fetch upcoming calendar events
 * 
 * Query params:
 * - days: Number of days to fetch (default: 30)
 * - maxResults: Maximum events to return (default: 100)
 * 
 * Features:
 * - Auto-refreshes expired tokens
 * - Returns events sorted by start time
 * - Handles all-day and timed events
 * - Includes timezone information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'

export const dynamic = 'force-dynamic'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status: string
  htmlLink: string
  colorId?: string
  creator?: {
    email: string
    displayName?: string
  }
  organizer?: {
    email: string
    displayName?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📅 [CALENDAR API] Request started at', new Date().toISOString())

  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const maxResults = parseInt(searchParams.get('maxResults') || '100', 10)

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('📅 [CALENDAR API] Authentication error:', authError?.message)
      return NextResponse.json(
        { error: 'Not authenticated', hint: 'Please sign in with Google' },
        { status: 401 }
      )
    }

    console.log('📅 [CALENDAR API] User authenticated:', user.email)

    // Get Google tokens
    let accessToken: string | null = null
    let refreshToken: string | null = null

    // First, try to get from session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      accessToken = session.provider_token
      refreshToken = session.provider_refresh_token || null
      console.log('📅 [CALENDAR API] Got token from session')
    }

    // If no session token, try user_settings
    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .select('google_access_token, google_refresh_token')
          .eq('user_id', user.id)
          .single()

        if (!settingsError && settings?.google_access_token) {
          accessToken = settings.google_access_token
          refreshToken = settings.google_refresh_token || null
          console.log('📅 [CALENDAR API] Got token from user_settings')
        }
      }
    }

    if (!accessToken) {
      console.error('📅 [CALENDAR API] No Google access token found')
      return NextResponse.json({
        error: 'No Google access token',
        hint: 'Sign out and sign back in with Google to grant Calendar permissions',
        requiresReauth: true,
      }, { status: 401 })
    }

    // Validate and refresh token if needed
    const tokenResult = await getValidGoogleToken(user.id, accessToken, refreshToken)

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('📅 [CALENDAR API] Token validation failed:', errorResult.error)
      
      if (errorResult.requiresReauth) {
        return NextResponse.json({
          error: 'Calendar access expired',
          hint: 'Please sign out and sign back in with Google',
          requiresAuth: true,
        }, { status: 401 })
      }
      
      return NextResponse.json({ error: errorResult.error }, { status: 500 })
    }

    const validToken = tokenResult.accessToken
    console.log('📅 [CALENDAR API] Token valid, expires in', tokenResult.expiresIn, 'seconds')

    // Calculate time range
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + days)

    console.log('📅 [CALENDAR API] Fetching events from', timeMin.toISOString(), 'to', timeMax.toISOString())

    // Fetch events from Google Calendar
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    calendarUrl.searchParams.set('timeMin', timeMin.toISOString())
    calendarUrl.searchParams.set('timeMax', timeMax.toISOString())
    calendarUrl.searchParams.set('singleEvents', 'true')
    calendarUrl.searchParams.set('orderBy', 'startTime')
    calendarUrl.searchParams.set('maxResults', maxResults.toString())
    calendarUrl.searchParams.set('fields', 
      'items(id,summary,description,location,start,end,status,htmlLink,colorId,creator,organizer,attendees)'
    )

    const response = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('📅 [CALENDAR API] Google API error:', {
        status: response.status,
        error: errorData.error?.message,
        code: errorData.error?.code,
      })

      // Check for scope issues
      if (response.status === 403) {
        return NextResponse.json({
          error: 'Calendar permission denied',
          hint: 'Please sign out and sign back in to grant Calendar permissions',
          googleError: errorData.error?.message,
          requiresReauth: true,
        }, { status: 403 })
      }

      return NextResponse.json({
        error: 'Failed to fetch calendar events',
        googleError: errorData.error?.message,
      }, { status: response.status })
    }

    const data = await response.json()
    const events: CalendarEvent[] = data.items || []

    const duration = Date.now() - startTime
    console.log(`📅 [CALENDAR API] Successfully fetched ${events.length} events in ${duration}ms`)

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      timeRange: {
        start: timeMin.toISOString(),
        end: timeMax.toISOString(),
        days,
      },
      fetchedAt: new Date().toISOString(),
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('📅 [CALENDAR API] Unexpected error after', duration, 'ms:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch calendar events',
    }, { status: 500 })
  }
}

