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
    
    // Build TwiML with Media Streams for bidirectional audio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="${wsUrl}/api/voice/stream">
      <Parameter name="userId" value="${callContext.userId}" />
      <Parameter name="businessName" value="${callContext.businessName}" />
      <Parameter name="businessPhone" value="${callContext.businessPhone || ''}" />
      <Parameter name="userRequest" value="${callContext.userRequest}" />
      <Parameter name="category" value="${callContext.category}" />
      <Parameter name="userData" value="${JSON.stringify(callContext.userData || {}).replace(/"/g, '&quot;')}" />
    </Stream>
  </Start>
  <Say voice="alice">Hello, this is an AI assistant calling regarding ${callContext.userRequest}.</Say>
  <Pause length="30"/>
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



