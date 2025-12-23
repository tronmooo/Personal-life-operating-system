/**
 * Gmail Sync API Endpoint
 * 
 * Fetches and processes recent emails from Gmail
 * Automatically refreshes expired tokens - no re-auth popups!
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createGmailParser } from '@/lib/integrations/gmail-parser'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔵 [GMAIL SYNC] API request started at', new Date().toISOString());
  try {
    const supabase = await createServerClient()
    
    // Get current user - use getUser() for reliable server-side auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Gmail sync - Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('✅ Gmail sync - User authenticated:', user.email)

    // Check if OpenAI is configured
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      console.error('❌ Gmail sync - OpenAI API key not configured')
      return NextResponse.json(
        { 
          error: 'OpenAI API key required for email classification',
          hint: 'Please configure OPENAI_API_KEY in your environment variables.'
        },
        { status: 500 }
      )
    }
    console.log('✅ OpenAI API key configured')

    // Get tokens from user_settings (includes refresh token for auto-refresh)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    let storedAccessToken: string | null = null
    let storedRefreshToken: string | null = null
    
    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('google_access_token, google_refresh_token')
        .eq('user_id', user.id)
        .single()
      
      storedAccessToken = settings?.google_access_token || null
      storedRefreshToken = settings?.google_refresh_token || null
      console.log('📩 Tokens from user_settings:', {
        accessToken: storedAccessToken ? 'Present' : 'Missing',
        refreshToken: storedRefreshToken ? 'Present' : 'Missing'
      })
    }

    // Also check request body for token (client may send fresh one)
    let bodyAccessToken: string | null = null
    try {
      const body = await request.json()
      bodyAccessToken = body.accessToken
      console.log('📩 Access token from request body:', bodyAccessToken ? 'Present' : 'Missing')
    } catch (e) {
      console.log('📩 No request body')
    }

    // Use body token or stored token
    let accessToken = bodyAccessToken || storedAccessToken

    // Get a valid token - automatically refreshes if expired!
    const tokenResult = await getValidGoogleToken(
      user.id,
      accessToken,
      storedRefreshToken
    )

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('❌ Could not get valid token:', errorResult.error)
      
      // Only require re-auth if refresh token is invalid
      if (errorResult.requiresReauth) {
        return NextResponse.json(
          { 
            error: 'Gmail access expired. Please sign out and sign in again.',
            hint: 'Your refresh token has expired. Click profile → Sign Out → Sign in with Google',
            requiresReauth: true
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: errorResult.error },
        { status: 500 }
      )
    }

    // Use the valid (possibly refreshed) token
    accessToken = tokenResult.accessToken
    console.log('✅ Valid access token obtained (expires in', tokenResult.expiresIn, 'seconds)')

    // Validate token has Gmail scopes
    try {
      const tokenCheckResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      )
      
      if (tokenCheckResponse.ok) {
        const tokenInfo = await tokenCheckResponse.json()
        const scopes = tokenInfo.scope?.split(' ') || []
        const hasGmailScopes = scopes.some((s: string) => s.includes('gmail'))
        
        if (!hasGmailScopes) {
          console.error('❌ Token missing Gmail scopes. Actual scopes:', scopes)
          return NextResponse.json(
            {
              error: 'Token missing Gmail permissions',
              hint: 'Your Google account needs Gmail permissions. Sign out and sign back in.',
              requiresReauth: true,
              actualScopes: scopes
            },
            { status: 403 }
          )
        }
        
        console.log('✅ Token validated with Gmail scopes')
      }
    } catch (tokenCheckError) {
      console.warn('⚠️ Could not pre-validate token, proceeding anyway:', tokenCheckError)
    }

    // Initialize Gmail parser
    const gmailParser = createGmailParser(accessToken)
    
    // Parse recent emails (default 7 days)
    const daysBack = 7
    console.log(`🔍 Parsing emails for last ${daysBack} days...`)
    // #region agent log
    const parseStart = Date.now();
    const classifiedEmails = await gmailParser.parseRecentEmails(daysBack)
    
    console.log(`📧 Found ${classifiedEmails.length} actionable emails`)

    // Store in Supabase (avoid duplicates)
    const storedEmails = []
    for (const email of classifiedEmails) {
      // Check if already processed
      const { data: existing } = await supabase
        .from('processed_emails')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_id', email.emailId)
        .single()

      if (existing) {
        console.log(`⏭️  Email ${email.emailId} already processed`)
        continue
      }

      // Check if email has receipt-related attachments
      const originalEmail = classifiedEmails.find(e => e.emailId === email.emailId)
      const hasAttachments = !!(originalEmail as any)?.attachments?.length

      // Insert new processed email with attachment info
      const { data: inserted, error: insertError } = await supabase
        .from('processed_emails')
        .insert({
          user_id: user.id,
          email_id: email.emailId,
          email_subject: email.subject,
          email_from: email.from,
          email_date: email.date.toISOString(),
          classification: email.classification,
          extracted_data: {
            ...email.extractedData,
            hasAttachments: hasAttachments
          },
          suggestion_text: email.suggestionText,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting email:', insertError)
      } else {
        storedEmails.push(inserted)
        // Mark email as processed in Gmail
        await gmailParser.addLabel(email.emailId, 'LifeOS/Processed')
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: classifiedEmails.length,
      newSuggestions: storedEmails.length,
      suggestions: storedEmails
    })
  } catch (error: any) {
    console.error('❌ Gmail sync error - Full details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      status: error?.status,
      name: error?.name
    })
    
    const status = error?.code || error?.status || error?.response?.status || 500
    
    // Check if it's a scope-related error
    const isScopeError = error?.message?.includes('insufficient authentication scopes') ||
                         error?.message?.includes('PERMISSION_DENIED')
    
    const message =
      status === 401
        ? 'Unauthorized with Gmail. Please re-connect Google with Gmail scope.'
        : status === 403 && isScopeError
          ? 'Insufficient Gmail scopes. Please sign out and sign back in to grant Gmail permissions.'
          : status === 403
          ? 'Gmail access denied. Please check your permissions.'
          : error?.message?.includes('OpenAI')
            ? 'OpenAI API key not configured. Email classification unavailable.'
            : (error?.message || 'Failed to sync Gmail')

    return NextResponse.json(
      { 
        error: message, 
        status,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        hint: isScopeError 
          ? 'Admin: Ensure Gmail scopes are configured in Supabase Auth Provider settings.'
          : undefined
      },
      { status }
    )
  }
}















