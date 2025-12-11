import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to check Supabase session and Google OAuth tokens
 * GET /api/debug/session-check
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        status: 'not_authenticated',
        message: 'No active session found',
        error: authError?.message || null,
      })
    }

    // Get full session for provider tokens
    const { data: { session } } = await supabase.auth.getSession()

    // Check what we have in the session
    const sessionInfo = {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
      },
      provider_token: session?.provider_token ? '✅ EXISTS' : '❌ MISSING',
      provider_refresh_token: session?.provider_refresh_token ? '✅ EXISTS' : '❌ MISSING',
      provider_token_length: session?.provider_token?.length || 0,
      provider: user.app_metadata?.provider || 'unknown',
      providers: user.app_metadata?.providers || [],
      
      // Check if signed in with Google
      is_google_oauth: user.app_metadata?.provider === 'google',
      
      // Token preview (first 20 chars for security)
      token_preview: session?.provider_token ? session.provider_token.substring(0, 20) + '...' : null,
      
      // Session details
      expires_at: session?.expires_at,
      expires_in: session?.expires_in,
    }

    return NextResponse.json(sessionInfo)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      status: 'error',
      error: message,
    }, { status: 500 })
  }
}
