/**
 * Intent Classifier
 * Analyzes user requests to determine intent and required actions
 */

import type { UserContext } from '../services/user-context-builder'
import type { Business } from '../services/business-search'

export interface Intent {
  category: 'price_check' | 'order' | 'appointment' | 'inquiry' | 'comparison'
  confidence: number
  requiredInfo: string[]
  suggestedBusinesses?: string[]
  estimatedCost?: number
  urgency: 'low' | 'medium' | 'high'
  needsUserApproval: boolean
}

export interface CallPlan {
  businesses: Business[]
  callObjective: string
  questionsToAsk: string[]
  expectedInfo: string[]
  maxCallDuration: number
  userContext: string
}

export class IntentClassifier {
  /**
   * Classify user intent from request
   */
  async classifyIntent(
    userRequest: string,
    userContext?: UserContext
  ): Promise<Intent> {
    const requestLower = userRequest.toLowerCase()

    // Detect category
    let category: Intent['category'] = 'inquiry'
    let confidence = 0.5

    // Price check patterns
    if (this.matchesPattern(requestLower, [
      'how much',
      'price',
      'cost',
      'quote',
      'get quotes',
      'find prices'
    ])) {
      category = 'price_check'
      confidence = 0.9
    }

    // Order patterns
    if (this.matchesPattern(requestLower, [
      'order',
      'buy',
      'purchase',
      'get me',
      'i want',
      'i need'
    ])) {
      category = 'order'
      confidence = 0.85
    }

    // Appointment patterns
    if (this.matchesPattern(requestLower, [
      'appointment',
      'book',
      'schedule',
      'reserve',
      'reservation'
    ])) {
      category = 'appointment'
      confidence = 0.9
    }

    // Comparison patterns
    if (this.matchesPattern(requestLower, [
      'compare',
      'best',
      'cheapest',
      'find the',
      'which is better'
    ])) {
      category = 'comparison'
      confidence = 0.85
    }

    // Determine required info
    const requiredInfo = this.extractRequiredInfo(requestLower, category)

    // Detect urgency
    const urgency = this.detectUrgency(requestLower)

    // Determine if user approval needed
    const needsUserApproval = category === 'order' || category === 'appointment'

    return {
      category,
      confidence,
      requiredInfo,
      urgency,
      needsUserApproval
    }
  }

  /**
   * Generate call plan
   */
  async generateCallPlan(
    intent: Intent,
    userRequest: string,
    businesses: Business[],
    userContext?: UserContext
  ): Promise<CallPlan> {
    const callObjective = this.generateCallObjective(intent, userRequest)
    const questionsToAsk = this.generateQuestions(intent, userRequest)
    const expectedInfo = this.generateExpectedInfo(intent)
    const maxCallDuration = this.estimateCallDuration(intent)
    const contextSummary = this.buildContextSummary(userContext)

    return {
      businesses,
      callObjective,
      questionsToAsk,
      expectedInfo,
      maxCallDuration,
      userContext: contextSummary
    }
  }

  /**
   * Generate call objective
   */
  private generateCallObjective(intent: Intent, userRequest: string): string {
    switch (intent.category) {
      case 'price_check':
        return `Get pricing information for: ${userRequest}`
      
      case 'order':
        return `Place order for: ${userRequest}`
      
      case 'appointment':
        return `Schedule appointment for: ${userRequest}`
      
      case 'comparison':
        return `Gather information to compare options for: ${userRequest}`
      
      default:
        return `Inquire about: ${userRequest}`
    }
  }

  /**
   * Generate questions to ask
   */
  private generateQuestions(intent: Intent, userRequest: string): string[] {
    const questions: string[] = []

    switch (intent.category) {
      case 'price_check':
        questions.push(
          'What is the base price?',
          'Are there any additional fees?',
          'Do you have any current promotions or discounts?',
          'How long is this price valid?'
        )
        break

      case 'order':
        questions.push(
          'Is this item available?',
          'What is the total cost including fees?',
          'How long will it take?',
          'What payment methods do you accept?'
        )
        break

      case 'appointment':
        questions.push(
          'What is your earliest available appointment?',
          'How long will the appointment take?',
          'What is the cost?',
          'What should I bring?'
        )
        break

      case 'comparison':
        questions.push(
          'What options do you have?',
          'What are the prices for each option?',
          'What is included in each option?',
          'What do you recommend?'
        )
        break
    }

    return questions
  }

  /**
   * Generate expected information
   */
  private generateExpectedInfo(intent: Intent): string[] {
    switch (intent.category) {
      case 'price_check':
        return ['price', 'currency', 'fees', 'discounts', 'validity']
      
      case 'order':
        return ['price', 'availability', 'delivery_time', 'confirmation_number']
      
      case 'appointment':
        return ['available_dates', 'duration', 'cost', 'requirements']
      
      case 'comparison':
        return ['options', 'prices', 'features', 'recommendation']
      
      default:
        return ['general_information']
    }
  }

  /**
   * Estimate call duration
   */
  private estimateCallDuration(intent: Intent): number {
    switch (intent.category) {
      case 'price_check':
        return 90 // seconds
      
      case 'order':
        return 180 // seconds
      
      case 'appointment':
        return 150 // seconds
      
      case 'comparison':
        return 120 // seconds
      
      default:
        return 60 // seconds
    }
  }

  /**
   * Build context summary for AI
   */
  private buildContextSummary(userContext?: UserContext): string {
    if (!userContext) return ''

    const parts: string[] = []

    // User name
    parts.push(`Customer: ${userContext.user.name}`)

    // Location
    if (userContext.location) {
      parts.push(`Location: ${userContext.location.city}, ${userContext.location.state}`)
    }

    // Budget
    if (userContext.preferences.maxBudget) {
      parts.push(`Budget: Up to $${userContext.preferences.maxBudget}`)
    }

    // Vehicle (if relevant)
    if (userContext.domains.vehicles?.[0]) {
      const v = userContext.domains.vehicles[0].metadata || {}
      if (v.make && v.model) {
        parts.push(`Vehicle: ${v.year || ''} ${v.make} ${v.model}`)
      }
    }

    // Dietary restrictions (for food orders)
    if (userContext.preferences.dietaryRestrictions && userContext.preferences.dietaryRestrictions.length > 0) {
      parts.push(`Dietary: ${userContext.preferences.dietaryRestrictions.join(', ')}`)
    }

    return parts.join(' | ')
  }

  /**
   * Match patterns
   */
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern))
  }

  /**
   * Extract required info
   */
  private extractRequiredInfo(text: string, category: Intent['category']): string[] {
    const info: string[] = []

    // Always need business/provider
    info.push('business_name')

    if (category === 'price_check' || category === 'order') {
      info.push('price')
    }

    if (category === 'order') {
      info.push('delivery_address', 'payment_method')
    }

    if (category === 'appointment') {
      info.push('preferred_date', 'preferred_time')
    }

    return info
  }

  /**
   * Detect urgency
   */
  private detectUrgency(text: string): 'low' | 'medium' | 'high' {
    if (this.matchesPattern(text, [
      'urgent',
      'asap',
      'emergency',
      'right now',
      'immediately'
    ])) {
      return 'high'
    }

    if (this.matchesPattern(text, [
      'soon',
      'today',
      'this week'
    ])) {
      return 'medium'
    }

    return 'low'
  }
}

// Singleton instance
export const intentClassifier = new IntentClassifier()

