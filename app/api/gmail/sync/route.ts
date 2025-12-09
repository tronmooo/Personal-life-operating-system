/**
 * Gmail Sync API Endpoint
 * 
 * Fetches and processes recent emails from Gmail
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createGmailParser } from '@/lib/integrations/gmail-parser'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Try to get access token from request body first, then session, then user_settings
    let accessToken: string | null = null
    
    try {
      const body = await request.json()
      accessToken = body.accessToken
      console.log('📩 Access token from request body:', accessToken ? 'Present' : 'Missing')
    } catch (e) {
      console.log('📩 No request body, checking session...')
    }
    
    // Fallback to session provider_token (need to get session separately)
    if (!accessToken) {
      const { data: { session } } = await supabase.auth.getSession()
      accessToken = session?.provider_token || null
      console.log('📩 Access token from session:', accessToken ? 'Present' : 'Missing')
    }

    // Final fallback: check user_settings table
    if (!accessToken) {
      console.log('📩 Checking user_settings table for stored token...')
      const { data: settings } = await supabase
        .from('user_settings')
        .select('google_access_token')
        .eq('user_id', user.id)
        .single()
      
      accessToken = settings?.google_access_token || null
      console.log('📩 Access token from user_settings:', accessToken ? 'Present' : 'Missing')
    }

    if (!accessToken) {
      console.error('❌ No access token available. User needs to re-authenticate.')
      return NextResponse.json(
        { 
          error: 'Gmail access token required. Please sign out and sign in with Google again.',
          hint: 'Click profile icon → Sign Out → Sign in with Google → Grant all permissions'
        },
        { status: 401 }
      )
    }

    console.log('✅ Access token found, proceeding with Gmail sync...')

    // Validate token has Gmail scopes before attempting sync
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
              hint: 'Your access token does not include Gmail scopes. The session needs to be refreshed.',
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

      // Insert new processed email
      const { data: inserted, error: insertError } = await supabase
        .from('processed_emails')
        .insert({
          user_id: user.id,
          email_id: email.emailId,
          email_subject: email.subject,
          email_from: email.from,
          email_date: email.date.toISOString(),
          classification: email.classification,
          extracted_data: email.extractedData,
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















