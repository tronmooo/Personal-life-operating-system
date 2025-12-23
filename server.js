/**
 * Custom Node.js Server with WebSocket Support
 * Bridges Twilio Media Streams to OpenAI Realtime API for voice conversations
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer, WebSocket } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log('🚀 Initializing LifeHub AI Concierge Server...')

// Audio format conversion utilities
// Twilio sends μ-law 8kHz, OpenAI Realtime expects PCM16 24kHz
const MULAW_TO_LINEAR = new Int16Array(256)
for (let i = 0; i < 256; i++) {
  let u = ~i & 0xFF
  const sign = (u & 0x80) ? -1 : 1
  const exponent = (u >> 4) & 0x07
  const mantissa = u & 0x0F
  let sample = ((mantissa << 3) + 0x84) << exponent
  sample = sign * (sample - 0x84)
  MULAW_TO_LINEAR[i] = sample
}

function mulawToLinear(mulawBuffer) {
  const samples = new Int16Array(mulawBuffer.length)
  for (let i = 0; i < mulawBuffer.length; i++) {
    samples[i] = MULAW_TO_LINEAR[mulawBuffer[i]]
  }
  return Buffer.from(samples.buffer)
}

function linearToMulaw(pcmBuffer) {
  const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2)
  const mulaw = Buffer.alloc(samples.length)
  
  for (let i = 0; i < samples.length; i++) {
    let sample = samples[i]
    const sign = (sample < 0) ? 0x80 : 0x00
    if (sign) sample = -sample
    if (sample > 32635) sample = 32635
    sample += 0x84
    
    let exponent = 7
    for (let exp = 0; exp < 8; exp++) {
      if (sample < (1 << (exp + 8))) {
        exponent = exp
        break
      }
    }
    
    const mantissa = (sample >> (exponent + 3)) & 0x0F
    mulaw[i] = ~(sign | (exponent << 4) | mantissa) & 0xFF
  }
  
  return mulaw
}

// Simple resampler (8kHz to 24kHz = 3x, 24kHz to 8kHz = 1/3)
function resample8kTo24k(buffer8k) {
  const input = new Int16Array(buffer8k.buffer, buffer8k.byteOffset, buffer8k.length / 2)
  const output = new Int16Array(input.length * 3)
  
  for (let i = 0; i < input.length; i++) {
    const idx = i * 3
    output[idx] = input[i]
    if (i < input.length - 1) {
      output[idx + 1] = Math.round((input[i] * 2 + input[i + 1]) / 3)
      output[idx + 2] = Math.round((input[i] + input[i + 1] * 2) / 3)
    } else {
      output[idx + 1] = input[i]
      output[idx + 2] = input[i]
    }
  }
  
  return Buffer.from(output.buffer)
}

function resample24kTo8k(buffer24k) {
  const input = new Int16Array(buffer24k.buffer, buffer24k.byteOffset, buffer24k.length / 2)
  const output = new Int16Array(Math.floor(input.length / 3))
  
  for (let i = 0; i < output.length; i++) {
    output[i] = input[i * 3]
  }
  
  return Buffer.from(output.buffer)
}

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create WebSocket server for Twilio Media Streams
  // Using noServer mode to handle upgrades manually before Next.js
  const wss = new WebSocketServer({ 
    noServer: true,
  })

  // Handle WebSocket upgrade BEFORE Next.js processes it
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true)
    
    if (pathname === '/api/voice/stream') {
      console.log('🔌 Handling WebSocket upgrade for /api/voice/stream')
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      // Let Next.js handle other WebSocket upgrades (like HMR)
      // Don't destroy the socket - Next.js dev server needs it
      console.log(`📡 Non-voice WebSocket request: ${pathname}`)
    }
  })

  // Store active sessions (local for this server.js runtime)
  const activeSessions = new Map()
  // Mirror state to a shared in-memory store so Next.js route handlers can read it
  // (e.g. GET /api/voice/status?callSid=... for live transcript + quote)
  const voiceSessionStore = require('./lib/services/voice-session-store')

  wss.on('connection', async (twilioWs, request) => {
    console.log('📞 New WebSocket connection from Twilio')
    console.log(`   ReadyState: ${twilioWs.readyState}`)
    console.log(`   URL: ${request?.url || 'unknown'}`)
    
    let callSid = null
    let streamSid = null
    let openaiWs = null
    let context = {}
    let audioBuffer = []
    let isOpenAIReady = false
    let aiUtteranceBuffer = ''

    // Connect to OpenAI Realtime API
    async function connectToOpenAI() {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY
      if (!OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY not configured!')
        return null
      }

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(
          'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'realtime=v1'
            }
          }
        )

        ws.on('open', () => {
          console.log('✅ Connected to OpenAI Realtime API')
          resolve(ws)
        })

        ws.on('error', (error) => {
          console.error('❌ OpenAI WebSocket error:', error.message)
          reject(error)
        })

        // Set timeout for connection
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close()
            reject(new Error('OpenAI connection timeout'))
          }
        }, 10000)
      })
    }

    // Initialize OpenAI session with context
    function initializeOpenAISession() {
      if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return

      const systemPrompt = buildSystemPrompt(context)

      // Configure the session
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: systemPrompt,
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          tools: [
            {
              type: 'function',
              name: 'extract_quote',
              description: 'Extract price and order details from the conversation. Call this when you hear a price or get order information.',
              parameters: {
                type: 'object',
                properties: {
                  price: { type: 'number', description: 'The total price in dollars' },
                  item: { type: 'string', description: 'What was ordered or quoted (e.g., "large cheese pizza", "oil change")' },
                  waitTime: { type: 'string', description: 'How long until ready (e.g., "20 minutes", "1 hour")' },
                  businessName: { type: 'string', description: 'Name of the business' },
                  notes: { type: 'string', description: 'Any other important details' }
                },
                required: ['price', 'item']
              }
            },
            {
              type: 'function',
              name: 'schedule_appointment',
              description: 'Record an appointment or reservation',
              parameters: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: 'Appointment date' },
                  time: { type: 'string', description: 'Appointment time' },
                  service: { type: 'string', description: 'What service or appointment type' },
                  confirmationNumber: { type: 'string' }
                },
                required: ['date', 'time']
              }
            },
            {
              type: 'function',
              name: 'end_call',
              description: 'End the call when you have the information needed',
              parameters: {
                type: 'object',
                properties: {
                  reason: { type: 'string', description: 'Brief reason for ending' },
                  success: { type: 'boolean', description: 'Did we get the information we needed?' },
                  nextStep: { type: 'string', description: 'What should happen next (e.g., "confirm order", "schedule appointment", "compare quotes")' }
                },
                required: ['reason', 'success']
              }
            }
          ],
          tool_choice: 'auto'
        }
      }

      openaiWs.send(JSON.stringify(sessionConfig))
      console.log('📝 OpenAI session configured with context')
    }

    // Build system prompt from context
    function buildSystemPrompt(ctx) {
      const businessName = ctx.businessName || 'the business'
      const userRequest = ctx.userRequest || 'inquiring about services'
      const userName = ctx.userData?.name || 'Robert'
      const category = ctx.category || 'general'

      return `You are ${userName}'s personal assistant making a phone call to ${businessName}.

CRITICAL: You are a HUMAN assistant, NOT an AI. Never mention AI, robots, or automation. Act completely natural like a real person calling.

YOUR TASK: ${userRequest}

HOW TO START THE CALL:
- When they answer, say something natural like: "Hi! I'd like to ${userRequest.toLowerCase()}"
- If it's a food order: "Hi, I'd like to place an order for pickup please"
- If asking for a quote: "Hi, I'm looking to get a price on..."
- Keep it casual and direct

CONVERSATION RULES:
1. Be friendly, casual, and efficient - like a real person
2. Get to the point quickly - don't waste their time
3. Listen carefully for prices, wait times, totals
4. When you hear a price, use extract_quote to record it
5. DO NOT confirm orders yet - just get the information
6. Say "Let me check with ${userName} and call right back to confirm"
7. Thank them and end the call politely

EXAMPLE PIZZA ORDER:
You: "Hi, I'd like to order a large cheese pizza for pickup"
Them: "Sure, that'll be $15.99, ready in 20 minutes"
You: "Great! Let me confirm with my friend and call right back. Thanks!"
[Use extract_quote with price: 15.99, details: "large cheese pizza, 20 min pickup"]
[Use end_call with success: true]

EXAMPLE QUOTE REQUEST:
You: "Hi, I'm looking to get my oil changed. What's your price?"
Them: "We charge $39.99 for a basic oil change"
You: "Perfect, thanks! I'll call back to schedule. Appreciate it!"
[Use extract_quote]
[Use end_call]

VOICE STYLE:
- Casual, warm, friendly
- Use contractions (I'd, that's, I'll)
- Brief responses
- Sound like you're in a slight hurry (busy but polite)

Start the conversation NOW when they answer.`
    }

    // Handle messages from OpenAI
    function handleOpenAIMessage(data) {
      try {
        const event = JSON.parse(data.toString())
        
        switch (event.type) {
          case 'session.created':
            console.log('🎙️ OpenAI session created')
            isOpenAIReady = true
            initializeOpenAISession()
            break

          case 'session.updated':
            console.log('✅ OpenAI session updated, ready for audio')
            // Flush any buffered audio
            if (audioBuffer.length > 0) {
              const combined = Buffer.concat(audioBuffer)
              audioBuffer = []
              sendAudioToOpenAI(combined)
            }
            break

          case 'response.audio.delta':
            // Received audio from OpenAI - send to Twilio
            if (event.delta && streamSid) {
              const audioData = Buffer.from(event.delta, 'base64')
              // Convert PCM16 24kHz to μ-law 8kHz for Twilio
              const resampled = resample24kTo8k(audioData)
              const mulaw = linearToMulaw(resampled)
              
              twilioWs.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: mulaw.toString('base64')
                }
              }))
            }
            break

          case 'response.audio_transcript.delta':
            // AI is speaking - log it
            if (event.delta) {
              process.stdout.write(`🤖 AI: ${event.delta}`)
              aiUtteranceBuffer += event.delta
            }
            break

          case 'response.audio_transcript.done':
            console.log('') // New line after transcript
            if (callSid && aiUtteranceBuffer.trim().length > 0) {
              const msg = aiUtteranceBuffer.trim()
              aiUtteranceBuffer = ''
              // Persist for UI polling
              voiceSessionStore.appendTranscript(callSid, {
                speaker: 'ai',
                message: msg,
                timestamp: new Date().toISOString()
              })
              // Keep local copy for summaries/debugging
              if (activeSessions.has(callSid)) {
                activeSessions.get(callSid).transcript.push({
                  speaker: 'ai',
                  message: msg,
                  timestamp: new Date()
                })
              }
            }
            break

          case 'conversation.item.input_audio_transcription.completed':
            // Human speech transcribed
            console.log(`👤 Human: ${event.transcript}`)
            if (callSid && event.transcript && String(event.transcript).trim().length > 0) {
              const msg = String(event.transcript).trim()
              voiceSessionStore.appendTranscript(callSid, {
                speaker: 'human',
                message: msg,
                timestamp: new Date().toISOString()
              })
              if (activeSessions.has(callSid)) {
                activeSessions.get(callSid).transcript.push({
                  speaker: 'human',
                  message: msg,
                  timestamp: new Date()
                })
              }
            }
            break

          case 'response.function_call_arguments.done':
            // Function call completed
            handleFunctionCall(event)
            break

          case 'response.done':
            console.log('📨 Response complete')
            break

          case 'error':
            console.error('❌ OpenAI error:', event.error)
            break

          default:
            // Log other events for debugging
            if (event.type && !event.type.includes('delta')) {
              console.log(`📩 OpenAI event: ${event.type}`)
            }
        }
      } catch (error) {
        console.error('Error parsing OpenAI message:', error)
      }
    }

    // Handle function calls from OpenAI
    function handleFunctionCall(event) {
      const { name, call_id, arguments: args } = event
      let argsObj = {}
      
      try {
        argsObj = JSON.parse(args)
      } catch (e) {
        console.error('Error parsing function arguments:', e)
      }

      console.log(`🔧 Function call: ${name}`, argsObj)

      let result = { success: true }

      switch (name) {
        case 'extract_quote':
          console.log('\n' + '═'.repeat(50))
          console.log('💰 QUOTE/ORDER DETAILS RECEIVED!')
          console.log('═'.repeat(50))
          console.log(`   📦 Item: ${argsObj.item || 'N/A'}`)
          console.log(`   💵 Price: $${argsObj.price}`)
          if (argsObj.waitTime) console.log(`   ⏱️  Ready in: ${argsObj.waitTime}`)
          if (argsObj.businessName) console.log(`   🏪 From: ${argsObj.businessName}`)
          if (argsObj.notes) console.log(`   📝 Notes: ${argsObj.notes}`)
          console.log('═'.repeat(50))
          console.log('📱 AWAITING YOUR CONFIRMATION TO PROCEED')
          console.log('═'.repeat(50) + '\n')
          
          result = { 
            success: true, 
            message: `Got it! ${argsObj.item} for $${argsObj.price}. Tell the user to confirm.`,
            quote: argsObj,
            needsConfirmation: true
          }
          // Save quote to session for UI to display
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).quote = argsObj
            activeSessions.get(callSid).needsConfirmation = true
          }
          if (callSid) {
            voiceSessionStore.upsertSession(callSid, { 
              quote: argsObj,
              needsConfirmation: true,
              confirmationType: 'order'
            })
          }
          break

        case 'schedule_appointment':
          console.log('\n' + '═'.repeat(50))
          console.log('📅 APPOINTMENT DETAILS RECEIVED!')
          console.log('═'.repeat(50))
          console.log(`   📆 Date: ${argsObj.date}`)
          console.log(`   🕐 Time: ${argsObj.time}`)
          if (argsObj.service) console.log(`   🔧 Service: ${argsObj.service}`)
          if (argsObj.confirmationNumber) console.log(`   🔢 Confirmation: ${argsObj.confirmationNumber}`)
          console.log('═'.repeat(50) + '\n')
          
          result = { 
            success: true, 
            message: `Appointment noted for ${argsObj.date} at ${argsObj.time}`,
            appointment: argsObj 
          }
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).appointment = argsObj
          }
          if (callSid) {
            voiceSessionStore.upsertSession(callSid, { appointment: argsObj })
          }
          break

        case 'end_call':
          console.log(`📞 Call ending: ${argsObj.reason} (success: ${argsObj.success})`)
          result = { success: true, message: 'Call ended' }
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).endReason = argsObj
          }
          if (callSid) {
            voiceSessionStore.upsertSession(callSid, { endReason: argsObj })
          }
          // Close connections gracefully after a short delay
          setTimeout(() => {
            if (openaiWs) openaiWs.close()
            twilioWs.close()
          }, 2000)
          break
      }

      // Send function result back to OpenAI
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify(result)
          }
        }))

        // Trigger response continuation
        openaiWs.send(JSON.stringify({
          type: 'response.create'
        }))
      }
    }

    // Send audio to OpenAI
    function sendAudioToOpenAI(mulawBuffer) {
      if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN || !isOpenAIReady) {
        // Buffer audio if not ready
        audioBuffer.push(mulawBuffer)
        return
      }

      // Convert μ-law 8kHz to PCM16 24kHz for OpenAI
      const pcm = mulawToLinear(mulawBuffer)
      const resampled = resample8kTo24k(pcm)
      
      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: resampled.toString('base64')
      }))
    }

    // Handle Twilio WebSocket messages
    twilioWs.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        
        switch (message.event) {
          case 'connected':
            console.log('🔌 Twilio Media Stream connected')
            break

          case 'start':
            callSid = message.start.callSid
            streamSid = message.start.streamSid
            
            // Extract context from custom parameters (URL-decoded)
            const params = message.start.customParameters || {}
            context = {
              userId: params.userId || '',
              businessName: decodeURIComponent(params.businessName || 'Business'),
              businessPhone: params.businessPhone || '',
              userRequest: decodeURIComponent(params.userRequest || 'inquiring about services'),
              category: params.category || 'general',
              userData: {}
            }

            try {
              if (params.userData) {
                context.userData = JSON.parse(decodeURIComponent(params.userData))
              }
            } catch (e) {
              console.warn('Failed to parse userData:', e.message)
            }

            activeSessions.set(callSid, {
              streamSid,
              startTime: new Date(),
              context,
              transcript: []
            })
            voiceSessionStore.upsertSession(callSid, {
              callSid,
              streamSid,
              status: 'in-progress',
              startTime: new Date().toISOString(),
              context,
              transcript: []
            })
            
            console.log('▶️ Stream started:', {
              callSid,
              streamSid,
              business: context.businessName,
              request: context.userRequest
            })

            // Connect to OpenAI
            try {
              openaiWs = await connectToOpenAI()
              
              if (openaiWs) {
                openaiWs.on('message', handleOpenAIMessage)
                openaiWs.on('close', () => {
                  console.log('🔌 OpenAI connection closed')
                  openaiWs = null
                })
                openaiWs.on('error', (err) => {
                  console.error('❌ OpenAI error:', err.message)
                })
              }
            } catch (error) {
              console.error('❌ Failed to connect to OpenAI:', error.message)
            }
            break

          case 'media':
            // Audio data received from Twilio
            if (message.media && message.media.payload) {
              const audioData = Buffer.from(message.media.payload, 'base64')
              sendAudioToOpenAI(audioData)
            }
            break

          case 'stop':
            console.log('⏹️ Stream stopped:', streamSid)
            
            // Log session summary
            const session = activeSessions.get(callSid)
            if (session) {
              const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000)
              console.log('📊 Call Summary:', {
                duration: `${duration}s`,
                business: context.businessName,
                quote: session.quote || 'none',
                appointment: session.appointment || 'none'
              })
            }
            if (callSid) {
              voiceSessionStore.endSession(callSid, { status: 'completed' })
            }
            activeSessions.delete(callSid)
            if (openaiWs) {
              openaiWs.close()
              openaiWs = null
            }
            break
        }
      } catch (error) {
        console.error('❌ Error handling Twilio message:', error)
      }
    })

    twilioWs.on('close', (code, reason) => {
      console.log(`🔌 Twilio WebSocket closed. Code: ${code}, Reason: ${reason || 'none'}`)
      if (callSid) {
        activeSessions.delete(callSid)
        voiceSessionStore.endSession(callSid, { status: 'completed' })
      }
      if (openaiWs) {
        openaiWs.close()
        openaiWs = null
      }
      console.log('🔌 Twilio WebSocket connection closed')
    })

    twilioWs.on('error', (error) => {
      console.error('❌ Twilio WebSocket error:', error)
    })
  })

  console.log('🎙️ WebSocket server initialized for Twilio Media Streams')

  // Start server
  server.listen(port, (err) => {
    if (err) throw err
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ LifeHub AI Concierge Server Ready!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🌐 Web:       http://${hostname}:${port}`)
    console.log(`🔌 WebSocket: ws://${hostname}:${port}/api/voice/stream`)
    console.log(`📊 Sessions:  ${activeSessions.size}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🎯 Required Environment Variables:')
    console.log('   - OPENAI_API_KEY: ' + (process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'))
    console.log('   - TWILIO_ACCOUNT_SID: ' + (process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'))
    console.log('   - TWILIO_AUTH_TOKEN: ' + (process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'))
    console.log('   - TWILIO_PHONE_NUMBER: ' + (process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'))
    console.log('   - NEXT_PUBLIC_APP_URL: ' + (process.env.NEXT_PUBLIC_APP_URL || 'Not set (using localhost)'))
    console.log('   - GOOGLE_PLACES_API_KEY: ' + (process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? '✅ Set' : '⚠️ Optional'))
    console.log('')
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server')
    server.close(() => {
      console.log('Server closed')
    })
  })
})
