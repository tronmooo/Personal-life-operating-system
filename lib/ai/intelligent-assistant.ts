/**
 * Intelligent Assistant
 * AI-powered assistant for answering questions and providing insights
 */

import type { Domain } from '@/types/domains'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AssistantConfig {
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

interface AssistantResponse {
  message: string
  suggestions?: string[]
  actions?: { type: string; label: string; data?: any }[]
}

export interface AIContext {
  userId?: string
  domainData?: Partial<Record<Domain, any[]>>
  recentActivity?: { domain: string; action: string; timestamp: string }[]
  goals?: { id: string; title: string; domain: string; target: any; progress: number }[]
  userProfile?: {
    name?: string
    preferences?: Record<string, any>
  }
  data?: Record<string, any>
  [key: string]: any
}

export class IntelligentAssistant {
  private apiKey?: string
  private model: string
  private maxTokens: number
  private temperature: number
  private conversationHistory: Message[] = []

  constructor(config: AssistantConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY
    this.model = config.model || 'gpt-4-turbo-preview'
    this.maxTokens = config.maxTokens || 1000
    this.temperature = config.temperature || 0.7
  }

  /**
   * Initialize the assistant with a system prompt
   */
  initialize(systemPrompt?: string): void {
    const defaultPrompt = `You are LifeHub AI, an intelligent assistant that helps users manage all aspects of their life.

You have access to the user's data across various life domains:
- Financial (budgets, expenses, investments)
- Health (appointments, medications, fitness)
- Home (maintenance, inventory)
- Vehicles (service records, insurance)
- Insurance (policies, claims)
- And more...

Provide helpful, actionable advice. Be concise but thorough.
When suggesting actions, be specific about what the user should do.
If you need more information, ask clarifying questions.`

    this.conversationHistory = [
      {
        role: 'system',
        content: systemPrompt || defaultPrompt,
      },
    ]
  }

  /**
   * Send a message and get a response
   */
  async chat(message: string, context?: Record<string, any> | AIContext, conversationId?: string): Promise<AssistantResponse> {
    // Add context to the message if provided
    let enrichedMessage = message
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n')
      enrichedMessage = `Context:\n${contextStr}\n\nUser message: ${message}`
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: enrichedMessage,
    })

    // Try AI API if available
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: this.conversationHistory,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const assistantMessage = data.choices[0]?.message?.content || ''

          // Add assistant response to history
          this.conversationHistory.push({
            role: 'assistant',
            content: assistantMessage,
          })

          return this.parseResponse(assistantMessage)
        }
      } catch (error) {
        console.error('AI API error:', error)
      }
    }

    // Fallback response
    return this.getFallbackResponse(message)
  }

  /**
   * Parse AI response and extract suggestions/actions
   */
  private parseResponse(message: string): AssistantResponse {
    const suggestions: string[] = []
    const actions: { type: string; label: string; data?: any }[] = []

    // Extract bullet points as suggestions
    const bulletMatches = message.match(/[•\-\*]\s*([^\n]+)/g)
    if (bulletMatches) {
      bulletMatches.slice(0, 3).forEach((match) => {
        suggestions.push(match.replace(/^[•\-\*]\s*/, '').trim())
      })
    }

    // Look for action keywords
    if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('appointment')) {
      actions.push({ type: 'schedule', label: 'Schedule Appointment' })
    }
    if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('expense')) {
      actions.push({ type: 'budget', label: 'Review Budget' })
    }
    if (message.toLowerCase().includes('add') || message.toLowerCase().includes('create')) {
      actions.push({ type: 'add', label: 'Add New Item' })
    }

    return {
      message,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      actions: actions.length > 0 ? actions : undefined,
    }
  }

  /**
   * Get a fallback response when AI is not available
   */
  private getFallbackResponse(message: string): AssistantResponse {
    const lowerMessage = message.toLowerCase()

    // Budget/Financial questions
    if (lowerMessage.includes('budget') || lowerMessage.includes('money') || lowerMessage.includes('expense')) {
      return {
        message: `Here are some tips for managing your finances:

• Track all your expenses to understand spending patterns
• Set realistic budget categories based on your income
• Aim to save at least 20% of your income
• Review your budget monthly and adjust as needed

Would you like me to help you set up a budget or review your spending?`,
        suggestions: ['Create a budget', 'Track expenses', 'Set savings goals'],
        actions: [
          { type: 'navigate', label: 'Go to Budget Tools', data: { path: '/tools' } },
        ],
      }
    }

    // Health questions
    if (lowerMessage.includes('health') || lowerMessage.includes('doctor') || lowerMessage.includes('medical')) {
      return {
        message: `For your health management, I recommend:

• Schedule regular check-ups with your healthcare providers
• Keep track of medications and their schedules
• Log symptoms and health metrics
• Maintain up-to-date insurance information

Would you like help tracking your health records?`,
        suggestions: ['Add health record', 'Schedule appointment', 'Track medications'],
        actions: [
          { type: 'navigate', label: 'Health Domain', data: { path: '/domains/health' } },
        ],
      }
    }

    // Vehicle questions
    if (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('maintenance')) {
      return {
        message: `To keep your vehicles in top shape:

• Follow the manufacturer's maintenance schedule
• Keep records of all services and repairs
• Monitor fluid levels and tire pressure regularly
• Track fuel efficiency to spot potential issues early

Need help tracking your vehicle maintenance?`,
        suggestions: ['Add vehicle', 'Log maintenance', 'Set service reminder'],
        actions: [
          { type: 'navigate', label: 'Vehicles Domain', data: { path: '/domains/vehicles' } },
        ],
      }
    }

    // Default response
    return {
      message: `I'm here to help you manage your life better! I can assist with:

• Financial planning and budgeting
• Health tracking and appointments
• Home maintenance schedules
• Vehicle service records
• Insurance policies
• And much more!

What would you like help with today?`,
      suggestions: ['Show my tasks', 'Review budget', 'Check reminders'],
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    const systemMessage = this.conversationHistory.find((m) => m.role === 'system')
    this.conversationHistory = systemMessage ? [systemMessage] : []
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory]
  }
}

// Legacy export for backward compatibility
export function processIntelligentAssistantRequest() {
  return null
}

// Default instance
let defaultAssistant: IntelligentAssistant | null = null

export function getDefaultAssistant(): IntelligentAssistant {
  if (!defaultAssistant) {
    defaultAssistant = new IntelligentAssistant()
    defaultAssistant.initialize()
  }
  return defaultAssistant
}
