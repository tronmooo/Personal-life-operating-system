/**
 * Custom Node.js Server with WebSocket Support
 * 
 * This server is needed for Twilio Media Streams WebSocket connections
 * to work with OpenAI Realtime API for speech-to-speech voice calls
 * 
 * To use:
 * 1. Rename this file to server.js
 * 2. Update package.json scripts:
 *    "dev": "node server.js"
 *    "start": "NODE_ENV=production node server.js"
 * 3. Run: npm run dev
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { createWebSocketServer } = require('./lib/services/websocket-audio-handler')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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
  const wss = createWebSocketServer(server)
  
  console.log('🎙️ WebSocket server initialized for Twilio Media Streams')

  // Start server
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`✅ Ready on http://${hostname}:${port}`)
    console.log(`🔌 WebSocket endpoint: ws://${hostname}:${port}/api/voice/stream`)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})






