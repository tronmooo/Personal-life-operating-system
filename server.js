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
  const wss = new WebSocketServer({ 
    server,
    path: '/api/voice/stream'
  })

  // Store active sessions
  const activeSessions = new Map()

  wss.on('connection', async (twilioWs) => {
    console.log('📞 New WebSocket connection from Twilio')
    
    let callSid = null
    let streamSid = null
    let openaiWs = null
    let context = {}
    let audioBuffer = []
    let isOpenAIReady = false

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
              description: 'Extract a price quote from the conversation',
              parameters: {
                type: 'object',
                properties: {
                  price: { type: 'number', description: 'The quoted price in dollars' },
                  currency: { type: 'string', default: 'USD' },
                  details: { type: 'string', description: 'Quote details' },
                  availability: { type: 'string', description: 'When available' }
                },
                required: ['price']
              }
            },
            {
              type: 'function',
              name: 'schedule_appointment',
              description: 'Schedule an appointment',
              parameters: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: 'Appointment date' },
                  time: { type: 'string', description: 'Appointment time' },
                  confirmationNumber: { type: 'string' }
                },
                required: ['date', 'time']
              }
            },
            {
              type: 'function',
              name: 'end_call',
              description: 'End the call when conversation is complete',
              parameters: {
                type: 'object',
                properties: {
                  reason: { type: 'string', description: 'Reason for ending' },
                  success: { type: 'boolean', description: 'Was the call successful' }
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
      const userName = ctx.userData?.name || 'a customer'

      return `You are a professional AI assistant calling ${businessName} on behalf of ${userName}.

PRIMARY OBJECTIVE: ${userRequest}

IMPORTANT INSTRUCTIONS:
1. Start by introducing yourself: "Hi, this is an AI assistant calling on behalf of ${userName}."
2. Clearly state the purpose: "${userRequest}"
3. Be polite, professional, and concise
4. Ask for a price quote if applicable
5. Ask about availability and timeline
6. Note any special offers or important details
7. Use the extract_quote function when you hear a price
8. Use schedule_appointment if you book something
9. Use end_call when the conversation is complete
10. Keep the call under 2-3 minutes

CONVERSATION TIPS:
- Listen carefully for prices, dates, and confirmation numbers
- If they can't help, politely thank them and end the call
- If voicemail, leave a brief message
- Be natural and conversational, not robotic

Begin the call now by introducing yourself.`
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
            }
            break

          case 'response.audio_transcript.done':
            console.log('') // New line after transcript
            break

          case 'conversation.item.input_audio_transcription.completed':
            // Human speech transcribed
            console.log(`👤 Human: ${event.transcript}`)
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
          console.log(`💰 Quote extracted: $${argsObj.price}`)
          result = { 
            success: true, 
            message: `Quote of $${argsObj.price} recorded successfully`,
            quote: argsObj 
          }
          // Save quote to session
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).quote = argsObj
          }
          break

        case 'schedule_appointment':
          console.log(`📅 Appointment: ${argsObj.date} at ${argsObj.time}`)
          result = { 
            success: true, 
            message: `Appointment scheduled for ${argsObj.date} at ${argsObj.time}`,
            appointment: argsObj 
          }
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).appointment = argsObj
          }
          break

        case 'end_call':
          console.log(`📞 Call ending: ${argsObj.reason} (success: ${argsObj.success})`)
          result = { success: true, message: 'Call ended' }
          if (activeSessions.has(callSid)) {
            activeSessions.get(callSid).endReason = argsObj
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

    twilioWs.on('close', () => {
      if (callSid) {
        activeSessions.delete(callSid)
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
