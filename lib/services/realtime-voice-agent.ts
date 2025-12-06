/**
 * OpenAI Realtime Voice Agent Service
 * 
 * Implements OpenAI's native speech-to-speech Realtime API
 * with agent handoff capabilities for specialized tasks
 */

import { tool } from '@openai/agents'
import { z } from 'zod'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface RealtimeAgentConfig {
  apiKey: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  temperature?: number
  modalities?: ('text' | 'audio')[]
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
    orderId?: string
    orderNumber?: string
    items?: any[]
    orderType?: string
    deliveryAddress?: string
    specialRequests?: string
  }
}

export interface QuoteData {
  price: number
  currency?: string
  details?: string
  availability?: string
}

export interface AppointmentData {
  date: string
  time: string
  confirmationNumber?: string
  notes?: string
}

export interface SpecialOfferData {
  offer: string
  expirationDate?: string
  conditions?: string
}

/**
 * Tool: Extract Quote
 * Automatically extracts price quotes from conversation
 */
export const extractQuoteTool = tool({
  name: 'extract_quote',
  description: 'Extract a price quote from the conversation with the business',
  parameters: z.object({
    price: z.number().describe('The quoted price in dollars'),
    currency: z.string().default('USD').describe('Currency code'),
    details: z.string().optional().describe('Additional details about the quote'),
    availability: z.string().optional().describe('When the service is available')
  }),
  execute: async ({ price, currency, details, availability }, context) => {
    console.log('📋 Quote extracted:', { price, currency, details, availability })
    
    // Save quote to call history via context
    if ((context as any)?.metadata?.callId) {
      // Quote will be saved by the call handler
      return {
        success: true,
        message: `Quote of $${price} recorded successfully`,
        quote: { price, currency, details, availability }
      }
    }

    return {
      success: true,
      message: `Quote of $${price} recorded`,
      quote: { price, currency, details, availability }
    }
  }
})

/**
 * Tool: Schedule Appointment
 * Books appointments during the call
 */
export const scheduleAppointmentTool = tool({
  name: 'schedule_appointment',
  description: 'Schedule an appointment or reservation with the business',
  parameters: z.object({
    date: z.string().describe('Appointment date in ISO format'),
    time: z.string().describe('Appointment time'),
    confirmationNumber: z.string().optional().describe('Confirmation number if provided'),
    notes: z.string().optional().describe('Additional notes about the appointment')
  }),
  execute: async ({ date, time, confirmationNumber, notes }, context) => {
    console.log('📅 Appointment scheduled:', { date, time, confirmationNumber, notes })
    
    return {
      success: true,
      message: `Appointment scheduled for ${date} at ${time}`,
      appointment: { date, time, confirmationNumber, notes }
    }
  }
})

/**
 * Tool: Record Special Offer
 * Captures special offers and promotions mentioned
 */
export const recordSpecialOfferTool = tool({
  name: 'record_special_offer',
  description: 'Record a special offer, promotion, or discount mentioned by the business',
  parameters: z.object({
    offer: z.string().describe('Description of the special offer'),
    expirationDate: z.string().optional().describe('When the offer expires'),
    conditions: z.string().optional().describe('Any conditions or restrictions')
  }),
  execute: async ({ offer, expirationDate, conditions }, context) => {
    console.log('🎁 Special offer recorded:', { offer, expirationDate, conditions })
    
    return {
      success: true,
      message: 'Special offer recorded',
      offer: { offer, expirationDate, conditions }
    }
  }
})

/**
 * Tool: Place Order
 * Handles order placement during the call
 */
export const placeOrderTool = tool({
  name: 'place_order',
  description: 'Place an order with the business after confirming details',
  parameters: z.object({
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      customizations: z.array(z.string()).optional()
    })).describe('Items to order'),
    totalPrice: z.number().optional().describe('Total price quoted'),
    confirmationNumber: z.string().optional().describe('Order confirmation number'),
    estimatedTime: z.string().optional().describe('Estimated completion/delivery time')
  }),
  execute: async ({ items, totalPrice, confirmationNumber, estimatedTime }, context) => {
    console.log('🛒 Order placed:', { items, totalPrice, confirmationNumber, estimatedTime })
    
    return {
      success: true,
      message: 'Order placed successfully',
      order: { items, totalPrice, confirmationNumber, estimatedTime }
    }
  }
})

/**
 * Build system prompt with call context
 */
export function buildSystemPrompt(context: CallContext): string {
  const { businessName, userRequest, userData, category } = context
  
  let prompt = `# Identity
You are a professional AI assistant calling ${businessName} on behalf of ${userData?.name || 'a customer'}.

# Primary Objective
${userRequest}

# Important Instructions
1. Be polite, professional, and concise
2. Introduce yourself: "Hi, this is an AI assistant calling on behalf of ${userData?.name || 'a customer'}"
3. Clearly state the purpose: "${userRequest}"
4. Ask for a price quote if applicable
5. Ask about availability and timeline
6. Note any special offers or important details
7. If placing an order, confirm all details before finalizing
8. Thank them for their time before ending the call

# Conversation Guidelines
- Keep the call under 2-3 minutes if possible
- If they can't help or are closed, politely thank them and end the call
- If voicemail, leave a brief message with callback info
- Use function calls to extract structured data (quotes, appointments, etc.)
- Be natural and conversational, not robotic
- Listen carefully for prices, dates, and confirmation numbers

`

  // Add context-specific instructions
  if (category === 'automotive' && userData?.vehicles && userData.vehicles.length > 0) {
    const vehicle = userData.vehicles[0]
    prompt += `\n# Vehicle Information
- Make/Model: ${vehicle.metadata?.make || vehicle.data?.make} ${vehicle.metadata?.model || vehicle.data?.model}
- Year: ${vehicle.metadata?.year || vehicle.data?.year}
- Mileage: ${vehicle.metadata?.mileage || vehicle.data?.mileage || 'Unknown'}

Provide this vehicle information if asked.
`
  }

  if (category === 'order_placement' && userData?.orderId) {
    const itemsList = userData.items?.map((item: any) => 
      `${item.quantity}x ${item.name}${item.customizations ? ' (' + item.customizations.join(', ') + ')' : ''}`
    ).join(', ') || ''
    
    prompt += `\n# Order Details
- Order Number: ${userData.orderNumber}
- Items: ${itemsList}
- Order Type: ${userData.orderType}
${userData.deliveryAddress ? `- Delivery Address: ${userData.deliveryAddress}` : ''}
${userData.specialRequests ? `- Special Requests: ${userData.specialRequests}` : ''}

Place this exact order with the business. Confirm all details before finalizing.
`
  }

  if (userData?.preferences?.budget) {
    prompt += `\n# Budget
Preferred budget is around $${userData.preferences.budget}. Look for options in this range.
`
  }

  prompt += `\n# Action Items
- Extract quote using extract_quote function
- Schedule appointment if needed using schedule_appointment function
- Record any special offers using record_special_offer function
${category === 'order_placement' ? '- Place order using place_order function\n' : ''}
- Be prepared to end the call once objective is achieved

Begin the call now.`

  return prompt
}

/**
 * Create the main concierge agent
 */
export function createMainConciergeAgent(config: RealtimeAgentConfig, context: CallContext) {
  // This will be implemented with the actual RealtimeAgent from @openai/agents
  // For now, we're setting up the structure
  
  const systemPrompt = buildSystemPrompt(context)
  
  const agentConfig = {
    name: 'AI Concierge',
    instructions: systemPrompt,
    tools: [
      extractQuoteTool,
      scheduleAppointmentTool,
      recordSpecialOfferTool,
      ...(context.category === 'order_placement' ? [placeOrderTool] : [])
    ],
    voice: config.voice || 'alloy',
    temperature: config.temperature || 0.8,
    modalities: config.modalities || ['audio'] as ('text' | 'audio')[]
  }

  return agentConfig
}

/**
 * Create agent configuration for different scenarios
 */
export function getAgentConfig(category: string, config: RealtimeAgentConfig, context: CallContext) {
  switch (category) {
    case 'order_placement':
      return createMainConciergeAgent({
        ...config,
        voice: 'alloy' // Friendly voice for orders
      }, context)
    
    case 'automotive':
      return createMainConciergeAgent({
        ...config,
        voice: 'echo' // Professional voice for automotive services
      }, context)
    
    case 'health':
      return createMainConciergeAgent({
        ...config,
        voice: 'nova' // Warm voice for health services
      }, context)
    
    default:
      return createMainConciergeAgent(config, context)
  }
}

/**
 * Factory function to create voice agent configuration
 */
export function createRealtimeVoiceAgent(context: CallContext, apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY || ''
  
  if (!key) {
    throw new Error('OpenAI API key is required')
  }

  const config: RealtimeAgentConfig = {
    apiKey: key,
    voice: 'alloy',
    temperature: 0.8,
    modalities: ['audio']
  }

  return getAgentConfig(context.category, config, context)
}






