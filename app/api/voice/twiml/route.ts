import { NextResponse } from 'next/server'
import { createTwilioService } from '@/lib/services/twilio-voice-service'
import { getPublicWsBaseUrl } from '@/lib/utils/public-url'

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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'twiml/route.ts:20',message:'TwiML route called',data:{urlOrigin:url.origin,hasCallContext:!!callContextParam,host:request.headers.get('host')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
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
    // Use separate voice server to avoid Next.js conflicts
    const voiceServerUrl = process.env.VOICE_SERVER_URL || 'wss://volunteer-lender-link-martha.trycloudflare.com'
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'twiml/route.ts:45',message:'Generating TwiML',data:{voiceServerUrl,businessName:callContext.businessName,userRequest:callContext.userRequest?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('🔗 TwiML WebSocket URL:', voiceServerUrl)
    
    // Build TwiML with Media Streams for bidirectional audio
    // Using Connect > Stream for true bidirectional audio (not Start > Stream)
    // The AI will handle the greeting via OpenAI Realtime API
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${voiceServerUrl}">
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



