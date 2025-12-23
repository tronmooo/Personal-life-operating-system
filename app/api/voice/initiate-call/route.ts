import { NextResponse } from 'next/server'
import { createTwilioService } from '@/lib/services/twilio-voice-service'
import { createServerClient } from '@/lib/supabase/server'

import { CallContext } from '@/lib/services/openai-voice-agent'
import { getPublicBaseUrl, getPublicWsBaseUrl } from '@/lib/utils/public-url'

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

    // #region agent log
    console.log('🔍 [DEBUG-B] initiate-call API called:', {phoneNumber, businessName, userRequest: userRequest?.substring(0,50)});
    // #endregion

    if (!phoneNumber || !businessName || !userRequest) {
      // #region agent log
      console.log('🔍 [DEBUG-B] Missing required fields:', {hasPhone:!!phoneNumber,hasBiz:!!businessName,hasReq:!!userRequest});
      // #endregion
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
    // #region agent log
    console.log('🔍 [DEBUG-C] Checking Twilio creds:', {hasSid:!!process.env.TWILIO_ACCOUNT_SID,hasToken:!!process.env.TWILIO_AUTH_TOKEN,hasPhone:!!process.env.TWILIO_PHONE_NUMBER});
    // #endregion
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // #region agent log
      console.log('🔍 [DEBUG-C] Missing Twilio creds - returning error');
      // #endregion
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

    // Create Twilio service using a public base URL so Twilio callbacks/WebSocket target the right domain
    // Check for tunnel URL passed from the initiate-calls route first
    const tunnelUrl = request.headers.get('x-tunnel-url')
    const publicBaseUrl = tunnelUrl || getPublicBaseUrl(request)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiate-call/route.ts:76',message:'Creating Twilio service',data:{tunnelUrl,publicBaseUrl,hasTunnelHeader:!!tunnelUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.log('🔍 [DEBUG-D] Creating Twilio service:', {publicBaseUrl, tunnelUrl, twilioPhone: process.env.TWILIO_PHONE_NUMBER});
    const twilioService = createTwilioService(publicBaseUrl)
    let call;
    try {
      call = await twilioService.makeCall({
        to: phoneNumber,
        businessName,
        userRequest,
        category: category || 'general',
        context
      })
      // #region agent log
      console.log('🔍 [DEBUG-C] Twilio call SUCCESS:', {callSid: call?.callSid, status: call?.status});
      // #endregion
    } catch (twilioErr: any) {
      // #region agent log
      console.log('🔍 [DEBUG-C] Twilio call FAILED:', {error: twilioErr?.message, code: twilioErr?.code});
      // #endregion
      throw twilioErr;
    }

    // Make sure we always return a full URL for the websocketEndpoint
    // This is critical for Twilio Media Streams
    const wsUrl = getPublicWsBaseUrl(request)
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



