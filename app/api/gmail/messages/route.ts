/**
 * Gmail Messages API
 * 
 * GET /api/gmail/messages - List recent Gmail messages (Smart Inbox)
 * 
 * Query params:
 * - maxResults: Maximum messages to return (default: 20)
 * - query: Gmail search query (default: recent inbox messages)
 * - pageToken: For pagination
 * 
 * Features:
 * - Auto-refreshes expired tokens
 * - Returns message snippets and metadata
 * - Supports Gmail search queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'

export const dynamic = 'force-dynamic'

interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  subject: string
  from: string
  to: string
  date: string
  labels: string[]
  isUnread: boolean
  hasAttachments: boolean
}

async function getMessageDetails(
  messageId: string, 
  accessToken: string
): Promise<GmailMessage | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch message ${messageId}:`, response.status)
      return null
    }

    const data = await response.json()
    
    // Extract headers
    const headers = data.payload?.headers || []
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    // Check for attachments
    const hasAttachments = (data.payload?.parts || []).some(
      (part: any) => part.filename && part.filename.length > 0
    )

    return {
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet || '',
      subject: getHeader('Subject') || '(No Subject)',
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      labels: data.labelIds || [],
      isUnread: (data.labelIds || []).includes('UNREAD'),
      hasAttachments,
    }
  } catch (error) {
    console.error(`Error fetching message ${messageId}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('📧 [GMAIL API] Request started at', new Date().toISOString())

  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '20', 10)
    const query = searchParams.get('query') || 'in:inbox'
    const pageToken = searchParams.get('pageToken')

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('📧 [GMAIL API] Authentication error:', authError?.message)
      return NextResponse.json(
        { error: 'Not authenticated', hint: 'Please sign in with Google' },
        { status: 401 }
      )
    }

    console.log('📧 [GMAIL API] User authenticated:', user.email)

    // Get Google tokens
    let accessToken: string | null = null
    let refreshToken: string | null = null

    // First, try to get from session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      accessToken = session.provider_token
      refreshToken = session.provider_refresh_token || null
      console.log('📧 [GMAIL API] Got token from session')
    }

    // If no session token, try user_settings
    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .select('google_access_token, google_refresh_token')
          .eq('user_id', user.id)
          .single()

        if (!settingsError && settings?.google_access_token) {
          accessToken = settings.google_access_token
          refreshToken = settings.google_refresh_token || null
          console.log('📧 [GMAIL API] Got token from user_settings')
        }
      }
    }

    if (!accessToken) {
      console.error('📧 [GMAIL API] No Google access token found')
      return NextResponse.json({
        error: 'No Google access token',
        hint: 'Sign out and sign back in with Google to grant Gmail permissions',
        requiresReauth: true,
      }, { status: 401 })
    }

    // Validate and refresh token if needed
    const tokenResult = await getValidGoogleToken(user.id, accessToken, refreshToken)

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('📧 [GMAIL API] Token validation failed:', errorResult.error)
      
      if (errorResult.requiresReauth) {
        return NextResponse.json({
          error: 'Gmail access expired',
          hint: 'Please sign out and sign back in with Google',
          requiresReauth: true,
        }, { status: 401 })
      }
      
      return NextResponse.json({ error: errorResult.error }, { status: 500 })
    }

    const validToken = tokenResult.accessToken
    console.log('📧 [GMAIL API] Token valid, expires in', tokenResult.expiresIn, 'seconds')

    // List messages
    const listUrl = new URL('https://www.googleapis.com/gmail/v1/users/me/messages')
    listUrl.searchParams.set('maxResults', maxResults.toString())
    listUrl.searchParams.set('q', query)
    if (pageToken) {
      listUrl.searchParams.set('pageToken', pageToken)
    }

    console.log('📧 [GMAIL API] Fetching messages with query:', query)

    const listResponse = await fetch(listUrl.toString(), {
      headers: {
        Authorization: `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!listResponse.ok) {
      const errorData = await listResponse.json()
      console.error('📧 [GMAIL API] Google API error:', {
        status: listResponse.status,
        error: errorData.error?.message,
        code: errorData.error?.code,
      })

      if (listResponse.status === 403) {
        return NextResponse.json({
          error: 'Gmail permission denied',
          hint: 'Please sign out and sign back in to grant Gmail permissions',
          googleError: errorData.error?.message,
          requiresReauth: true,
        }, { status: 403 })
      }

      return NextResponse.json({
        error: 'Failed to fetch Gmail messages',
        googleError: errorData.error?.message,
      }, { status: listResponse.status })
    }

    const listData = await listResponse.json()
    const messageIds = (listData.messages || []).map((m: any) => m.id)

    console.log(`📧 [GMAIL API] Found ${messageIds.length} messages, fetching details...`)

    // Fetch message details in parallel (limit concurrency)
    const BATCH_SIZE = 10
    const messages: GmailMessage[] = []
    
    for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
      const batch = messageIds.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map((id: string) => getMessageDetails(id, validToken))
      )
      messages.push(...batchResults.filter((m): m is GmailMessage => m !== null))
    }

    const duration = Date.now() - startTime
    console.log(`📧 [GMAIL API] Successfully fetched ${messages.length} messages in ${duration}ms`)

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
      nextPageToken: listData.nextPageToken || null,
      resultSizeEstimate: listData.resultSizeEstimate,
      fetchedAt: new Date().toISOString(),
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('📧 [GMAIL API] Unexpected error after', duration, 'ms:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch Gmail messages',
    }, { status: 500 })
  }
}


