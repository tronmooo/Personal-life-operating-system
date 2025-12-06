/**
 * Get Google OAuth tokens for the authenticated user
 * 
 * This function retrieves Google access/refresh tokens stored in user_settings
 * These tokens are saved during the Supabase OAuth callback and are used
 * by Calendar, Drive, and Gmail API integrations.
 */

import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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
    // Get the authenticated user from Supabase session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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


