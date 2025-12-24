import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/store-google-tokens
 * 
 * Client-side endpoint to store Google OAuth tokens.
 * Called immediately after Google OAuth sign-in to ensure tokens are persisted.
 * 
 * This is a backup mechanism - the auth callback should also store tokens,
 * but this ensures tokens are stored even if the callback fails.
 */
export async function POST(request: Request) {
  try {
    const { provider_token, provider_refresh_token } = await request.json()
    
    if (!provider_token) {
      return NextResponse.json({ 
        error: 'No provider_token provided' 
      }, { status: 400 })
    }

    // Get the authenticated user from Supabase session
    const cookieStore = await cookies()
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ store-google-tokens: No authenticated user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Use admin client to store tokens (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ store-google-tokens: Missing Supabase credentials')
      return NextResponse.json({ 
        error: 'Server configuration error - missing SUPABASE_SERVICE_ROLE_KEY' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Store tokens in user_settings
    const { error: upsertError } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_id: user.id,
        google_access_token: provider_token,
        google_refresh_token: provider_refresh_token || null,
        google_token_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
    
    if (upsertError) {
      console.error('❌ store-google-tokens: Failed to store tokens:', upsertError)
      return NextResponse.json({ 
        error: 'Failed to store tokens',
        details: upsertError.message 
      }, { status: 500 })
    }

    console.log('✅ store-google-tokens: Tokens stored successfully for user:', user.email)
    
    return NextResponse.json({ 
      success: true,
      message: 'Google tokens stored successfully',
      user_email: user.email
    })

  } catch (error: any) {
    console.error('❌ store-google-tokens: Exception:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * GET /api/auth/store-google-tokens
 * 
 * Check if Google tokens are stored for the current user.
 */
export async function GET() {
  try {
    // Get the authenticated user
    const cookieStore = await cookies()
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors
            }
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        authenticated: false,
        has_google_tokens: false 
      })
    }

    // Check for tokens using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        authenticated: true,
        has_google_tokens: false,
        error: 'Missing service role key'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('google_access_token, google_refresh_token, google_token_updated_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user_email: user.email,
      has_google_tokens: !!settings?.google_access_token,
      has_refresh_token: !!settings?.google_refresh_token,
      token_updated_at: settings?.google_token_updated_at || null
    })

  } catch (error: any) {
    console.error('❌ GET store-google-tokens:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}


