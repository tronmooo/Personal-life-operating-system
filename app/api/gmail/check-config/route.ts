/**
 * Gmail Configuration Check Endpoint
 * 
 * Returns diagnostic information about Gmail sync setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get current user and session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      checks: {
        authenticated: false,
        hasProviderToken: false,
        openaiConfigured: false,
        googleClientId: false,
        googleClientSecret: false
      },
      session: {
        userId: null as string | null,
        email: null as string | null,
        provider: null as string | null
      },
      recommendations: [] as string[]
    }

    // Check authentication
    if (!authError && user) {
      diagnostics.checks.authenticated = true
      diagnostics.session.userId = user.id
      diagnostics.session.email = user.email || null
      diagnostics.session.provider = user.app_metadata?.provider || null
      
      // Check for provider token
      if (session?.provider_token) {
        diagnostics.checks.hasProviderToken = true
      } else {
        diagnostics.recommendations.push('No Google OAuth provider token found. You need to sign in with Google and grant Gmail permissions.')
      }
    } else {
      diagnostics.recommendations.push('Not authenticated. Please sign in.')
    }

    // Check OpenAI configuration
    if (process.env.OPENAI_API_KEY) {
      diagnostics.checks.openaiConfigured = true
    } else {
      diagnostics.recommendations.push('OPENAI_API_KEY not configured. Email classification will not work.')
    }

    // Check Google OAuth configuration
    if (process.env.GOOGLE_CLIENT_ID) {
      diagnostics.checks.googleClientId = true
    } else {
      diagnostics.recommendations.push('GOOGLE_CLIENT_ID not configured.')
    }

    if (process.env.GOOGLE_CLIENT_SECRET) {
      diagnostics.checks.googleClientSecret = true
    } else {
      diagnostics.recommendations.push('GOOGLE_CLIENT_SECRET not configured.')
    }

    // Overall status
    const allChecksPass = Object.values(diagnostics.checks).every(check => check === true)
    
    return NextResponse.json({
      status: allChecksPass ? 'ready' : 'configuration_required',
      diagnostics,
      message: allChecksPass 
        ? '✅ Gmail sync is properly configured and ready to use'
        : '⚠️ Gmail sync requires additional configuration'
    })
  } catch (error: any) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check configuration',
        details: error?.message 
      },
      { status: 500 }
    )
  }
}


































