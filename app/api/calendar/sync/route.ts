import { NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'
import { GoogleCalendarSync } from '@/lib/integrations/google-calendar-sync'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const looksLikePlaceholder = (value?: string) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return lower.includes('your-project-id') || lower.includes('placeholder') || lower.includes('dummy')
}

let cachedSupabase: SupabaseClient<any, 'public', any> | null | undefined

const getSupabaseClient = (): SupabaseClient<any, 'public', any> | null => {
  if (cachedSupabase !== undefined) {
    return cachedSupabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseAnonKey)) {
    console.warn('Calendar sync API: Supabase credentials missing or invalid.')
    cachedSupabase = null
    return null
  }

  cachedSupabase = createClient(supabaseUrl, supabaseAnonKey)
  return cachedSupabase
}

/**
 * POST /api/calendar/sync
 * Sync domain data to Google Calendar
 * Automatically refreshes expired tokens - no re-auth popups!
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      )
    }

    // Get Google tokens from Supabase user_settings
    const tokens = await getGoogleTokens()

    if (!tokens) {
      return NextResponse.json({ 
        error: 'Not signed in',
        needsReauth: true 
      }, { status: 401 })
    }

    // Auto-refresh token if expired
    const tokenResult = await getValidGoogleToken(
      tokens.userId,
      tokens.accessToken,
      tokens.refreshToken
    )

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('📅 Could not get valid token:', errorResult.error)
      
      if (errorResult.requiresReauth) {
        return NextResponse.json({ 
          error: 'Calendar access expired. Please sign out and sign in again.',
          needsReauth: true 
        }, { status: 401 })
      }
      
      return NextResponse.json(
        { error: errorResult.error },
        { status: 500 }
      )
    }

    const validAccessToken = tokenResult.accessToken

    const { domain, recordId } = await request.json()

    if (!domain || !recordId) {
      return NextResponse.json({ error: 'Missing domain or recordId' }, { status: 400 })
    }

    const calendarSync = new GoogleCalendarSync(
      validAccessToken,
      tokens.refreshToken || ''
    )

    // Fetch the record from the appropriate domain table
    const { data: record, error } = await supabase
      .from(domain)
      .select('*')
      .eq('id', recordId)
      .single()

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Check if already synced
    const isSynced = await GoogleCalendarSync.isSynced(
      tokens.userId,
      domain,
      recordId
    )

    if (isSynced) {
      return NextResponse.json({
        message: 'Already synced',
        synced: true,
      })
    }

    // Create calendar event
    const googleEventId = await calendarSync.createEventFromDomain(
      domain,
      record,
      tokens.userId
    )

    if (!googleEventId) {
      return NextResponse.json({
        message: 'No event created (record may not have required date fields)',
        synced: false,
      })
    }

    return NextResponse.json({
      message: 'Synced successfully',
      synced: true,
      googleEventId,
    })
  } catch (error: any) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calendar/sync
 * Fetch upcoming events from Google Calendar
 * Automatically refreshes expired tokens - no re-auth popups!
 */
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      )
    }

    // Get Google tokens from Supabase user_settings
    const tokens = await getGoogleTokens()

    console.log('📅 Calendar sync - Token check:', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.accessToken,
      hasRefreshToken: !!tokens?.refreshToken,
      userEmail: tokens?.email,
    })

    if (!tokens) {
      console.error('📅 No authenticated user')
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    // Auto-refresh token if expired
    const tokenResult = await getValidGoogleToken(
      tokens.userId,
      tokens.accessToken,
      tokens.refreshToken
    )

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('📅 Could not get valid token:', errorResult.error)
      
      // Only require re-auth if refresh token is invalid
      if (errorResult.requiresReauth) {
        return NextResponse.json({ 
          error: 'Calendar access expired. Please sign out and sign in again.', 
          needsReauth: true 
        }, { status: 401 })
      }
      
      return NextResponse.json(
        { error: errorResult.error },
        { status: 500 }
      )
    }

    const validAccessToken = tokenResult.accessToken
    console.log('📅 Valid access token obtained (expires in', tokenResult.expiresIn, 'seconds)')

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    console.log(`📅 Fetching events for next ${days} days...`)

    const calendarSync = new GoogleCalendarSync(
      validAccessToken,
      tokens.refreshToken || ''
    )

    const events = await calendarSync.fetchUpcomingEvents(days)

    console.log(`📅 Successfully fetched ${events.length} events`)

    return NextResponse.json({
      events,
      count: events.length,
    })
  } catch (error: any) {
    console.error('📅 Calendar fetch error:', error.message)
    console.error('📅 Error details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}
