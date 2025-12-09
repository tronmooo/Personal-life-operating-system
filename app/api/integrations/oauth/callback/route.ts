/**
 * OAuth Callback Handler
 * Handles OAuth redirects from external services
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// OAuth configurations for different providers
const OAUTH_CONFIGS: Record<string, {
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
}> = {
  spotify: {
    tokenUrl: 'https://accounts.spotify.com/api/token',
    clientIdEnv: 'SPOTIFY_CLIENT_ID',
    clientSecretEnv: 'SPOTIFY_CLIENT_SECRET',
  },
  fitbit: {
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    clientIdEnv: 'FITBIT_CLIENT_ID',
    clientSecretEnv: 'FITBIT_CLIENT_SECRET',
  },
  strava: {
    tokenUrl: 'https://www.strava.com/oauth/token',
    clientIdEnv: 'STRAVA_CLIENT_ID',
    clientSecretEnv: 'STRAVA_CLIENT_SECRET',
  },
  notion: {
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    clientIdEnv: 'NOTION_CLIENT_ID',
    clientSecretEnv: 'NOTION_CLIENT_SECRET',
  },
  todoist: {
    tokenUrl: 'https://todoist.com/oauth/access_token',
    clientIdEnv: 'TODOIST_CLIENT_ID',
    clientSecretEnv: 'TODOIST_CLIENT_SECRET',
  },
  dropbox: {
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    clientIdEnv: 'DROPBOX_CLIENT_ID',
    clientSecretEnv: 'DROPBOX_CLIENT_SECRET',
  },
  coinbase: {
    tokenUrl: 'https://api.coinbase.com/oauth/token',
    clientIdEnv: 'COINBASE_CLIENT_ID',
    clientSecretEnv: 'COINBASE_CLIENT_SECRET',
  },
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL(`/connections?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/connections?error=missing_params', request.url))
    }

    // Decode state to get provider info
    let stateData: { provider: string; returnUrl?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(new URL('/connections?error=invalid_state', request.url))
    }

    const { provider } = stateData
    const config = OAUTH_CONFIGS[provider]

    if (!config) {
      return NextResponse.redirect(new URL('/connections?error=unknown_provider', request.url))
    }

    const clientId = process.env[config.clientIdEnv]
    const clientSecret = process.env[config.clientSecretEnv]

    if (!clientId || !clientSecret) {
      console.error(`Missing OAuth credentials for ${provider}`)
      return NextResponse.redirect(new URL(`/connections?error=not_configured&provider=${provider}`, request.url))
    }

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/callback`
    
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error(`Token exchange failed for ${provider}:`, errorData)
      return NextResponse.redirect(new URL(`/connections?error=token_exchange_failed&provider=${provider}`, request.url))
    }

    const tokenData = await tokenResponse.json()

    // Calculate expiration
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Save connection to database
    const { error: saveError } = await supabase
      .from('external_connections')
      .upsert({
        user_id: session.user.id,
        provider,
        connection_type: 'oauth',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        status: 'active',
        metadata: {
          scope: tokenData.scope,
          token_type: tokenData.token_type,
        },
        last_synced: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })

    if (saveError) {
      console.error('Error saving connection:', saveError)
      return NextResponse.redirect(new URL(`/connections?error=save_failed&provider=${provider}`, request.url))
    }

    // Redirect back to connections page with success
    return NextResponse.redirect(new URL(`/connections?success=connected&provider=${provider}`, request.url))
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL(`/connections?error=${encodeURIComponent(error.message)}`, request.url))
  }
}












