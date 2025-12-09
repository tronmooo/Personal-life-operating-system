/**
 * Comprehensive Auth & OAuth Scope Diagnostic Endpoint
 * 
 * This endpoint will tell you exactly what's wrong and how to fix it
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
]

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getUser()
    
    if (error || !session?.user) {
      return NextResponse.json({
        status: 'error',
        issue: 'NOT_AUTHENTICATED',
        message: 'You are not signed in',
        solution: 'Sign in with Google OAuth to use Gmail features'
      })
    }

    const token = session.provider_token
    const user = user
    
    // Check if user signed in with OAuth
    const provider = user.app_metadata?.provider
    
    if (!token) {
      return NextResponse.json({
        status: 'error',
        issue: 'NO_PROVIDER_TOKEN',
        message: 'No OAuth token found in session',
        user: user.email,
        provider: provider || 'unknown',
        diagnosis: provider === 'email' 
          ? 'You signed in with email/password. Gmail sync requires Google OAuth sign-in.'
          : 'No provider token in session. Token may have expired.',
        solution: provider === 'email'
          ? '1. Sign out\n2. Sign back in using "Sign in with Google" button'
          : '1. Sign out\n2. Clear browser cookies\n3. Sign back in with Google'
      })
    }

    // Validate token and check scopes
    try {
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      )
      
      const tokenInfo = await tokenInfoResponse.json()
      
      if (!tokenInfoResponse.ok) {
        return NextResponse.json({
          status: 'error',
          issue: 'TOKEN_INVALID',
          message: 'OAuth token is invalid or expired',
          user: user.email,
          tokenError: tokenInfo.error_description || tokenInfo.error,
          solution: '1. Sign out\n2. Sign back in with Google to get a fresh token'
        })
      }

      // Parse scopes
      const grantedScopes = tokenInfo.scope?.split(' ') || []
      const hasGmailReadonly = grantedScopes.includes('https://www.googleapis.com/auth/gmail.readonly')
      const hasGmailModify = grantedScopes.includes('https://www.googleapis.com/auth/gmail.modify')
      const hasAnyGmailScope = hasGmailReadonly || hasGmailModify

      // Detailed diagnosis
      if (!hasAnyGmailScope) {
        return NextResponse.json({
          status: 'error',
          issue: 'MISSING_GMAIL_SCOPES',
          message: '❌ Your Google OAuth token does NOT have Gmail permissions',
          user: user.email,
          grantedScopes: grantedScopes,
          missingScopes: REQUIRED_SCOPES,
          diagnosis: 'The Google OAuth token does not include Gmail scopes. This usually means:\n' +
                     '  1. Scopes are not configured in Supabase Dashboard, OR\n' +
                     '  2. You signed in before Gmail scopes were added, OR\n' +
                     '  3. You denied Gmail permissions during sign-in',
          solution: 
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '🔧 FIX INSTRUCTIONS\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            'STEP 1: Configure Supabase (One-time setup)\n' +
            '----------------------------------------\n' +
            '1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers\n' +
            '2. Click "Google" provider\n' +
            '3. In the "Scopes" field, paste:\n\n' +
            '   https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata\n\n' +
            '4. Click "Save"\n\n' +
            'STEP 2: Re-authenticate (Required for ALL users)\n' +
            '-----------------------------------------------\n' +
            '1. Sign out of LifeHub\n' +
            '2. Clear browser cookies (F12 → Application → Cookies → Clear all)\n' +
            '3. Sign back in with Google\n' +
            '4. You should see Gmail permissions in the consent screen\n' +
            '5. Click "Allow"\n\n' +
            'STEP 3: Test\n' +
            '------------\n' +
            '1. Reload this page: /api/debug/auth-diagnosis\n' +
            '2. It should show "✅ ALL SYSTEMS GO"\n' +
            '3. Try Gmail sync from the dashboard\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
        })
      }

      // Success!
      return NextResponse.json({
        status: 'success',
        message: '✅ ALL SYSTEMS GO - Gmail sync should work!',
        user: user.email,
        provider: provider,
        tokenValid: true,
        gmailAccess: {
          readonly: hasGmailReadonly,
          modify: hasGmailModify
        },
        grantedScopes: grantedScopes,
        tokenExpiresIn: `${tokenInfo.expires_in} seconds`,
        nextSteps: 'Your authentication is properly configured. Gmail sync should work now!'
      })

    } catch (tokenError: any) {
      return NextResponse.json({
        status: 'error',
        issue: 'TOKEN_CHECK_FAILED',
        message: 'Could not validate OAuth token',
        error: tokenError.message,
        solution: 'Sign out and sign back in with Google'
      })
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      issue: 'UNEXPECTED_ERROR',
      message: error.message
    }, { status: 500 })
  }
}
































