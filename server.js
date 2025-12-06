/**
 * Custom Node.js Server with WebSocket Support
 * For OpenAI Realtime API + Twilio Media Streams
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log('🚀 Initializing server...')

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

  wss.on('connection', (ws) => {
    console.log('📞 New WebSocket connection from Twilio')
    
    let callSid = null
    let streamSid = null

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        
        switch (message.event) {
          case 'connected':
            console.log('🔌 Twilio Media Stream connected')
            break

          case 'start':
            callSid = message.start.callSid
            streamSid = message.start.streamSid
            
            activeSessions.set(callSid, {
              streamSid,
              startTime: new Date(),
              parameters: message.start.customParameters || {}
            })
            
            console.log('▶️ Stream started:', {
              callSid,
              streamSid,
              business: message.start.customParameters?.businessName
            })
            break

          case 'media':
            // Audio data received from Twilio
            // In production, this would forward to OpenAI Realtime API
            // For now, we just log it
            if (callSid && activeSessions.has(callSid)) {
              // Log every 50th packet to avoid spam
              if (Math.random() < 0.02) {
                console.log('🎤 Audio packet received from call:', callSid)
              }
            }
            break

          case 'stop':
            if (callSid) {
              console.log('⏹️ Stream stopped:', streamSid)
              activeSessions.delete(callSid)
            }
            break
        }
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      if (callSid) {
        activeSessions.delete(callSid)
      }
      console.log('🔌 WebSocket connection closed')
    })

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
    })
  })

  console.log('🎙️ WebSocket server initialized for Twilio Media Streams')

  // Start server
  server.listen(port, (err) => {
    if (err) throw err
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Server Ready!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🌐 Web: http://${hostname}:${port}`)
    console.log(`🔌 WebSocket: ws://${hostname}:${port}/api/voice/stream`)
    console.log(`📊 Active sessions: ${activeSessions.size}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🎯 Next: Create public tunnel in another terminal')
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
