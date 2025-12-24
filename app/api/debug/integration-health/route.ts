/**
 * Integration Health Check API
 * 
 * Comprehensive diagnostic endpoint for Google integrations:
 * - OAuth status and token validity
 * - Granted scopes vs required scopes
 * - Token expiry information
 * - Test endpoints for Drive, Gmail, Calendar
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Required scopes for full functionality
const REQUIRED_SCOPES = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  calendar: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
  ],
  profile: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error'
  auth: {
    authenticated: boolean
    provider: string | null
    user_email: string | null
    user_id: string | null
  }
  tokens: {
    hasAccessToken: boolean
    hasRefreshToken: boolean
    tokenSource: 'session' | 'user_settings' | 'none'
    tokenValid: boolean
    expiresIn: number | null
    lastUpdated: string | null
  }
  scopes: {
    granted: string[]
    missing: {
      gmail: string[]
      calendar: string[]
      drive: string[]
    }
    summary: {
      gmail: boolean
      calendar: boolean
      drive: boolean
      profile: boolean
    }
  }
  environment: {
    hasGoogleClientId: boolean
    hasGoogleClientSecret: boolean
    hasSupabaseUrl: boolean
    hasSupabaseServiceKey: boolean
    nodeEnv: string
    deploymentUrl: string | null
  }
  errors: string[]
  recommendations: string[]
}

export async function GET(request: NextRequest) {
  const result: HealthCheckResult = {
    status: 'healthy',
    auth: {
      authenticated: false,
      provider: null,
      user_email: null,
      user_id: null,
    },
    tokens: {
      hasAccessToken: false,
      hasRefreshToken: false,
      tokenSource: 'none',
      tokenValid: false,
      expiresIn: null,
      lastUpdated: null,
    },
    scopes: {
      granted: [],
      missing: {
        gmail: [...REQUIRED_SCOPES.gmail],
        calendar: [...REQUIRED_SCOPES.calendar],
        drive: [...REQUIRED_SCOPES.drive],
      },
      summary: {
        gmail: false,
        calendar: false,
        drive: false,
        profile: false,
      },
    },
    environment: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      deploymentUrl: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || null,
    },
    errors: [],
    recommendations: [],
  }

  try {
    // Check environment
    if (!result.environment.hasGoogleClientId) {
      result.errors.push('GOOGLE_CLIENT_ID not configured')
      result.recommendations.push('Set GOOGLE_CLIENT_ID in environment variables')
    }
    if (!result.environment.hasGoogleClientSecret) {
      result.errors.push('GOOGLE_CLIENT_SECRET not configured')
      result.recommendations.push('Set GOOGLE_CLIENT_SECRET in environment variables')
    }
    if (!result.environment.hasSupabaseServiceKey) {
      result.errors.push('SUPABASE_SERVICE_ROLE_KEY not configured')
      result.recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY in environment variables')
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      result.status = 'unhealthy'
      result.errors.push('User not authenticated')
      result.recommendations.push('Sign in with Google OAuth to use integrations')
      return NextResponse.json(result)
    }

    result.auth.authenticated = true
    result.auth.user_email = user.email || null
    result.auth.user_id = user.id
    result.auth.provider = user.app_metadata?.provider || null

    // Check for provider token in session
    const { data: { session } } = await supabase.auth.getSession()
    let accessToken: string | null = session?.provider_token || null
    let refreshToken: string | null = session?.provider_refresh_token || null
    let tokenSource: 'session' | 'user_settings' | 'none' = accessToken ? 'session' : 'none'

    // If no session token, check user_settings
    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .select('google_access_token, google_refresh_token, google_token_updated_at')
          .eq('user_id', user.id)
          .single()

        if (!settingsError && settings?.google_access_token) {
          accessToken = settings.google_access_token
          refreshToken = settings.google_refresh_token || null
          tokenSource = 'user_settings'
          result.tokens.lastUpdated = settings.google_token_updated_at
        }
      }
    }

    result.tokens.hasAccessToken = !!accessToken
    result.tokens.hasRefreshToken = !!refreshToken
    result.tokens.tokenSource = tokenSource

    if (!accessToken) {
      result.status = 'unhealthy'
      result.errors.push('No Google access token found')
      result.recommendations.push('Sign out and sign back in with Google to obtain fresh tokens')
      result.recommendations.push('Ensure Google OAuth is properly configured in Supabase Dashboard')
      return NextResponse.json(result)
    }

    // Validate token with Google
    try {
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      )

      if (!tokenInfoResponse.ok) {
        const errorData = await tokenInfoResponse.json()
        result.tokens.tokenValid = false
        result.status = 'degraded'
        result.errors.push(`Token validation failed: ${errorData.error_description || errorData.error}`)
        
        if (refreshToken) {
          result.recommendations.push('Token expired but refresh token available - API calls will auto-refresh')
        } else {
          result.recommendations.push('Token invalid and no refresh token - sign out and sign back in')
        }
      } else {
        const tokenInfo = await tokenInfoResponse.json()
        result.tokens.tokenValid = true
        result.tokens.expiresIn = tokenInfo.expires_in || null

        // Parse scopes
        const grantedScopes = tokenInfo.scope?.split(' ') || []
        result.scopes.granted = grantedScopes

        // Check each scope category
        const checkScopes = (required: string[]) => 
          required.filter(s => !grantedScopes.includes(s))

        result.scopes.missing.gmail = checkScopes(REQUIRED_SCOPES.gmail)
        result.scopes.missing.calendar = checkScopes(REQUIRED_SCOPES.calendar)
        result.scopes.missing.drive = checkScopes(REQUIRED_SCOPES.drive)

        result.scopes.summary.gmail = result.scopes.missing.gmail.length === 0 ||
          grantedScopes.some((s: string) => s.includes('gmail'))
        result.scopes.summary.calendar = result.scopes.missing.calendar.length === 0 ||
          grantedScopes.some((s: string) => s.includes('calendar'))
        result.scopes.summary.drive = result.scopes.missing.drive.length === 0 ||
          grantedScopes.some((s: string) => s.includes('drive'))
        result.scopes.summary.profile = 
          grantedScopes.includes('https://www.googleapis.com/auth/userinfo.email') ||
          grantedScopes.includes('email')

        // Add recommendations for missing scopes
        if (!result.scopes.summary.gmail) {
          result.status = result.status === 'healthy' ? 'degraded' : result.status
          result.recommendations.push('Gmail scopes not granted - re-authenticate to enable Smart Inbox')
        }
        if (!result.scopes.summary.calendar) {
          result.status = result.status === 'healthy' ? 'degraded' : result.status
          result.recommendations.push('Calendar scopes not granted - re-authenticate to enable Calendar sync')
        }
        if (!result.scopes.summary.drive) {
          result.status = result.status === 'healthy' ? 'degraded' : result.status
          result.recommendations.push('Drive scopes not granted - re-authenticate to enable document uploads')
        }

        // Check token expiry
        if (tokenInfo.expires_in && tokenInfo.expires_in < 300) {
          result.recommendations.push('Token expiring soon - will auto-refresh on next API call')
        }
      }
    } catch (tokenError) {
      result.tokens.tokenValid = false
      result.status = 'error'
      result.errors.push(`Token validation error: ${tokenError instanceof Error ? tokenError.message : 'Unknown'}`)
    }

    // Determine final status
    if (result.errors.length > 0) {
      result.status = result.errors.some(e => e.includes('not configured') || e.includes('not authenticated'))
        ? 'unhealthy'
        : 'degraded'
    }

  } catch (error) {
    result.status = 'error'
    result.errors.push(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return NextResponse.json(result)
}

/**
 * POST /api/debug/integration-health
 * Test a specific integration
 */
export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json()

    // Get user and tokens
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get access token
    const { data: { session } } = await supabase.auth.getSession()
    let accessToken = session?.provider_token

    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const { data: settings } = await supabaseAdmin
          .from('user_settings')
          .select('google_access_token')
          .eq('user_id', user.id)
          .single()

        accessToken = settings?.google_access_token
      }
    }

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token available',
        hint: 'Sign out and sign back in with Google'
      }, { status: 401 })
    }

    // Test the specified service
    switch (service) {
      case 'drive': {
        // Test Drive API - list files
        const driveResponse = await fetch(
          'https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name,mimeType)',
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        )
        
        if (!driveResponse.ok) {
          const error = await driveResponse.json()
          return NextResponse.json({
            success: false,
            service: 'drive',
            error: error.error?.message || 'Drive API error',
            status: driveResponse.status
          })
        }

        const driveData = await driveResponse.json()
        return NextResponse.json({
          success: true,
          service: 'drive',
          message: `Drive API working - found ${driveData.files?.length || 0} files`,
          data: driveData.files?.slice(0, 3) // Return first 3 files
        })
      }

      case 'gmail': {
        // Test Gmail API - list messages
        const gmailResponse = await fetch(
          'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        )
        
        if (!gmailResponse.ok) {
          const error = await gmailResponse.json()
          return NextResponse.json({
            success: false,
            service: 'gmail',
            error: error.error?.message || 'Gmail API error',
            status: gmailResponse.status
          })
        }

        const gmailData = await gmailResponse.json()
        return NextResponse.json({
          success: true,
          service: 'gmail',
          message: `Gmail API working - found ${gmailData.messages?.length || 0} messages`,
          data: { messageCount: gmailData.resultSizeEstimate }
        })
      }

      case 'calendar': {
        // Test Calendar API - list events
        const now = new Date().toISOString()
        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        
        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${now}&timeMax=${future}&maxResults=10&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        )
        
        if (!calendarResponse.ok) {
          const error = await calendarResponse.json()
          return NextResponse.json({
            success: false,
            service: 'calendar',
            error: error.error?.message || 'Calendar API error',
            status: calendarResponse.status
          })
        }

        const calendarData = await calendarResponse.json()
        return NextResponse.json({
          success: true,
          service: 'calendar',
          message: `Calendar API working - found ${calendarData.items?.length || 0} upcoming events`,
          data: calendarData.items?.slice(0, 3).map((e: any) => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date
          }))
        })
      }

      default:
        return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
    }, { status: 500 })
  }
}





