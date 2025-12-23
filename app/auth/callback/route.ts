import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * OAuth Callback Handler
 * 
 * This route handles the OAuth callback from Supabase Auth (Google OAuth).
 * It exchanges the authorization code for a session and stores Google tokens
 * in the user_settings table for use by Calendar, Drive, and Gmail APIs.
 * 
 * CRITICAL FOR PRODUCTION:
 * - Tokens MUST be stored server-side (not just in session cookies)
 * - provider_token and provider_refresh_token are only available on this initial callback
 * - Supabase session doesn't persist provider tokens across requests
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Log for debugging in Vercel
  console.log('🔐 [AUTH CALLBACK] Processing callback', {
    hasCode: !!code,
    error: errorParam,
    errorDescription,
    origin,
    next,
    timestamp: new Date().toISOString(),
  })

  // Handle OAuth errors from provider
  if (errorParam) {
    console.error('❌ [AUTH CALLBACK] OAuth error from provider:', {
      error: errorParam,
      description: errorDescription,
    })
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || '')}`
    )
  }

  if (!code) {
    console.warn('⚠️ [AUTH CALLBACK] No code provided, redirecting to signin')
    return NextResponse.redirect(`${origin}/auth/signin`)
  }

  // In Next.js 14, cookies() returns a Promise
  const cookieStore = await cookies()
  
  // Log existing cookies for debugging
  const existingCookies = cookieStore.getAll()
  console.log('🍪 [AUTH CALLBACK] Existing cookies:', existingCookies.map(c => c.name).join(', '))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure cookies work in production
              const cookieOptions = {
                ...options,
                // Ensure secure cookies in production
                secure: process.env.NODE_ENV === 'production',
                // Allow cross-site requests for OAuth
                sameSite: 'lax' as const,
              }
              cookieStore.set(name, value, cookieOptions)
            })
            console.log('🍪 [AUTH CALLBACK] Set cookies:', cookiesToSet.map(c => c.name).join(', '))
          } catch (error) {
            console.error('❌ [AUTH CALLBACK] Cookie set error:', error)
          }
        },
      },
    }
  )
  
  try {
    console.log('🔄 [AUTH CALLBACK] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ [AUTH CALLBACK] Exchange error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      return NextResponse.redirect(
        `${origin}/auth/signin?error=auth_failed&error_description=${encodeURIComponent(error.message)}`
      )
    }
    
    if (!data.session || !data.user) {
      console.error('❌ [AUTH CALLBACK] No session or user in response')
      return NextResponse.redirect(`${origin}/auth/signin?error=no_session`)
    }

    console.log('✅ [AUTH CALLBACK] Session created:', {
      userEmail: data.user.email,
      userId: data.user.id,
      provider: data.user.app_metadata?.provider,
      hasProviderToken: !!data.session.provider_token,
      hasRefreshToken: !!data.session.provider_refresh_token,
    })
    
    // CRITICAL: Store Google OAuth tokens for API access
    // These tokens are ONLY available in this callback - they're not persisted
    // in the Supabase session across requests!
    const { provider_token, provider_refresh_token } = data.session
    
    if (provider_token) {
      console.log('📝 [AUTH CALLBACK] Storing Google OAuth tokens...')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!serviceRoleKey) {
        console.error('❌ [AUTH CALLBACK] SUPABASE_SERVICE_ROLE_KEY not configured!')
        console.error('❌ [AUTH CALLBACK] Google tokens will NOT be saved - integrations will fail')
      } else if (supabaseUrl) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        
        // Store tokens in user_settings
        const { error: upsertError } = await supabaseAdmin
          .from('user_settings')
          .upsert({
            user_id: data.user.id,
            google_access_token: provider_token,
            google_refresh_token: provider_refresh_token || null,
            google_token_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          })
        
        if (upsertError) {
          console.error('❌ [AUTH CALLBACK] Failed to store Google tokens:', {
            code: upsertError.code,
            message: upsertError.message,
            details: upsertError.details,
          })
        } else {
          console.log('✅ [AUTH CALLBACK] Google tokens stored successfully', {
            userId: data.user.id,
            hasRefreshToken: !!provider_refresh_token,
          })
        }
      }
    } else {
      console.warn('⚠️ [AUTH CALLBACK] No provider_token in session!', {
        provider: data.user.app_metadata?.provider,
        hint: 'User may have signed in with email/password instead of Google OAuth',
      })
    }
    
    // Redirect to the next page
    const redirectUrl = `${origin}${next}`
    console.log('🚀 [AUTH CALLBACK] Redirecting to:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ [AUTH CALLBACK] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      `${origin}/auth/signin?error=callback_error&error_description=${encodeURIComponent(errorMessage)}`
    )
  }
}
