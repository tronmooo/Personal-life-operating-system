/**
 * OpenAI API Integration Service
 * 
 * Provides AI chat, completions, and assistant features
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIService {
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: request.model || 'gpt-4-turbo-preview',
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get AI insights for life domain data
   */
  async getLifeInsights(domain: string, data: any): Promise<string> {
    const prompt = `Analyze this ${domain} data and provide actionable insights:\n\n${JSON.stringify(data, null, 2)}\n\nProvide 3-5 specific, actionable recommendations.`

    const response = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a life optimization expert providing personalized insights and recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || 'No insights available'
  }

  /**
   * Get financial advice
   */
  async getFinancialAdvice(financialData: any): Promise<string> {
    const prompt = `Review this financial data and provide expert advice:\n\nIncome: $${financialData.income}\nExpenses: $${financialData.expenses}\nSavings: $${financialData.savings}\nDebts: $${financialData.debts}\n\nProvide specific financial recommendations.`

    const response = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a certified financial advisor providing professional advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    return response.choices[0]?.message?.content || 'No advice available'
  }

  /**
   * Get health recommendations
   */
  async getHealthRecommendations(healthData: any): Promise<string> {
    const prompt = `Based on this health data, provide wellness recommendations:\n\n${JSON.stringify(healthData, null, 2)}\n\nProvide specific, actionable health advice.`

    const response = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a wellness expert providing health and fitness recommendations. Always include disclaimers to consult healthcare professionals.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    return response.choices[0]?.message?.content || 'No recommendations available'
  }

  /**
   * Smart text summarization
   */
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    const response = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: `Summarize the following text in ${maxLength} characters or less.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 100
    })

    return response.choices[0]?.message?.content || text.substring(0, maxLength)
  }

  /**
   * Generate goal action plan
   */
  async generateGoalPlan(goalData: {
    title: string
    targetValue: number
    currentValue: number
    targetDate: string
  }): Promise<string> {
    const prompt = `Create a detailed action plan for this goal:
    
Goal: ${goalData.title}
Current: ${goalData.currentValue}
Target: ${goalData.targetValue}
Deadline: ${goalData.targetDate}

Provide a step-by-step action plan with milestones and timeline.`

    const response = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a goal achievement coach creating actionable plans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    return response.choices[0]?.message?.content || 'Unable to generate plan'
  }
}

// Export singleton instance
export const openAIService = new OpenAIService()






