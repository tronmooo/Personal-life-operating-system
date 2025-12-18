/**
 * Twilio Voice Service
 * 
 * Handles making actual phone calls to businesses
 * Streams audio to/from OpenAI Voice Agent
 */

import twilio from 'twilio'
import { OpenAIVoiceAgent, CallContext } from './openai-voice-agent'
import { callHistoryStorage } from '../call-history-storage-supabase'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  webhookUrl: string
}

export interface CallOptions {
  to: string
  businessName: string
  userRequest: string
  category: string
  context: CallContext
}

export interface ActiveCall {
  callSid: string
  to: string
  businessName: string
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'
  startTime: Date
  duration?: number
  transcript: Array<{
    speaker: 'ai' | 'human'
    message: string
    timestamp: Date
  }>
  quote?: {
    price?: string
    priceNumeric?: number
    currency?: string
    details?: string
    availability?: string
  }
  appointment?: {
    date: string
    time: string
    confirmationNumber?: string
  }
  specialOffers?: Array<{
    offer: string
    expirationDate?: string
    conditions?: string
  }>
}

export class TwilioVoiceService {
  private client: twilio.Twilio
  private config: TwilioConfig
  private activeCalls: Map<string, ActiveCall> = new Map()
  private voiceAgents: Map<string, OpenAIVoiceAgent> = new Map()

  constructor(config: TwilioConfig) {
    this.config = config
    this.client = twilio(config.accountSid, config.authToken)
  }

  /**
   * Make a call to a business
   */
  async makeCall(options: CallOptions): Promise<ActiveCall> {
    try {
      console.log('📞 Initiating Twilio call to:', options.businessName)

      // Format phone number to E.164
      let formattedPhone = options.to
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
      }

      // Create voice agent for this call
      const voiceAgent = new OpenAIVoiceAgent({
        apiKey: process.env.OPENAI_API_KEY || '',
        voice: 'alloy',
        temperature: 0.8
      })

      // Initialize conversation with context
      await voiceAgent.initializeConversation(options.context)

      // Make the call
      const twimlUrl = `${this.config.webhookUrl}/api/voice/twiml?callContext=${encodeURIComponent(JSON.stringify({
          businessName: options.businessName,
          userRequest: options.userRequest,
          category: options.category
        }))}`

      console.log('🔗 TwiML URL:', twimlUrl)

      const call = await this.client.calls.create({
        to: formattedPhone,
        from: this.config.phoneNumber,
        url: twimlUrl,
        statusCallback: `${this.config.webhookUrl}/api/voice/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: false, // We'll handle recording via streaming
        timeout: 60, // Ring for 60 seconds before giving up
        machineDetection: 'DetectMessageEnd' // Detect voicemail
      })

      // Create active call record
      const activeCall: ActiveCall = {
        callSid: call.sid,
        to: formattedPhone,
        businessName: options.businessName,
        status: 'queued',
        startTime: new Date(),
        transcript: []
      }

      this.activeCalls.set(call.sid, activeCall)
      this.voiceAgents.set(call.sid, voiceAgent)

      console.log('✅ Call initiated. SID:', call.sid)

      return activeCall
    } catch (error) {
      console.error('Error making call:', error)
      throw error
    }
  }

  /**
   * Generate TwiML for call
   */
  generateTwiML(callContext: any): string {
    const twiml = new twilio.twiml.VoiceResponse()

    // Start with a greeting
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, `Hello, this is an AI assistant calling on behalf of a customer regarding ${callContext.userRequest}.`)

    // Start bidirectional media streaming
    const connect = twiml.connect()
    connect.stream({
      url: `wss://${this.config.webhookUrl.replace('https://', '').replace('http://', '')}/api/voice/stream`,
      track: 'both_tracks'
    })

    return twiml.toString()
  }

  /**
   * Handle call status updates
   */
  async updateCallStatus(
    callSid: string,
    status: ActiveCall['status'],
    duration?: number
  ): Promise<void> {
    const call = this.activeCalls.get(callSid)
    if (!call) return

    call.status = status
    if (duration) call.duration = duration

    // If call is completed, save to database
    if (status === 'completed' || status === 'failed' || status === 'no-answer') {
      await this.saveCallHistory(call)
      this.activeCalls.delete(callSid)
      this.voiceAgents.delete(callSid)
    }
  }

  /**
   * Process audio stream from call
   */
  async processAudioStream(
    callSid: string,
    audioBuffer: Buffer
  ): Promise<Buffer | null> {
    const voiceAgent = this.voiceAgents.get(callSid)
    const call = this.activeCalls.get(callSid)

    if (!voiceAgent || !call) {
      console.error('No voice agent found for call:', callSid)
      return null
    }

    try {
      // Process audio through voice agent
      const context: CallContext = {
        userId: '',
        businessName: call.businessName,
        businessPhone: call.to,
        userRequest: '',
        category: 'general'
      }

      const response = await voiceAgent.processAudio(audioBuffer, context)

      // Update transcript
      call.transcript.push({
        speaker: 'ai',
        message: response.transcript,
        timestamp: new Date()
      })

      // Handle function calls (extract quotes, appointments, etc.)
      response.functionCalls.forEach(fc => {
        if (fc.name === 'extract_quote') {
          call.quote = {
            price: `$${fc.arguments.price}`,
            priceNumeric: fc.arguments.price,
            currency: fc.arguments.currency || 'USD',
            details: fc.arguments.details,
            availability: fc.arguments.availability
          }
        } else if (fc.name === 'schedule_appointment') {
          call.appointment = {
            date: fc.arguments.date || '',
            time: fc.arguments.time || '',
            confirmationNumber: fc.arguments.confirmationNumber
          }
        } else if (fc.name === 'record_special_offer') {
          if (!call.specialOffers) call.specialOffers = []
          call.specialOffers.push({
            offer: fc.arguments.offer || '',
            expirationDate: fc.arguments.expirationDate,
            conditions: fc.arguments.conditions
          })
        }
      })

      // If conversation is complete, end call
      if (response.isComplete) {
        await this.endCall(callSid)
      }

      return response.audioResponse
    } catch (error) {
      console.error('Error processing audio stream:', error)
      return null
    }
  }

  /**
   * End a call
   */
  async endCall(callSid: string): Promise<void> {
    try {
      await this.client.calls(callSid).update({
        status: 'completed'
      })

      await this.updateCallStatus(callSid, 'completed')
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  /**
   * Get active call by SID
   */
  getCall(callSid: string): ActiveCall | undefined {
    return this.activeCalls.get(callSid)
  }

  /**
   * Get all active calls
   */
  getActiveCalls(): ActiveCall[] {
    return Array.from(this.activeCalls.values())
  }

  /**
   * Save call to history
   */
  private async saveCallHistory(call: ActiveCall): Promise<void> {
    try {
      await callHistoryStorage.addEntry({
        callId: call.callSid,
        businessName: call.businessName,
        phoneNumber: call.to,
        category: 'general',
        userRequest: '',
        status: call.status === 'completed' ? 'completed' : 
                call.status === 'no-answer' ? 'no-answer' : 'failed',
        startTime: call.startTime,
        endTime: new Date(),
        duration: call.duration || 0,
        transcript: call.transcript,
        quote: call.quote
      })

      console.log('✅ Call history saved to database')
    } catch (error) {
      console.error('Error saving call history:', error)
    }
  }

  /**
   * Get call statistics
   */
  getStats() {
    const calls = Array.from(this.activeCalls.values())
    return {
      activeCalls: calls.length,
      inProgress: calls.filter(c => c.status === 'in-progress').length,
      ringing: calls.filter(c => c.status === 'ringing').length,
      queued: calls.filter(c => c.status === 'queued').length
    }
  }
}

/**
 * Factory function to create Twilio service
 */
export function createTwilioService(webhookUrlOverride?: string): TwilioVoiceService {
  const config: TwilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    webhookUrl: (webhookUrlOverride || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  }

  if (!config.accountSid || !config.authToken || !config.phoneNumber) {
    throw new Error('Twilio credentials not configured')
  }

  return new TwilioVoiceService(config)
}

