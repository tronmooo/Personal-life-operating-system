import { NextResponse } from 'next/server'
import { createTwilioService } from '@/lib/services/twilio-voice-service'

/**
 * GET/POST /api/voice/twiml
 * 
 * Generates TwiML instructions for Twilio calls
 */
export async function GET(request: Request) {
  return handleTwiML(request)
}

export async function POST(request: Request) {
  return handleTwiML(request)
}

async function handleTwiML(request: Request) {
  try {
    const url = new URL(request.url)
    const callContextParam = url.searchParams.get('callContext')
    
    let callContext = {
      businessName: 'Business',
      businessPhone: '',
      userRequest: 'inquiring about services',
      category: 'general',
      userId: '',
      userData: {}
    }

    if (callContextParam) {
      try {
        callContext = JSON.parse(decodeURIComponent(callContextParam))
      } catch (e) {
        console.error('Error parsing callContext:', e)
      }
    }

    // Generate TwiML with WebSocket streaming for Realtime API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const wsUrl = appUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    
    console.log('🔗 TwiML WebSocket URL:', `${wsUrl}/api/voice/stream`)
    
    // Build TwiML with Media Streams for bidirectional audio
    // Using Connect > Stream for true bidirectional audio (not Start > Stream)
    // The AI will handle the greeting via OpenAI Realtime API
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}/api/voice/stream">
      <Parameter name="userId" value="${callContext.userId}" />
      <Parameter name="businessName" value="${encodeURIComponent(callContext.businessName)}" />
      <Parameter name="businessPhone" value="${callContext.businessPhone || ''}" />
      <Parameter name="userRequest" value="${encodeURIComponent(callContext.userRequest)}" />
      <Parameter name="category" value="${callContext.category}" />
      <Parameter name="userData" value="${encodeURIComponent(JSON.stringify(callContext.userData || {}))}" />
    </Stream>
  </Connect>
</Response>`

    // Return TwiML response
    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })

  } catch (error) {
    console.error('Error generating TwiML:', error)
    
    // Return basic TwiML on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your call.</Say>
  <Hangup/>
</Response>`

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })
  }
}



