/**
 * WebSocket Audio Handler for Twilio Media Streams
 * 
 * Handles bidirectional audio streaming between Twilio and OpenAI Realtime API
 * This can be used with a custom Node.js server or WebSocket-enabled platform
 */

import { WebSocket } from 'ws'
import { createAgentCoordinator } from './agent-coordinator'
import type { CallContext } from './realtime-voice-agent'

interface TwilioMediaMessage {
  event: 'connected' | 'start' | 'media' | 'stop'
  sequenceNumber?: string
  start?: {
    streamSid: string
    callSid: string
    customParameters: Record<string, any>
  }
  media?: {
    track: 'inbound' | 'outbound'
    chunk: string
    timestamp: string
    payload: string // base64 encoded audio
  }
  stop?: {
    streamSid: string
  }
}

interface StreamSession {
  callSid: string
  streamSid: string
  audioBuffer: Buffer[]
  coordinator: any
  context: CallContext
  isActive: boolean
  startTime: Date
}

export class WebSocketAudioHandler {
  private sessions: Map<string, StreamSession> = new Map()
  
  /**
   * Handle WebSocket connection from Twilio
   */
  handleConnection(ws: WebSocket) {
    console.log('📞 New WebSocket connection established')
    
    let session: StreamSession | null = null

    ws.on('message', async (data: Buffer) => {
      try {
        const message: TwilioMediaMessage = JSON.parse(data.toString())
        
        switch (message.event) {
          case 'connected':
            console.log('🔌 Twilio Media Stream connected')
            break

          case 'start':
            if (message.start) {
              session = await this.handleStart(message.start, ws)
              console.log('▶️ Stream started:', {
                callSid: session.callSid,
                streamSid: session.streamSid
              })
            }
            break

          case 'media':
            if (session && message.media) {
              await this.handleMedia(session, message.media, ws)
            }
            break

          case 'stop':
            if (session) {
              this.handleStop(session)
              console.log('⏹️ Stream stopped:', session.streamSid)
            }
            break
        }
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      if (session) {
        this.handleStop(session)
      }
      console.log('🔌 WebSocket connection closed')
    })

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
    })
  }

  /**
   * Handle stream start event
   */
  private async handleStart(start: TwilioMediaMessage['start'], ws: WebSocket): Promise<StreamSession> {
    const { callSid, streamSid, customParameters } = start!
    
    // Build call context from custom parameters
    const context: CallContext = {
      userId: customParameters.userId || '',
      businessName: customParameters.businessName || '',
      businessPhone: customParameters.businessPhone || '',
      userRequest: customParameters.userRequest || '',
      category: customParameters.category || 'general',
      userData: customParameters.userData
    }

    // Create agent coordinator
    const coordinator = createAgentCoordinator(context)
    
    const session: StreamSession = {
      callSid,
      streamSid,
      audioBuffer: [],
      coordinator,
      context,
      isActive: true,
      startTime: new Date()
    }

    this.sessions.set(callSid, session)
    
    // Initialize OpenAI Realtime session
    await this.initializeRealtimeSession(session)
    
    return session
  }

  /**
   * Handle incoming audio media
   */
  private async handleMedia(
    session: StreamSession,
    media: TwilioMediaMessage['media'],
    ws: WebSocket
  ) {
    if (!session.isActive || !media) return

    // Decode audio payload (μ-law PCM @ 8kHz from Twilio)
    const audioChunk = Buffer.from(media.payload, 'base64')
    session.audioBuffer.push(audioChunk)

    // Process audio in chunks (accumulate ~1 second of audio)
    // At 8kHz sample rate, 1 second = 8000 bytes
    const CHUNK_SIZE = 8000
    const totalBuffered = session.audioBuffer.reduce((sum, buf) => sum + buf.length, 0)

    if (totalBuffered >= CHUNK_SIZE) {
      const fullAudio = Buffer.concat(session.audioBuffer)
      session.audioBuffer = []

      // Process audio through Realtime API
      const responseAudio = await this.processAudioWithRealtime(session, fullAudio)

      if (responseAudio) {
        // Send response back to Twilio
        this.sendAudioToTwilio(ws, session.streamSid, responseAudio)
      }
    }
  }

  /**
   * Handle stream stop event
   */
  private handleStop(session: StreamSession) {
    session.isActive = false
    
    // Save call results to database
    this.saveCallResults(session)
    
    // Cleanup
    this.sessions.delete(session.callSid)
  }

  /**
   * Initialize OpenAI Realtime session
   */
  private async initializeRealtimeSession(session: StreamSession) {
    // Get current agent configuration
    const agentConfig = session.coordinator.getCurrentAgent()
    
    console.log('🤖 Initializing Realtime session with agent:', agentConfig.name)
    
    // In production, this would establish connection to OpenAI Realtime API
    // For now, we're setting up the structure
    
    // TODO: Implement actual WebRTC/WebSocket connection to:
    // wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
    
    return {
      sessionId: `session_${session.callSid}`,
      agentConfig
    }
  }

  /**
   * Process audio through OpenAI Realtime API
   */
  private async processAudioWithRealtime(
    session: StreamSession,
    audioBuffer: Buffer
  ): Promise<Buffer | null> {
    try {
      // Convert Twilio audio format (μ-law @ 8kHz) to Realtime API format (PCM16 @ 24kHz)
      const convertedAudio = this.convertAudioFormat(audioBuffer)
      
      // Send to OpenAI Realtime API
      // In production, this would stream to the WebSocket connection
      // const response = await realtimeSession.sendAudio(convertedAudio)
      
      // For now, we're using the existing chained approach as fallback
      // TODO: Replace with actual Realtime API streaming
      
      console.log('🎤 Processing audio chunk:', convertedAudio.length, 'bytes')
      
      // Placeholder: Return silence for now
      // In production, this returns the audio response from Realtime API
      return null
    } catch (error) {
      console.error('❌ Error processing audio:', error)
      return null
    }
  }

  /**
   * Convert audio format between Twilio and OpenAI
   */
  private convertAudioFormat(input: Buffer): Buffer {
    // Twilio: μ-law PCM @ 8kHz
    // OpenAI Realtime: PCM16 @ 24kHz
    
    // This is a simplified placeholder
    // In production, use a proper audio resampling library like:
    // - node-audio-resampler
    // - ffmpeg
    // - sox
    
    // For now, return the input as-is
    // TODO: Implement proper audio format conversion
    return input
  }

  /**
   * Send audio response back to Twilio
   */
  private sendAudioToTwilio(ws: WebSocket, streamSid: string, audioBuffer: Buffer) {
    // Convert audio to base64 μ-law format for Twilio
    const payload = audioBuffer.toString('base64')
    
    const message = {
      event: 'media',
      streamSid,
      media: {
        payload
      }
    }

    ws.send(JSON.stringify(message))
  }

  /**
   * Save call results to database
   */
  private async saveCallResults(session: StreamSession) {
    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000)
    
    console.log('💾 Saving call results:', {
      callSid: session.callSid,
      duration: `${duration}s`,
      handoffs: session.coordinator.getHandoffHistory().length
    })
    
    // Save to call_history table via Supabase
    // This would use the existing callHistoryStorage
    
    // TODO: Implement database save
  }

  /**
   * Get active session
   */
  getSession(callSid: string): StreamSession | undefined {
    return this.sessions.get(callSid)
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): StreamSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessions: this.getActiveSessions().map(s => ({
        callSid: s.callSid,
        businessName: s.context.businessName,
        duration: Math.floor((Date.now() - s.startTime.getTime()) / 1000),
        currentAgent: s.coordinator.getCurrentAgentType()
      }))
    }
  }
}

/**
 * Global instance (singleton)
 */
let audioHandler: WebSocketAudioHandler | null = null

export function getAudioHandler(): WebSocketAudioHandler {
  if (!audioHandler) {
    audioHandler = new WebSocketAudioHandler()
  }
  return audioHandler
}

/**
 * Create WebSocket server for Twilio Media Streams
 * This should be called from a custom server.js file
 */
export function createWebSocketServer(server: any) {
  const { WebSocketServer } = require('ws')
  const wss = new WebSocketServer({ 
    server,
    path: '/api/voice/stream'
  })

  const handler = getAudioHandler()

  wss.on('connection', (ws: WebSocket) => {
    handler.handleConnection(ws)
  })

  console.log('🎙️ WebSocket server created for path: /api/voice/stream')

  return wss
}






