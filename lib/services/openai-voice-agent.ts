/**
 * OpenAI Voice Agent Service
 * 
 * Implements OpenAI's Realtime API for voice conversations
 * with function calling capabilities for business operations
 */

import OpenAI from 'openai'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface VoiceAgentConfig {
  apiKey: string
  model?: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  temperature?: number
}

export interface FunctionCall {
  name: string
  arguments: Record<string, any>
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  functionCall?: FunctionCall
}

export interface CallContext {
  userId: string
  businessName: string
  businessPhone: string
  userRequest: string
  category: string
  userLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  userData?: {
    name?: string
    vehicles?: any[]
    health?: any[]
    finances?: any[]
    preferences?: any
  }
}

export class OpenAIVoiceAgent {
  private openai: OpenAI
  private supabase = createClientComponentClient()
  private config: VoiceAgentConfig
  private conversationHistory: ConversationMessage[] = []

  constructor(config: VoiceAgentConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      temperature: 0.8,
      ...config
    }
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: false
    })
  }

  /**
   * Initialize a voice conversation with system instructions
   */
  async initializeConversation(context: CallContext): Promise<void> {
    const systemPrompt = this.buildSystemPrompt(context)
    
    this.conversationHistory = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]
  }

  /**
   * Build system prompt with full context
   */
  private buildSystemPrompt(context: CallContext): string {
    const { businessName, userRequest, userData, category } = context
    
    let prompt = `You are a professional AI assistant calling ${businessName} on behalf of ${userData?.name || 'a customer'}.

PRIMARY OBJECTIVE: ${userRequest}

IMPORTANT INSTRUCTIONS:
1. Be polite, professional, and concise
2. Introduce yourself as an AI assistant calling on behalf of ${userData?.name || 'a customer'}
3. Clearly state the purpose: "${userRequest}"
4. Ask for a price quote if applicable
5. Ask about availability and timeline
6. Note any special offers or important details
7. Thank them for their time

`

    // Add context-specific instructions
    if (category === 'automotive' && userData?.vehicles && userData.vehicles.length > 0) {
      const vehicle = userData.vehicles[0]
      prompt += `\nVEHICLE INFORMATION:
- Make/Model: ${vehicle.metadata?.make || vehicle.data?.make} ${vehicle.metadata?.model || vehicle.data?.model}
- Year: ${vehicle.metadata?.year || vehicle.data?.year}
- Mileage: ${vehicle.metadata?.mileage || vehicle.data?.mileage || 'Unknown'}

Provide this vehicle information if asked.
`
    }

    if (category === 'health' && userData?.health && userData.health.length > 0) {
      prompt += `\nHEALTH CONTEXT:
The customer has health records on file. Keep health information private unless necessary for the service.
`
    }

    if (userData?.preferences?.budget) {
      prompt += `\nBUDGET: Preferred budget is around $${userData.preferences.budget}. Look for options in this range.
`
    }

    prompt += `\nCONVERSATION GUIDELINES:
- Keep the call under 2 minutes if possible
- If they can't help or are closed, politely thank them and end the call
- If voicemail, leave a brief message with callback number
- Use function calls to extract structured data (quotes, appointments, etc.)
- Be natural and conversational, not robotic

Begin the call now.`

    return prompt
  }

  /**
   * Process audio input and get response
   */
  async processAudio(audioBuffer: Buffer, context: CallContext): Promise<{
    audioResponse: Buffer
    transcript: string
    functionCalls: FunctionCall[]
    isComplete: boolean
  }> {
    try {
      // Convert audio to text using Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([new Uint8Array(audioBuffer)], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: 'en'
      })

      const userMessage = transcription.text

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      // Get AI response with function calling
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: this.conversationHistory as any,
        functions: this.getFunctions(context.category),
        function_call: 'auto',
        temperature: this.config.temperature
      })

      const assistantMessage = completion.choices[0].message
      const functionCalls: FunctionCall[] = []

      // Handle function calls
      if (assistantMessage.function_call) {
        const functionCall = {
          name: assistantMessage.function_call.name,
          arguments: JSON.parse(assistantMessage.function_call.arguments)
        }
        functionCalls.push(functionCall)

        // Execute function
        const functionResult = await this.executeFunction(functionCall, context)
        
        this.conversationHistory.push({
          role: 'function',
          name: functionCall.name,
          content: JSON.stringify(functionResult)
        })

        // Get final response after function execution
        const finalCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: this.conversationHistory as any,
          temperature: this.config.temperature
        })

        const finalMessage = finalCompletion.choices[0].message.content || ''
        this.conversationHistory.push({
          role: 'assistant',
          content: finalMessage
        })

        // Convert to speech
        const audioResponse = await this.textToSpeech(finalMessage)

        return {
          audioResponse,
          transcript: finalMessage,
          functionCalls,
          isComplete: this.isConversationComplete(finalMessage)
        }
      }

      // Normal response without function call
      const responseText = assistantMessage.content || ''
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText
      })

      // Convert to speech
      const audioResponse = await this.textToSpeech(responseText)

      return {
        audioResponse,
        transcript: responseText,
        functionCalls: [],
        isComplete: this.isConversationComplete(responseText)
      }

    } catch (error) {
      console.error('Error processing audio:', error)
      throw error
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  private async textToSpeech(text: string): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: this.config.voice!,
      input: text,
      speed: 1.0
    })

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Get available functions for the agent
   */
  private getFunctions(category: string): any[] {
    const baseFunctions = [
      {
        name: 'extract_quote',
        description: 'Extract a price quote from the conversation',
        parameters: {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              description: 'The quoted price in dollars'
            },
            currency: {
              type: 'string',
              description: 'Currency code (USD, EUR, etc.)',
              default: 'USD'
            },
            details: {
              type: 'string',
              description: 'Additional details about the quote'
            },
            availability: {
              type: 'string',
              description: 'When the service is available'
            }
          },
          required: ['price']
        }
      },
      {
        name: 'schedule_appointment',
        description: 'Schedule an appointment or reservation',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Appointment date in ISO format'
            },
            time: {
              type: 'string',
              description: 'Appointment time'
            },
            confirmationNumber: {
              type: 'string',
              description: 'Confirmation number if provided'
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the appointment'
            }
          },
          required: ['date', 'time']
        }
      },
      {
        name: 'record_special_offer',
        description: 'Record a special offer or discount mentioned',
        parameters: {
          type: 'object',
          properties: {
            offer: {
              type: 'string',
              description: 'Description of the special offer'
            },
            expirationDate: {
              type: 'string',
              description: 'When the offer expires'
            },
            conditions: {
              type: 'string',
              description: 'Any conditions or restrictions'
            }
          },
          required: ['offer']
        }
      }
    ]

    return baseFunctions
  }

  /**
   * Execute a function call
   */
  private async executeFunction(
    functionCall: FunctionCall,
    context: CallContext
  ): Promise<any> {
    switch (functionCall.name) {
      case 'extract_quote':
        return {
          success: true,
          quote: functionCall.arguments,
          message: 'Quote extracted successfully'
        }

      case 'schedule_appointment':
        return {
          success: true,
          appointment: functionCall.arguments,
          message: 'Appointment scheduled successfully'
        }

      case 'record_special_offer':
        return {
          success: true,
          offer: functionCall.arguments,
          message: 'Special offer recorded'
        }

      default:
        return {
          success: false,
          message: `Unknown function: ${functionCall.name}`
        }
    }
  }

  /**
   * Check if conversation should end
   */
  private isConversationComplete(lastMessage: string): boolean {
    const endPhrases = [
      'goodbye',
      'thank you for your time',
      'have a great day',
      'talk to you later',
      'bye',
      'no longer available',
      'cannot help',
      'voicemail'
    ]

    const lowerMessage = lastMessage.toLowerCase()
    return endPhrases.some(phrase => lowerMessage.includes(phrase))
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * Get conversation transcript as text
   */
  getTranscript(): string {
    return this.conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        if (msg.role === 'user') return `Customer: ${msg.content}`
        if (msg.role === 'assistant') return `AI: ${msg.content}`
        if (msg.role === 'function') return `[Function: ${msg.name}]`
        return ''
      })
      .filter(Boolean)
      .join('\n\n')
  }

  /**
   * Clear conversation history
   */
  reset(): void {
    this.conversationHistory = []
  }
}

/**
 * Factory function to create voice agent
 */
export function createVoiceAgent(apiKey?: string): OpenAIVoiceAgent {
  const key = apiKey || process.env.OPENAI_API_KEY || ''
  
  if (!key) {
    throw new Error('OpenAI API key is required')
  }

  return new OpenAIVoiceAgent({
    apiKey: key,
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    temperature: 0.8
  })
}

