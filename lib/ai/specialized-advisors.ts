/**
 * Specialized AI Advisors for Different Domains
 * Provides domain-specific AI advice and insights
 */

import type { Domain } from '@/types/domains'

interface AdvisorContext {
  userId: string
  domain: string
  items: any[]
}

interface Advisor {
  domain: Domain
  name: string
  description: string
  ask: (question: string, context: AdvisorContext) => Promise<string>
}

// Base advisor implementation
class BaseAdvisor implements Advisor {
  domain: Domain
  name: string
  description: string
  private apiKey?: string

  constructor(domain: Domain, name: string, description: string, apiKey?: string) {
    this.domain = domain
    this.name = name
    this.description = description
    this.apiKey = apiKey
  }

  async ask(question: string, context: AdvisorContext): Promise<string> {
    // Check if we have an API key for AI responses
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(context),
              },
              {
                role: 'user',
                content: question,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          return data.choices[0]?.message?.content || this.getFallbackResponse(question, context)
        }
      } catch (error) {
        console.error('AI API error:', error)
      }
    }

    // Fallback to rule-based responses
    return this.getFallbackResponse(question, context)
  }

  private getSystemPrompt(context: AdvisorContext): string {
    const itemsInfo = context.items.length > 0 
      ? `The user has ${context.items.length} items in their ${context.domain} domain.` 
      : `The user hasn't added any items to their ${context.domain} domain yet.`

    return `You are ${this.name}, a specialized AI advisor for ${this.domain} matters. ${this.description}

Current context:
${itemsInfo}

Provide helpful, actionable advice based on the user's question. Be concise but thorough.
If you don't have enough information, ask clarifying questions.`
  }

  private getFallbackResponse(question: string, context: AdvisorContext): string {
    const itemCount = context.items.length
    
    const domainTips: Record<string, string[]> = {
      financial: [
        'Consider creating an emergency fund with 3-6 months of expenses.',
        'Review your budget monthly to track spending patterns.',
        'Look into tax-advantaged accounts like 401(k) or IRA.',
        'Pay off high-interest debt first using the avalanche method.',
      ],
      health: [
        'Schedule regular check-ups with your healthcare provider.',
        'Aim for 7-9 hours of sleep per night.',
        'Stay hydrated - drink at least 8 glasses of water daily.',
        'Track your health metrics to identify patterns.',
      ],
      vehicles: [
        'Keep up with regular maintenance schedules.',
        'Check tire pressure monthly for safety and fuel efficiency.',
        'Keep records of all services and repairs.',
        'Consider the total cost of ownership when buying.',
      ],
      home: [
        'Create a maintenance schedule for seasonal tasks.',
        'Keep an inventory of valuable items for insurance.',
        'Regular HVAC maintenance can save on energy costs.',
        'Check smoke detectors and change batteries yearly.',
      ],
      insurance: [
        'Review your coverage annually to ensure adequate protection.',
        'Compare quotes from multiple providers before renewing.',
        'Bundle policies for potential discounts.',
        'Understand your deductibles and coverage limits.',
      ],
    }

    const tips = domainTips[context.domain] || [
      `Track your ${context.domain} items to stay organized.`,
      `Regular reviews help you stay on top of ${context.domain} matters.`,
      `Set reminders for important ${context.domain} deadlines.`,
    ]

    const baseResponse = itemCount > 0
      ? `Based on your ${itemCount} ${context.domain} items, here are some suggestions:`
      : `I'd recommend starting by adding your ${context.domain} items to track. Here are some general tips:`

    const relevantTips = tips.slice(0, 3).map(tip => `• ${tip}`).join('\n')

    return `${baseResponse}\n\n${relevantTips}\n\nFeel free to ask more specific questions about your ${context.domain} situation!`
  }
}

// Advisor instances for each domain
const advisorConfigs: Record<string, { name: string; description: string }> = {
  financial: {
    name: 'Financial Advisor',
    description: 'I specialize in budgeting, investments, debt management, and financial planning.',
  },
  health: {
    name: 'Health Advisor',
    description: 'I help with health tracking, wellness tips, and understanding health metrics.',
  },
  insurance: {
    name: 'Insurance Advisor',
    description: 'I assist with insurance coverage analysis, policy comparisons, and claims.',
  },
  home: {
    name: 'Home Advisor',
    description: 'I provide guidance on home maintenance, improvements, and property management.',
  },
  vehicles: {
    name: 'Vehicle Advisor',
    description: 'I help with vehicle maintenance, repairs, and car buying decisions.',
  },
  appliances: {
    name: 'Appliance Advisor',
    description: 'I assist with appliance maintenance, troubleshooting, and replacement decisions.',
  },
  pets: {
    name: 'Pet Care Advisor',
    description: 'I provide guidance on pet health, nutrition, and care.',
  },
  education: {
    name: 'Education Advisor',
    description: 'I help with educational planning, certifications, and learning paths.',
  },
  relationships: {
    name: 'Relationships Advisor',
    description: 'I assist with managing important contacts and relationship milestones.',
  },
  digital: {
    name: 'Digital Advisor',
    description: 'I help manage digital assets, subscriptions, and online accounts.',
  },
  mindfulness: {
    name: 'Wellness Advisor',
    description: 'I provide guidance on mindfulness, meditation, and mental well-being.',
  },
  fitness: {
    name: 'Fitness Advisor',
    description: 'I help with workout planning, exercise routines, and fitness goals.',
  },
  nutrition: {
    name: 'Nutrition Advisor',
    description: 'I assist with meal planning, diet tracking, and nutritional guidance.',
  },
}

/**
 * Get a specialized advisor for a specific domain
 */
export function getAdvisor(domain: Domain, apiKey?: string): Advisor {
  const config = advisorConfigs[domain] || {
    name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Advisor`,
    description: `I help with ${domain}-related questions and management.`,
  }

  return new BaseAdvisor(domain, config.name, config.description, apiKey)
}

/**
 * Get all available advisors
 */
export function getAllAdvisors(): { domain: string; name: string; description: string }[] {
  return Object.entries(advisorConfigs).map(([domain, config]) => ({
    domain,
    ...config,
  }))
}

/**
 * Check if a domain has a specialized advisor
 */
export function hasAdvisor(domain: string): boolean {
  return domain in advisorConfigs
}

// Legacy export for backward compatibility
export function getSpecializedAdvisor() {
  return null
}
