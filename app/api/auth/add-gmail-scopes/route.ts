/**
 * Add Gmail Scopes API
 * 
 * This endpoint initiates an OAuth flow to add Gmail scopes
 * to an existing user's token WITHOUT requiring full sign-out.
 * 
 * Uses Google's incremental authorization approach.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the origin for redirect
    const origin = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'https://www.life-hub.me'

    // Build OAuth URL with ONLY Gmail scopes + prompt=consent
    // This forces Google to show consent screen for additional scopes
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ')

    // Use Supabase OAuth to get new token with all scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard/inbox`,
        scopes: scopes,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',  // Force consent screen to grant new scopes
          include_granted_scopes: 'true'  // Include previously granted scopes
        },
        skipBrowserRedirect: true  // Return URL instead of redirecting
      }
    })

    if (error || !data.url) {
      console.error('Failed to generate OAuth URL:', error)
      return NextResponse.json({ 
        error: 'Failed to generate authorization URL',
        details: error?.message 
      }, { status: 500 })
    }

    // Return the URL for the client to redirect to
    return NextResponse.json({ 
      url: data.url,
      message: 'Redirect user to this URL to grant Gmail access'
    })

  } catch (error: any) {
    console.error('Add Gmail scopes error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * POST version - directly redirects
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    const origin = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'https://www.life-hub.me'

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile', 
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard/inbox`,
        scopes: scopes,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true'
        },
        skipBrowserRedirect: true
      }
    })

    if (error || !data.url) {
      return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
    }

    // Redirect directly to Google OAuth
    return NextResponse.redirect(data.url)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

