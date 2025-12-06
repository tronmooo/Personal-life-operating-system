/**
 * Service Comparator Engine
 * AI-powered service comparison for insurance, utilities, and more
 */

export interface ServiceProvider {
  id: string
  name: string
  type: string
  price: number
  features: string[]
  rating: number
  coverage?: Record<string, any>
  terms?: string
  pros: string[]
  cons: string[]
}

export interface ComparisonRequest {
  serviceType: string
  location?: string
  requirements?: Record<string, any>
  budget?: number
  priorities?: string[]
}

export interface ComparisonResult {
  providers: ServiceProvider[]
  bestMatch: ServiceProvider | null
  savings: number
  recommendations: string[]
  factors: {
    name: string
    weight: number
    description: string
  }[]
}

export class ServiceComparatorEngine {
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY
  }

  /**
   * Static compare method for API route compatibility
   */
  static async compare(request: any): Promise<any> {
    const engine = new ServiceComparatorEngine()
    // Transform the request format if needed
    const transformedRequest: ComparisonRequest = {
      serviceType: request.service_type || request.serviceType,
      location: request.user_profile?.zip || request.location,
      budget: request.current_bill?.amount || request.budget,
      requirements: request.requirements,
      priorities: request.priorities,
    }
    const result = await engine.compareProviders(transformedRequest)
    // Transform response for API compatibility
    return {
      best_match: result.bestMatch,
      provider_breakdown: result.providers.map(p => ({
        name: p.name,
        cost_analysis: {
          monthly_cost: p.price,
        },
        strengths: p.pros,
        weaknesses: p.cons,
        value_score: Math.round(p.rating * 20),
        risk_analysis: {
          provider_stability: 85,
          price_volatility: 20,
        },
      })),
      personalized_insights: result.recommendations.map(r => ({
        category: 'General',
        insight: r,
        confidence: 80,
        actionable: true,
      })),
      potential_savings: result.savings,
    }
  }

  /**
   * Compare service providers (instance method)
   */
  async compareProviders(request: ComparisonRequest): Promise<ComparisonResult> {
    const providers = await this.fetchProviders(request)
    const scoredProviders = this.scoreProviders(providers, request)
    const sortedProviders = scoredProviders.sort((a, b) => b.score - a.score)

    const bestMatch = sortedProviders.length > 0 ? sortedProviders[0].provider : null
    const avgPrice = providers.reduce((sum, p) => sum + p.price, 0) / providers.length
    const savings = bestMatch ? Math.round((avgPrice - bestMatch.price) * 12) : 0

    return {
      providers: sortedProviders.map((s) => s.provider),
      bestMatch,
      savings: Math.max(0, savings),
      recommendations: this.generateRecommendations(sortedProviders, request),
      factors: this.getComparisonFactors(request.serviceType),
    }
  }

  /**
   * Instance compare method (alias)
   */
  async compare(request: ComparisonRequest): Promise<ComparisonResult> {
    return this.compareProviders(request)
  }

  /**
   * Fetch available providers (mock data for now)
   */
  private async fetchProviders(request: ComparisonRequest): Promise<ServiceProvider[]> {
    // In a real implementation, this would call external APIs
    const mockProviders: Record<string, ServiceProvider[]> = {
      'auto-insurance': [
        {
          id: '1',
          name: 'Progressive',
          type: 'auto-insurance',
          price: 125,
          features: ['Roadside Assistance', 'Accident Forgiveness', 'Mobile App'],
          rating: 4.5,
          pros: ['Low rates for safe drivers', 'Easy claims process', 'Good mobile app'],
          cons: ['Higher rates for new drivers', 'Limited agent network'],
        },
        {
          id: '2',
          name: 'Geico',
          type: 'auto-insurance',
          price: 115,
          features: ['24/7 Customer Service', 'Multi-Policy Discount', 'Easy Quotes'],
          rating: 4.3,
          pros: ['Lowest rates overall', 'Easy online management', 'Fast claims'],
          cons: ['No local agents', 'Limited bundling options'],
        },
        {
          id: '3',
          name: 'State Farm',
          type: 'auto-insurance',
          price: 145,
          features: ['Local Agent', 'Drive Safe & Save', 'Rental Reimbursement'],
          rating: 4.6,
          pros: ['Local agents available', 'Excellent customer service', 'Many discounts'],
          cons: ['Higher base rates', 'Varies by state'],
        },
      ],
      'home-insurance': [
        {
          id: '4',
          name: 'Allstate',
          type: 'home-insurance',
          price: 180,
          features: ['HostAdvantage', 'Claim RateGuard', 'Easy Pay Plan'],
          rating: 4.2,
          pros: ['Bundle discounts', 'Claim RateGuard', 'New home discounts'],
          cons: ['Higher base rates', 'Complex policies'],
        },
        {
          id: '5',
          name: 'Liberty Mutual',
          type: 'home-insurance',
          price: 165,
          features: ['Better Car Replacement', 'New Home Discount', 'RightTrack'],
          rating: 4.0,
          pros: ['New home discounts', 'Good coverage options', 'Multi-policy savings'],
          cons: ['Average customer service', 'Higher rates in some areas'],
        },
      ],
      electricity: [
        {
          id: '6',
          name: 'Green Energy Co',
          type: 'electricity',
          price: 85,
          features: ['100% Renewable', 'Fixed Rate', 'No Contract'],
          rating: 4.4,
          pros: ['Clean energy', 'Fixed rates', 'No cancellation fees'],
          cons: ['Slightly higher rates', 'Limited areas'],
        },
        {
          id: '7',
          name: 'Budget Electric',
          type: 'electricity',
          price: 70,
          features: ['Variable Rate', 'Smart Home Integration', 'Rewards Program'],
          rating: 4.1,
          pros: ['Lowest rates', 'Smart home features', 'Rewards program'],
          cons: ['Variable rates', 'Longer contracts'],
        },
      ],
      internet: [
        {
          id: '8',
          name: 'FiberNet',
          type: 'internet',
          price: 65,
          features: ['1 Gbps Speed', 'No Data Caps', 'Free Installation'],
          rating: 4.7,
          pros: ['Fastest speeds', 'No data caps', 'Reliable connection'],
          cons: ['Limited availability', 'Higher price'],
        },
        {
          id: '9',
          name: 'CableVision',
          type: 'internet',
          price: 55,
          features: ['500 Mbps Speed', 'Bundle Options', 'Free WiFi Router'],
          rating: 4.0,
          pros: ['Good value', 'Widely available', 'Bundle options'],
          cons: ['Data caps on some plans', 'Speed can vary'],
        },
      ],
      mobile: [
        {
          id: '10',
          name: 'T-Mobile',
          type: 'mobile',
          price: 70,
          features: ['Unlimited Data', '5G Access', 'Netflix Included'],
          rating: 4.3,
          pros: ['True unlimited', '5G coverage', 'Perks included'],
          cons: ['Coverage in rural areas', 'De-prioritization during congestion'],
        },
        {
          id: '11',
          name: 'Mint Mobile',
          type: 'mobile',
          price: 30,
          features: ['Prepaid Plans', 'Unlimited Talk/Text', '5G Ready'],
          rating: 4.5,
          pros: ['Lowest prices', 'Uses T-Mobile network', 'No contracts'],
          cons: ['Must pay upfront', 'Customer service by app only'],
        },
      ],
    }

    return mockProviders[request.serviceType] || []
  }

  /**
   * Score providers based on requirements
   */
  private scoreProviders(
    providers: ServiceProvider[],
    request: ComparisonRequest
  ): { provider: ServiceProvider; score: number }[] {
    return providers.map((provider) => {
      let score = 0

      // Price score (40% weight)
      const maxPrice = Math.max(...providers.map((p) => p.price))
      const minPrice = Math.min(...providers.map((p) => p.price))
      const priceRange = maxPrice - minPrice || 1
      const priceScore = 40 * (1 - (provider.price - minPrice) / priceRange)
      score += priceScore

      // Rating score (30% weight)
      score += 30 * (provider.rating / 5)

      // Feature score (20% weight)
      const avgFeatures = providers.reduce((sum, p) => sum + p.features.length, 0) / providers.length
      score += 20 * (provider.features.length / avgFeatures)

      // Budget match (10% weight)
      if (request.budget) {
        if (provider.price <= request.budget) {
          score += 10
        } else {
          score -= 5 * ((provider.price - request.budget) / request.budget)
        }
      } else {
        score += 5 // Neutral if no budget specified
      }

      return { provider, score }
    })
  }

  /**
   * Generate recommendations based on comparison
   */
  private generateRecommendations(
    scoredProviders: { provider: ServiceProvider; score: number }[],
    request: ComparisonRequest
  ): string[] {
    const recommendations: string[] = []

    if (scoredProviders.length === 0) {
      return ['No providers found for your criteria. Try adjusting your requirements.']
    }

    const best = scoredProviders[0].provider
    const second = scoredProviders[1]?.provider

    recommendations.push(`${best.name} offers the best overall value based on price and features.`)

    if (best.rating >= 4.5) {
      recommendations.push(`${best.name} has excellent customer ratings (${best.rating}/5).`)
    }

    if (second && Math.abs(best.price - second.price) < 10) {
      recommendations.push(
        `${second.name} is a close alternative - consider comparing specific features.`
      )
    }

    if (request.budget && best.price <= request.budget * 0.8) {
      recommendations.push('You have room in your budget for additional coverage or features.')
    }

    return recommendations
  }

  /**
   * Get comparison factors for a service type
   */
  private getComparisonFactors(serviceType: string): ComparisonResult['factors'] {
    const defaultFactors = [
      { name: 'Price', weight: 0.4, description: 'Monthly cost of the service' },
      { name: 'Rating', weight: 0.3, description: 'Customer satisfaction score' },
      { name: 'Features', weight: 0.2, description: 'Included benefits and features' },
      { name: 'Budget Fit', weight: 0.1, description: 'How well it fits your budget' },
    ]

    const serviceFactors: Record<string, ComparisonResult['factors']> = {
      'auto-insurance': [
        ...defaultFactors,
        { name: 'Claims Process', weight: 0.15, description: 'Ease of filing and resolving claims' },
      ],
      'home-insurance': [
        ...defaultFactors,
        { name: 'Coverage Limits', weight: 0.15, description: 'Maximum coverage amounts' },
      ],
      internet: [
        ...defaultFactors,
        { name: 'Speed', weight: 0.2, description: 'Download and upload speeds' },
      ],
    }

    return serviceFactors[serviceType] || defaultFactors
  }

  /**
   * Get AI-powered recommendation
   */
  async getAIRecommendation(
    request: ComparisonRequest,
    userContext?: Record<string, any>
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getDefaultRecommendation(request)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a service comparison expert. Analyze the user's needs and provide a personalized recommendation for ${request.serviceType} services. Be concise and actionable.`,
            },
            {
              role: 'user',
              content: `I'm looking for ${request.serviceType} in ${request.location || 'my area'}. My budget is ${request.budget ? `$${request.budget}/month` : 'flexible'}. ${request.priorities ? `My priorities are: ${request.priorities.join(', ')}` : ''}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0]?.message?.content || this.getDefaultRecommendation(request)
      }
    } catch (error) {
      console.error('AI recommendation error:', error)
    }

    return this.getDefaultRecommendation(request)
  }

  private getDefaultRecommendation(request: ComparisonRequest): string {
    return `Based on your ${request.serviceType} needs, I recommend comparing at least 3 providers. Focus on: pricing, coverage/features, and customer reviews. ${request.budget ? `With your $${request.budget}/month budget, you have several good options.` : 'Consider setting a budget to narrow down your choices.'}`
  }
}

// Legacy export for backward compatibility
export function compareServices() {
  return null
}

// Default instance
export function getComparatorEngine(): ServiceComparatorEngine {
  return new ServiceComparatorEngine()
}
