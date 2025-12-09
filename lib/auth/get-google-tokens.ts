/**
 * Get Google OAuth tokens for the authenticated user
 * 
 * This function retrieves Google access/refresh tokens stored in user_settings
 * These tokens are saved during the Supabase OAuth callback and are used
 * by Calendar, Drive, and Gmail API integrations.
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface GoogleTokens {
  accessToken: string
  refreshToken: string | null
  userId: string
  email: string | null
}

/**
 * Get Google OAuth tokens for the current user from Supabase
 * Use this in Route Handlers that need to call Google APIs
 */
export async function getGoogleTokens(): Promise<GoogleTokens | null> {
  try {
    // Get the authenticated user from Supabase session using SSR client
    const cookieStore = await cookies()
    
    const supabase = createSSRClient(
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ getGoogleTokens: No authenticated user')
      return null
    }

    // Fetch tokens from user_settings using service role (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ getGoogleTokens: Missing Supabase credentials')
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('google_access_token, google_refresh_token')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings?.google_access_token) {
      console.error('❌ getGoogleTokens: No Google tokens found for user', user.id)
      return null
    }

    return {
      accessToken: settings.google_access_token,
      refreshToken: settings.google_refresh_token || null,
      userId: user.id,
      email: user.email || null,
    }
  } catch (error) {
    console.error('❌ getGoogleTokens: Error fetching tokens:', error)
    return null
  }
}

/**
 * Get the authenticated Supabase user from cookies
 * Use this in Route Handlers that need the user but not Google tokens
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createSSRClient(
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
              // Ignore - middleware handles this
            }
          },
        },
      }
    )
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('❌ getAuthenticatedUser: Error:', error)
    return null
  }
}
