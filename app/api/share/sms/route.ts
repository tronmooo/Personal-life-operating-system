import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import twilio from 'twilio'

export interface SendSMSRequest {
  to: string | string[]
  message: string
  include_link?: boolean
  share_link_id?: string
  document_urls?: string[]
}

export interface SendSMSResponse {
  success: boolean
  message: string
  sms_ids?: string[]
  failed?: string[]
}

/**
 * POST /api/share/sms
 * Send content/links via SMS using Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { 
          error: 'SMS service not configured',
          hint: 'Please configure Twilio credentials in environment variables'
        },
        { status: 500 }
      )
    }

    const body: SendSMSRequest = await request.json()
    
    if (!body.to || (Array.isArray(body.to) ? body.to.length === 0 : !body.to)) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      )
    }

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user info for context
    const { data: user } = await supabase.auth.getUser()
    const senderName = user.user?.user_metadata?.name || 'LifeHub User'

    // Get shared link if provided
    let shareUrl = ''
    if (body.share_link_id) {
      const { data: link } = await supabase
        .from('shared_links')
        .select('share_token')
        .eq('id', body.share_link_id)
        .eq('user_id', user.id)
        .single()

      if (link) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lifehub.app'
        shareUrl = `${baseUrl}/shared/${link.share_token}`
      }
    }

    // Build full message
    let fullMessage = body.message
    if (shareUrl && body.include_link !== false) {
      fullMessage += `\n\n🔗 View here: ${shareUrl}`
    }
    if (body.document_urls && body.document_urls.length > 0) {
      fullMessage += `\n\n📎 Documents:\n${body.document_urls.join('\n')}`
    }
    fullMessage += `\n\n— Sent via LifeHub by ${senderName}`

    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Send SMS to all recipients
    const recipients = Array.isArray(body.to) ? body.to : [body.to]
    const results: string[] = []
    const failed: string[] = []

    for (const recipient of recipients) {
      try {
        // Format phone number
        let formattedPhone = recipient.replace(/\D/g, '')
        if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
          formattedPhone = '1' + formattedPhone
        }
        formattedPhone = '+' + formattedPhone

        const sms = await client.messages.create({
          body: fullMessage,
          from: fromNumber,
          to: formattedPhone
        })

        console.log(`📱 SMS sent to ${formattedPhone}: ${sms.sid}`)
        results.push(sms.sid)
      } catch (smsError: any) {
        console.error(`❌ Failed to send SMS to ${recipient}:`, smsError.message)
        failed.push(recipient)
      }
    }

    // Log the share action (optional - don't fail if table doesn't exist)
    try {
      await supabase.from('share_analytics').insert({
        user_id: user.id,
        action: 'sms_sent',
        recipients: recipients.length,
        successful: results.length,
        share_link_id: body.share_link_id || null,
        metadata: {
          message_preview: body.message.substring(0, 100),
          has_link: !!shareUrl,
          has_documents: (body.document_urls?.length || 0) > 0
        }
      })
    } catch (analyticsError) {
      console.warn('Could not log analytics:', analyticsError)
    }

    const response: SendSMSResponse = {
      success: results.length > 0,
      message: failed.length > 0 
        ? `SMS sent to ${results.length} recipient(s), ${failed.length} failed`
        : `SMS sent successfully to ${results.length} recipient(s)`,
      sms_ids: results,
      failed: failed.length > 0 ? failed : undefined
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Exception in POST /api/share/sms:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}

