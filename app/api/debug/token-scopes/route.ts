/**
 * Debug endpoint to check what scopes the current access token has
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get session for provider token
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.provider_token
    
    if (!token) {
      return NextResponse.json({
        error: 'No provider token found',
        hint: 'You may be signed in with email/password instead of Google OAuth'
      }, { status: 400 })
    }

    // Call Google's tokeninfo endpoint to see what scopes this token has
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    )
    
    const tokenInfo = await tokenInfoResponse.json()
    
    if (!tokenInfoResponse.ok) {
      return NextResponse.json({
        error: 'Token validation failed',
        details: tokenInfo,
        hint: 'Your token may be expired. Try signing out and signing back in.'
      }, { status: 400 })
    }

    // Check for Gmail scopes
    const scopes = tokenInfo.scope?.split(' ') || []
    const hasGmailReadonly = scopes.includes('https://www.googleapis.com/auth/gmail.readonly')
    const hasGmailModify = scopes.includes('https://www.googleapis.com/auth/gmail.modify')

    return NextResponse.json({
      success: true,
      user: user.email,
      tokenInfo: {
        scopes: scopes,
        expiresIn: tokenInfo.expires_in,
        audience: tokenInfo.audience,
      },
      gmailAccess: {
        readonly: hasGmailReadonly,
        modify: hasGmailModify,
        hasEitherScope: hasGmailReadonly || hasGmailModify
      },
      diagnosis: !hasGmailReadonly && !hasGmailModify
        ? '❌ Gmail scopes NOT granted. Your token does not have Gmail permissions.'
        : '✅ Gmail scopes are present in your token.',
      solution: !hasGmailReadonly && !hasGmailModify
        ? 'Sign out and sign back in to grant Gmail permissions. If that doesn\'t work, check Supabase Dashboard → Authentication → Providers → Google and ensure Gmail scopes are configured.'
        : null
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Failed to check token',
      message: message
    }, { status: 500 })
  }
}
