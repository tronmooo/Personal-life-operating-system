import { NextResponse } from 'next/server'
import { createTwilioService } from '@/lib/services/twilio-voice-service'
import { createHmac, timingSafeEqual } from 'crypto'
import voiceSessionStore from '@/lib/services/voice-session-store'

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''

/**
 * Verify Twilio webhook signature
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  try {
    // If no auth token is configured, log warning but allow (for development)
    if (!TWILIO_AUTH_TOKEN) {
      console.warn('⚠️  WARNING: TWILIO_AUTH_TOKEN not set - webhook signature verification disabled')
      console.warn('⚠️  This is a SECURITY RISK in production!')
      return true // Allow in development, but log warning
    }

    // Sort parameters alphabetically and concatenate
    const sortedKeys = Object.keys(params).sort()
    let data = url
    for (const key of sortedKeys) {
      data += key + params[key]
    }

    // Compute HMAC-SHA1
    const expectedSignature = createHmac('sha1', TWILIO_AUTH_TOKEN)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64')

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('❌ Twilio signature verification error:', error)
    return false
  }
}

/**
 * POST /api/voice/status
 * 
 * Handles Twilio call status callbacks
 */
export async function POST(request: Request) {
  try {
    const url = request.url
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const formData = await request.formData()
    
    // Convert FormData to params object for signature verification
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value as string
    })

    // 🚨 SECURITY: Verify Twilio signature
    if (!verifyTwilioSignature(url, params, twilioSignature)) {
      console.error('❌ Unauthorized Twilio webhook - invalid signature')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const callDuration = formData.get('CallDuration') as string
    const answeredBy = formData.get('AnsweredBy') as string

    console.log('📞 Call Status Update:')
    console.log('  ✅ Signature verified')
    console.log('  SID:', callSid)
    console.log('  Status:', callStatus)
    console.log('  Duration:', callDuration)
    console.log('  Answered By:', answeredBy)

    // Map Twilio status to our status
    let status: any = callStatus
    if (callStatus === 'busy') status = 'busy'
    else if (callStatus === 'no-answer' || callStatus === 'canceled') status = 'no-answer'
    else if (callStatus === 'failed') status = 'failed'
    else if (callStatus === 'completed') status = 'completed'
    else if (callStatus === 'in-progress') status = 'in-progress'
    else if (callStatus === 'ringing') status = 'ringing'
    else if (callStatus === 'queued') status = 'queued'

    // Handle voicemail detection
    if (answeredBy === 'machine_end_beep' || answeredBy === 'machine_end_silence') {
      status = 'no-answer' // Treat voicemail as no-answer
      console.log('  ⚠️ Voicemail detected')
    }

    // Update call status
    const twilioService = createTwilioService()
    await twilioService.updateCallStatus(
      callSid,
      status,
      callDuration ? parseInt(callDuration) : undefined
    )

    // Mirror status into shared session store for UI polling
    if (callSid) {
      voiceSessionStore.setStatus(callSid, status)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error handling status callback:', error)
    // Still return 200 to prevent Twilio from retrying
    return NextResponse.json({ success: true })
  }
}

// Allow GET for webhook verification
export async function GET(request: Request) {
  const url = new URL(request.url)
  const callSid = url.searchParams.get('callSid') || ''

  // If a callSid is provided, return live session info for UI polling
  if (callSid) {
    const session = voiceSessionStore.getSession(callSid)
    if (!session) {
      return NextResponse.json({
        success: true,
        callSid,
        status: 'unknown',
        transcript: [],
        quote: null,
        appointment: null,
        endReason: null
      })
    }

    return NextResponse.json({
      success: true,
      callSid,
      status: session.status || 'in-progress',
      transcript: session.transcript || [],
      quote: session.quote || null,
      appointment: session.appointment || null,
      endReason: session.endReason || null,
      startTime: session.startTime,
      endTime: session.endTime,
      context: session.context
    })
  }

  return NextResponse.json({
    status: 'Voice status webhook active',
    timestamp: new Date().toISOString()
  })
}



