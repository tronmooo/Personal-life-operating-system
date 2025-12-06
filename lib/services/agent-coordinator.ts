/**
 * Agent Coordinator
 * 
 * Manages multiple specialized agents and handles handoffs
 * between them based on conversation context
 */

import { tool } from '@openai/agents'
import { z } from 'zod'
import {
  extractQuoteTool,
  scheduleAppointmentTool,
  recordSpecialOfferTool,
  placeOrderTool,
  buildSystemPrompt,
  type CallContext,
  type RealtimeAgentConfig
} from './realtime-voice-agent'

export type AgentType = 
  | 'main_concierge'
  | 'quotes_validator'
  | 'order_placer'
  | 'appointment_scheduler'

export interface AgentHandoff {
  fromAgent: AgentType
  toAgent: AgentType
  reason: string
  context: Record<string, any>
  timestamp: Date
}

/**
 * Quotes Validator Agent
 * Specialized in comparing and validating quotes from multiple sources
 */
export function createQuotesValidatorAgent(config: RealtimeAgentConfig, context: CallContext) {
  return {
    name: 'Quotes Validator',
    instructions: `# Identity
You are a specialized quotes validation assistant.

# Your Role
You help customers compare and validate price quotes from multiple businesses.

# Instructions
1. Review quotes provided from multiple sources
2. Compare prices, availability, and services offered
3. Identify the best value option
4. Point out any special offers or promotions
5. Provide clear recommendations based on customer preferences

# Guidelines
- Be objective and data-driven
- Consider both price and quality
- Highlight any red flags (unusually high/low prices)
- Respect customer budget preferences
- Provide clear comparisons

When you're done analyzing, transfer back to the main concierge for final decision.`,
    tools: [
      tool({
        name: 'validate_quote',
        description: 'Validate a quote against market rates and customer expectations',
        parameters: z.object({
          businessName: z.string(),
          quote: z.number(),
          isReasonable: z.boolean(),
          reasoning: z.string()
        }),
        execute: async ({ businessName, quote, isReasonable, reasoning }) => {
          console.log('✅ Quote validated:', { businessName, quote, isReasonable, reasoning })
          return {
            success: true,
            validation: { businessName, quote, isReasonable, reasoning }
          }
        }
      }),
      tool({
        name: 'compare_quotes',
        description: 'Compare multiple quotes and recommend the best option',
        parameters: z.object({
          quotes: z.array(z.object({
            businessName: z.string(),
            price: z.number(),
            details: z.string().optional()
          })),
          recommendedBusiness: z.string(),
          reasoning: z.string()
        }),
        execute: async ({ quotes, recommendedBusiness, reasoning }) => {
          console.log('📊 Quotes compared:', { quotes, recommendedBusiness, reasoning })
          return {
            success: true,
            comparison: { quotes, recommendedBusiness, reasoning }
          }
        }
      })
    ],
    voice: config.voice || 'echo',
    temperature: 0.7,
    modalities: ['text'] as ('text' | 'audio')[] // Primarily text-based analysis
  }
}

/**
 * Order Placer Agent
 * Specialized in placing orders with restaurants and businesses
 */
export function createOrderPlacerAgent(config: RealtimeAgentConfig, context: CallContext) {
  const orderDetails = context.userData?.orderId ? `
# Order Details
- Order Number: ${context.userData.orderNumber}
- Items: ${context.userData.items?.map((item: any) => 
    `${item.quantity}x ${item.name}${item.customizations ? ' (' + item.customizations.join(', ') + ')' : ''}`
  ).join(', ')}
- Order Type: ${context.userData.orderType}
${context.userData.deliveryAddress ? `- Delivery Address: ${context.userData.deliveryAddress}` : ''}
${context.userData.specialRequests ? `- Special Requests: ${context.userData.specialRequests}` : ''}
` : ''

  return {
    name: 'Order Placer',
    instructions: `# Identity
You are a specialized order placement assistant.

# Your Role
You place food and product orders on behalf of customers with businesses.

${orderDetails}

# Instructions
1. Clearly communicate the order details
2. Confirm each item and customization
3. Verify the delivery address if applicable
4. Get total price and estimated time
5. Obtain order confirmation number
6. Confirm special requests are noted

# Guidelines
- Be clear and precise with order details
- Repeat back items for confirmation
- Ask for estimated completion/delivery time
- Always get a confirmation number
- Verify payment method expectations
- Thank them and end professionally

Use the place_order function once everything is confirmed.`,
    tools: [placeOrderTool],
    voice: config.voice || 'alloy',
    temperature: 0.7,
    modalities: ['audio'] as ('text' | 'audio')[]
  }
}

/**
 * Appointment Scheduler Agent
 * Specialized in scheduling appointments and reservations
 */
export function createAppointmentSchedulerAgent(config: RealtimeAgentConfig, context: CallContext) {
  return {
    name: 'Appointment Scheduler',
    instructions: `# Identity
You are a specialized appointment scheduling assistant.

# Your Role
You schedule appointments, reservations, and service bookings on behalf of customers.

# Instructions
1. State the customer's availability preferences
2. Ask for available appointment slots
3. Confirm the specific date and time
4. Get confirmation number or booking reference
5. Ask about any preparation needed
6. Confirm the appointment details

# Guidelines
- Be clear about dates and times (include time zone if needed)
- Confirm the service/appointment type
- Get any special instructions
- Verify contact information
- Ask about cancellation policy if applicable
- Always get confirmation number

Use the schedule_appointment function once time is confirmed.`,
    tools: [scheduleAppointmentTool],
    voice: config.voice || 'nova',
    temperature: 0.7,
    modalities: ['audio'] as ('text' | 'audio')[]
  }
}

/**
 * Agent Coordinator Class
 * Manages agent lifecycle and handoffs
 */
export class AgentCoordinator {
  private currentAgent: AgentType = 'main_concierge'
  private handoffHistory: AgentHandoff[] = []
  private context: CallContext
  private config: RealtimeAgentConfig

  constructor(context: CallContext, config: RealtimeAgentConfig) {
    this.context = context
    this.config = config
  }

  /**
   * Get current active agent configuration
   */
  getCurrentAgent() {
    switch (this.currentAgent) {
      case 'quotes_validator':
        return createQuotesValidatorAgent(this.config, this.context)
      
      case 'order_placer':
        return createOrderPlacerAgent(this.config, this.context)
      
      case 'appointment_scheduler':
        return createAppointmentSchedulerAgent(this.config, this.context)
      
      case 'main_concierge':
      default:
        return this.getMainConciergeWithHandoffs()
    }
  }

  /**
   * Main concierge with handoff capabilities
   */
  private getMainConciergeWithHandoffs() {
    const systemPrompt = buildSystemPrompt(this.context)
    
    return {
      name: 'AI Concierge',
      instructions: systemPrompt + `

# Agent Handoff
You have access to specialized agents for specific tasks:
- quotes_validator: For comparing and validating multiple quotes
- order_placer: For placing orders with businesses
- appointment_scheduler: For scheduling appointments

Transfer to a specialized agent when their expertise is needed.`,
      tools: [
        extractQuoteTool,
        scheduleAppointmentTool,
        recordSpecialOfferTool,
        ...(this.context.category === 'order_placement' ? [placeOrderTool] : []),
        // Handoff tools
        this.createHandoffTool('quotes_validator'),
        this.createHandoffTool('order_placer'),
        this.createHandoffTool('appointment_scheduler')
      ],
      voice: this.config.voice || 'alloy',
      temperature: this.config.temperature || 0.8,
      modalities: this.config.modalities || ['audio'] as ('text' | 'audio')[]
    }
  }

  /**
   * Create a handoff tool for agent transfer
   */
  private createHandoffTool(targetAgent: AgentType) {
    const agentNames: Record<AgentType, string> = {
      main_concierge: 'Main Concierge',
      quotes_validator: 'Quotes Validator',
      order_placer: 'Order Placer',
      appointment_scheduler: 'Appointment Scheduler'
    }

    return tool({
      name: `transfer_to_${targetAgent}`,
      description: `Transfer the conversation to the ${agentNames[targetAgent]} agent`,
      parameters: z.object({
        reason: z.string().describe('Why this transfer is needed'),
        context: z.record(z.any()).optional().describe('Context to pass to the next agent')
      }),
      execute: async ({ reason, context }) => {
        console.log(`🔄 Handoff: ${this.currentAgent} → ${targetAgent}`)
        console.log(`   Reason: ${reason}`)
        
        this.handoff(targetAgent, reason, context || {})
        
        return {
          success: true,
          message: `Transferred to ${agentNames[targetAgent]}`,
          newAgent: targetAgent
        }
      }
    })
  }

  /**
   * Perform agent handoff
   */
  handoff(toAgent: AgentType, reason: string, context: Record<string, any>) {
    const handoff: AgentHandoff = {
      fromAgent: this.currentAgent,
      toAgent,
      reason,
      context,
      timestamp: new Date()
    }

    this.handoffHistory.push(handoff)
    this.currentAgent = toAgent

    console.log('✅ Agent handoff completed:', handoff)
  }

  /**
   * Get handoff history
   */
  getHandoffHistory(): AgentHandoff[] {
    return [...this.handoffHistory]
  }

  /**
   * Get current agent type
   */
  getCurrentAgentType(): AgentType {
    return this.currentAgent
  }

  /**
   * Reset to main concierge
   */
  resetToMain() {
    if (this.currentAgent !== 'main_concierge') {
      this.handoff('main_concierge', 'Task completed, returning to main', {})
    }
  }
}

/**
 * Factory function to create agent coordinator
 */
export function createAgentCoordinator(context: CallContext, apiKey?: string): AgentCoordinator {
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

  return new AgentCoordinator(context, config)
}






