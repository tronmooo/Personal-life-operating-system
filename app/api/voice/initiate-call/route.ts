import { NextResponse } from 'next/server'
import { createTwilioService } from '@/lib/services/twilio-voice-service'
import { createServerClient } from '@/lib/supabase/server'

import { CallContext } from '@/lib/services/openai-voice-agent'

/**
 * POST /api/voice/initiate-call
 * 
 * Initiates a phone call to a business using Twilio + OpenAI Voice Agent
 */
export async function POST(request: Request) {
  try {
    const {
      phoneNumber,
      businessName,
      userRequest,
      category,
      userName,
      userLocation,
      userData
    } = await request.json()

    if (!phoneNumber || !businessName || !userRequest) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get authenticated user (optional for voice calls)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If no user, we can still proceed but track as guest
    const userId = user?.id || 'guest'

    // Check Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Voice calling not configured. Add Twilio credentials to environment variables.',
        simulation: true
      }, { status: 500 })
    }

    // Build call context for Realtime API
    const context: CallContext = {
      userId: userId,
      businessName,
      businessPhone: phoneNumber,
      userRequest,
      category: category || 'general',
      userLocation,
      userData: {
        name: userName,
        ...userData
      }
    }

    // Create Twilio service and make call with Realtime API support
    const twilioService = createTwilioService()
    const call = await twilioService.makeCall({
      to: phoneNumber,
      businessName,
      userRequest,
      category: category || 'general',
      context
    })

    // Make sure we always return a full URL for the websocketEndpoint
    // This is critical for Twilio Media Streams
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const wsUrl = appUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
    const websocketEndpoint = `${wsUrl}/api/voice/stream`

    console.log('✅ Call initiated successfully with Realtime API. SID:', call.callSid)

    return NextResponse.json({
      success: true,
      callId: call.callSid,
      callSid: call.callSid,
      status: call.status,
      message: 'Call initiated with OpenAI Realtime API',
      businessName,
      phoneNumber,
      realtimeEnabled: true,
      websocketEndpoint,
      call: {
        id: call.callSid,
        to: phoneNumber,
        businessName,
        status: call.status,
        startTime: call.startTime,
        transcript: [],
        agentType: 'realtime_speech_to_speech'
      }
    })

  } catch (error: any) {
    console.error('Error initiating call:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate call'
    }, { status: 500 })
  }
}



