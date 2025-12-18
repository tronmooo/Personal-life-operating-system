/**
 * POST /api/gmail/send
 * Send an email via Gmail API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { GmailParser } from '@/lib/integrations/gmail-parser'
import type { ComposeEmailRequest } from '@/lib/types/email-types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the session to access provider token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please sign in with Google and grant email permissions.' },
        { status: 401 }
      )
    }

    const body: ComposeEmailRequest = await request.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    // Initialize Gmail parser with access token
    const gmailParser = new GmailParser(session.provider_token)

    // Send the email
    const result = await gmailParser.sendEmail(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the sent email for audit purposes (optional)
    console.log(`📧 Email sent by ${user.email} to ${body.to}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      message: 'Email sent successfully'
    })
  } catch (error: any) {
    console.error('Exception in POST /api/gmail/send:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}







