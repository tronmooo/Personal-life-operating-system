/**
 * Google Token Refresh Utility
 * 
 * Automatically refreshes expired Google access tokens using the stored refresh token.
 * This prevents users from ever having to re-authenticate - tokens are silently refreshed.
 */

import { createClient } from '@supabase/supabase-js'

interface RefreshResult {
  accessToken: string
  expiresIn: number
  success: true
}

interface RefreshError {
  success: false
  error: string
  requiresReauth?: boolean
}

type RefreshResponse = RefreshResult | RefreshError

/**
 * Refresh an expired Google access token using the refresh token
 * Updates the stored token in user_settings automatically
 */
export async function refreshGoogleToken(
  userId: string,
  refreshToken: string
): Promise<RefreshResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials')
    return { 
      success: false, 
      error: 'Google OAuth not configured',
      requiresReauth: false 
    }
  }

  if (!refreshToken) {
    console.error('❌ No refresh token available')
    return { 
      success: false, 
      error: 'No refresh token available',
      requiresReauth: true 
    }
  }

  try {
    console.log('🔄 Refreshing Google access token...')
    
    // Call Google's token endpoint to refresh
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.error('❌ Token refresh failed:', data.error_description || data.error)
      
      // If refresh token is invalid/revoked, user needs to re-auth
      const requiresReauth = data.error === 'invalid_grant' || 
                             data.error === 'invalid_token' ||
                             data.error === 'unauthorized_client'
      
      return { 
        success: false, 
        error: data.error_description || data.error || 'Token refresh failed',
        requiresReauth
      }
    }

    const newAccessToken = data.access_token
    const expiresIn = data.expires_in || 3600 // Default 1 hour

    console.log('✅ Got new access token, expires in', expiresIn, 'seconds')

    // Update stored token in user_settings
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { error: updateError } = await supabaseAdmin
        .from('user_settings')
        .update({
          google_access_token: newAccessToken,
          google_token_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('⚠️ Failed to update stored token:', updateError)
        // Continue anyway - we have the new token
      } else {
        console.log('✅ Stored token updated in user_settings')
      }
    }

    return {
      success: true,
      accessToken: newAccessToken,
      expiresIn,
    }
  } catch (error) {
    console.error('❌ Token refresh exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Token refresh failed',
      requiresReauth: false 
    }
  }
}

/**
 * Check if a Google access token is valid
 * Returns the token info if valid, null if expired/invalid
 */
export async function validateGoogleToken(accessToken: string): Promise<{
  valid: boolean
  expiresIn?: number
  scopes?: string[]
}> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    )

    if (!response.ok) {
      return { valid: false }
    }

    const data = await response.json()
    
    return {
      valid: true,
      expiresIn: data.expires_in,
      scopes: data.scope?.split(' ') || [],
    }
  } catch (error) {
    return { valid: false }
  }
}

/**
 * Get a valid Google access token, refreshing if necessary
 * This is the main function to use - it handles all the complexity
 */
export async function getValidGoogleToken(
  userId: string,
  currentAccessToken: string | null,
  refreshToken: string | null
): Promise<RefreshResponse> {
  // If we have an access token, check if it's still valid
  if (currentAccessToken) {
    const validation = await validateGoogleToken(currentAccessToken)
    
    if (validation.valid && validation.expiresIn && validation.expiresIn > 60) {
      // Token is valid and has more than 60 seconds left
      console.log('✅ Existing token is still valid, expires in', validation.expiresIn, 'seconds')
      return {
        success: true,
        accessToken: currentAccessToken,
        expiresIn: validation.expiresIn,
      }
    }
    
    console.log('⚠️ Token expired or expiring soon, will refresh...')
  }

  // Token is missing or expired, try to refresh
  if (!refreshToken) {
    console.error('❌ No refresh token available for token refresh')
    return {
      success: false,
      error: 'No refresh token available',
      requiresReauth: true,
    }
  }

  return refreshGoogleToken(userId, refreshToken)
}













