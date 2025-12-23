/**
 * Standalone Voice WebSocket Server
 * Runs separately from Next.js to avoid dev server conflicts
 */

const { WebSocketServer, WebSocket } = require('ws')
const { createServer } = require('http')
require('dotenv').config({ path: '.env.local' })

const VOICE_PORT = 3001

// Audio conversion utilities (Twilio μ-law 8kHz <-> OpenAI PCM16 24kHz)
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

// Create HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', sessions: activeSessions.size }))
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer })
const activeSessions = new Map()

console.log('🎙️ Starting Voice WebSocket Server...')

wss.on('connection', async (twilioWs, request) => {
  console.log('📞 New Twilio WebSocket connection')
  
  let callSid = null
  let streamSid = null
  let openaiWs = null
  let context = {}
  let audioBuffer = []
  let isOpenAIReady = false

  // Build system prompt - handles various service types dynamically
  function buildSystemPrompt(ctx) {
    const businessName = ctx.businessName || 'the business'
    const userRequest = ctx.userRequest || 'inquiring about services'
    const userName = ctx.userData?.name || 'Robert Sennabaum'
    const category = ctx.category || 'general'

    // Detect what type of request this is
    const requestLower = userRequest.toLowerCase()
    
    let openingLine = "Hi, I'm calling to get some information."
    let specificTask = userRequest
    
    // Food orders
    if (requestLower.includes('pizza') || requestLower.includes('order') || requestLower.includes('food')) {
      openingLine = "Hi, I'd like to place an order for pickup please."
    }
    // Auto services
    else if (requestLower.includes('oil change') || requestLower.includes('tire') || requestLower.includes('brake') || requestLower.includes('auto') || requestLower.includes('car')) {
      openingLine = "Hi, I'm calling to get a price quote on some auto services."
    }
    // Home services  
    else if (requestLower.includes('plumb') || requestLower.includes('electric') || requestLower.includes('hvac') || requestLower.includes('repair')) {
      openingLine = "Hi, I'm looking to get an estimate for some work."
    }
    // Appointments
    else if (requestLower.includes('appointment') || requestLower.includes('schedule') || requestLower.includes('book')) {
      openingLine = "Hi, I'd like to schedule an appointment please."
    }
    // Price quotes
    else if (requestLower.includes('price') || requestLower.includes('cost') || requestLower.includes('quote') || requestLower.includes('estimate')) {
      openingLine = "Hi, I'm calling to get a price quote."
    }

    return `You are ${userName}'s personal assistant making a phone call to ${businessName}.

YOUR NAME: ${userName}
BUSINESS: ${businessName}

YOUR TASK: ${userRequest}

HOW TO START THE CALL:
Say: "${openingLine}"
Then explain: "${specificTask}"

RULES:
1. Be friendly and polite - you're a real person, not a robot
2. Get straight to the point - don't waste their time
3. When they ask for your name, say: "${userName}"
4. Listen carefully for prices, times, and availability
5. When you get the information you need, say "Perfect, thank you so much!"
6. Use extract_quote to record any prices or quotes mentioned
7. Then use end_call to hang up

VOICE STYLE:
- Use contractions (I'd, that's, I'll)
- Say please and thank you
- Be concise but warm
- Don't over-explain

Start the call now by greeting them.`
  }

  // Connect to OpenAI Realtime
  async function connectToOpenAI() {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not set!')
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
        console.error('❌ OpenAI error:', error.message)
        reject(error)
      })

      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          reject(new Error('OpenAI connection timeout'))
        }
      }, 10000)
    })
  }

  // Initialize OpenAI session
  function initializeOpenAISession() {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: buildSystemPrompt(context),
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
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
            description: 'Record any price, quote, or cost mentioned during the call',
            parameters: {
              type: 'object',
              properties: {
                price: { type: 'number', description: 'Price or cost in dollars' },
                item: { type: 'string', description: 'Service or item being quoted' },
                waitTime: { type: 'string', description: 'How long until ready/available' },
                notes: { type: 'string', description: 'Any additional details' }
              },
              required: ['price', 'item']
            }
          },
          {
            type: 'function',
            name: 'schedule_appointment',
            description: 'Record appointment details when one is scheduled',
            parameters: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'Date of appointment' },
                time: { type: 'string', description: 'Time of appointment' },
                service: { type: 'string', description: 'Service being scheduled' },
                confirmationNumber: { type: 'string', description: 'Confirmation or reference number if given' }
              },
              required: ['date', 'service']
            }
          },
          {
            type: 'function',
            name: 'end_call',
            description: 'End the call after task is complete',
            parameters: {
              type: 'object',
              properties: {
                reason: { type: 'string', description: 'Why the call ended' },
                success: { type: 'boolean', description: 'Was the task successful' },
                summary: { type: 'string', description: 'Brief summary of what was accomplished' }
              },
              required: ['reason', 'success']
            }
          }
        ],
        tool_choice: 'auto'
      }
    }

    openaiWs.send(JSON.stringify(sessionConfig))
    console.log('📝 OpenAI session configured')
  }

  // Send audio to OpenAI
  function sendAudioToOpenAI(audioData) {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN || !isOpenAIReady) return
    
    // Convert μ-law 8kHz to PCM16 24kHz
    const pcm8k = mulawToLinear(audioData)
    const pcm24k = resample8kTo24k(pcm8k)
    
    openaiWs.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: pcm24k.toString('base64')
    }))
  }

  // Handle OpenAI messages
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
          console.log('✅ OpenAI ready for audio')
          if (audioBuffer.length > 0) {
            const combined = Buffer.concat(audioBuffer)
            audioBuffer = []
            sendAudioToOpenAI(combined)
          }
          break

        case 'response.audio.delta':
          if (event.delta && twilioWs.readyState === WebSocket.OPEN) {
            const pcm24k = Buffer.from(event.delta, 'base64')
            const pcm8k = resample24kTo8k(pcm24k)
            const mulaw = linearToMulaw(pcm8k)
            
            twilioWs.send(JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: { payload: mulaw.toString('base64') }
            }))
          }
          break

        case 'response.audio_transcript.delta':
          if (event.delta) process.stdout.write(`🤖 AI: ${event.delta}`)
          break

        case 'response.audio_transcript.done':
          console.log('')
          break

        case 'conversation.item.input_audio_transcription.completed':
          console.log(`👤 Human: ${event.transcript}`)
          break

        case 'response.function_call_arguments.done':
          const { name, arguments: args } = event
          let argsObj = {}
          try { argsObj = JSON.parse(args) } catch (e) {}
          
          console.log(`\n🔧 Function: ${name}`, argsObj)
          
          if (name === 'extract_quote') {
            console.log('\n' + '═'.repeat(50))
            console.log('💰 QUOTE RECEIVED!')
            console.log(`   📦 Item: ${argsObj.item}`)
            console.log(`   💵 Price: $${argsObj.price}`)
            if (argsObj.waitTime) console.log(`   ⏱️  Ready: ${argsObj.waitTime}`)
            if (argsObj.notes) console.log(`   📝 Notes: ${argsObj.notes}`)
            console.log('═'.repeat(50) + '\n')
            
            // Store quote in session
            if (callSid && activeSessions.has(callSid)) {
              activeSessions.get(callSid).quote = argsObj
            }
          }
          
          if (name === 'schedule_appointment') {
            console.log('\n' + '═'.repeat(50))
            console.log('📅 APPOINTMENT SCHEDULED!')
            console.log(`   🔧 Service: ${argsObj.service}`)
            console.log(`   📆 Date: ${argsObj.date}`)
            if (argsObj.time) console.log(`   🕐 Time: ${argsObj.time}`)
            if (argsObj.confirmationNumber) console.log(`   🎫 Confirmation: ${argsObj.confirmationNumber}`)
            console.log('═'.repeat(50) + '\n')
            
            // Store appointment in session
            if (callSid && activeSessions.has(callSid)) {
              activeSessions.get(callSid).appointment = argsObj
            }
          }
          
          if (name === 'end_call') {
            console.log('\n' + '═'.repeat(50))
            console.log(argsObj.success ? '✅ CALL COMPLETED SUCCESSFULLY' : '❌ CALL ENDED')
            console.log(`   📋 Reason: ${argsObj.reason}`)
            if (argsObj.summary) console.log(`   📝 Summary: ${argsObj.summary}`)
            console.log('═'.repeat(50) + '\n')
          }
          
          // Send function result back
          openaiWs.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: JSON.stringify({ success: true })
            }
          }))
          openaiWs.send(JSON.stringify({ type: 'response.create' }))
          break

        case 'error':
          console.error('❌ OpenAI error:', event.error)
          break
      }
    } catch (error) {
      console.error('Error handling OpenAI message:', error)
    }
  }

  // Handle Twilio messages
  twilioWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      switch (message.event) {
        case 'connected':
          console.log('🔌 Twilio stream connected')
          break

        case 'start':
          callSid = message.start.callSid
          streamSid = message.start.streamSid
          
          const params = message.start.customParameters || {}
          context = {
            businessName: decodeURIComponent(params.businessName || 'Business'),
            userRequest: decodeURIComponent(params.userRequest || 'inquiring'),
            category: decodeURIComponent(params.category || 'general'),
            userData: {}
          }
          
          try {
            if (params.userData) {
              context.userData = JSON.parse(decodeURIComponent(params.userData))
            }
          } catch (e) {}

          console.log('▶️ Stream started:', { callSid, business: context.businessName, task: context.userRequest })
          
          activeSessions.set(callSid, { streamSid, context, startTime: new Date() })
          
          // Connect to OpenAI
          try {
            openaiWs = await connectToOpenAI()
            openaiWs.on('message', handleOpenAIMessage)
            openaiWs.on('close', () => console.log('🔌 OpenAI connection closed'))
            openaiWs.on('error', (e) => console.error('❌ OpenAI WS error:', e.message))
          } catch (error) {
            console.error('❌ Failed to connect to OpenAI:', error.message)
          }
          break

        case 'media':
          const audioData = Buffer.from(message.media.payload, 'base64')
          if (isOpenAIReady) {
            sendAudioToOpenAI(audioData)
          } else {
            audioBuffer.push(audioData)
          }
          break

        case 'stop':
          console.log('⏹️ Stream stopped')
          break
      }
    } catch (error) {
      console.error('Error handling Twilio message:', error)
    }
  })

  twilioWs.on('close', () => {
    console.log('🔌 Twilio WebSocket closed')
    if (callSid) activeSessions.delete(callSid)
    if (openaiWs) openaiWs.close()
  })

  twilioWs.on('error', (error) => {
    console.error('❌ Twilio WS error:', error)
  })
})

// Start server
httpServer.listen(VOICE_PORT, () => {
  console.log('')
  console.log('━'.repeat(50))
  console.log('🎙️  VOICE SERVER READY')
  console.log('━'.repeat(50))
  console.log(`📡 WebSocket: ws://localhost:${VOICE_PORT}`)
  console.log(`❤️  Health: http://localhost:${VOICE_PORT}/health`)
  console.log('━'.repeat(50))
  console.log('')
})

