import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Debug endpoint to check Supabase session and Google OAuth tokens
 * GET /api/debug/session-check
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message,
      })
    }

    if (!session) {
      return NextResponse.json({
        status: 'not_authenticated',
        message: 'No active session found',
      })
    }

    // Check what we have in the session
    const sessionInfo = {
      status: 'authenticated',
      user: {
        id: session.user.id,
        email: session.user.email,
        app_metadata: session.user.app_metadata,
      },
      provider_token: session.provider_token ? '✅ EXISTS' : '❌ MISSING',
      provider_refresh_token: session.provider_refresh_token ? '✅ EXISTS' : '❌ MISSING',
      provider_token_length: session.provider_token?.length || 0,
      provider: session.user.app_metadata?.provider || 'unknown',
      providers: session.user.app_metadata?.providers || [],
      
      // Check if signed in with Google
      is_google_oauth: session.user.app_metadata?.provider === 'google',
      
      // Token preview (first 20 chars for security)
      token_preview: session.provider_token ? session.provider_token.substring(0, 20) + '...' : null,
      
      // Session details
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    }

    return NextResponse.json(sessionInfo)
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 })
  }
}







