/**
 * Enhanced Price Extractor
 * Extracts pricing information from call transcripts using AI
 */

export interface ExtractedPrice {
  item: string
  price: number
  currency: string
  priceType: 'fixed' | 'hourly' | 'per_unit' | 'range' | 'starting_at'
  conditions: string[]
  fees?: {
    name: string
    amount: number
  }[]
  discounts?: {
    description: string
    amount: number
  }[]
  total?: number
  validUntil?: Date
  confidence: number
}

export interface TranscriptEntry {
  speaker: 'human' | 'ai'
  message: string
  timestamp: Date
}

export class PriceExtractor {
  /**
   * Extract prices from transcript
   */
  extractPricesFromTranscript(transcript: TranscriptEntry[]): ExtractedPrice[] {
    const prices: ExtractedPrice[] = []

    for (const entry of transcript) {
      // Only look at business responses
      if (entry.speaker !== 'human') continue

      const extracted = this.extractPricesFromText(entry.message)
      prices.push(...extracted)
    }

    // Deduplicate and merge
    return this.mergePrices(prices)
  }

  /**
   * Extract prices from text
   */
  private extractPricesFromText(text: string): ExtractedPrice[] {
    const prices: ExtractedPrice[] = []

    // Pattern 1: $XX.XX or $XX
    const dollarPattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g
    let match

    while ((match = dollarPattern.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      const context = this.getContext(text, match.index, 50)

      prices.push({
        item: this.extractItemName(context),
        price: amount,
        currency: 'USD',
        priceType: this.detectPriceType(context),
        conditions: this.extractConditions(context),
        confidence: 0.9
      })
    }

    // Pattern 2: XX dollars
    const dollarsPattern = /(\d+(?:\.\d{2})?)\s*dollars?/gi
    
    while ((match = dollarsPattern.exec(text)) !== null) {
      const amount = parseFloat(match[1])
      const context = this.getContext(text, match.index, 50)

      prices.push({
        item: this.extractItemName(context),
        price: amount,
        currency: 'USD',
        priceType: this.detectPriceType(context),
        conditions: this.extractConditions(context),
        confidence: 0.85
      })
    }

    // Pattern 3: Ranges ($XX to $YY, $XX-$YY)
    const rangePattern = /\$(\d+(?:\.\d{2})?)\s*(?:to|-)\s*\$(\d+(?:\.\d{2})?)/g
    
    while ((match = rangePattern.exec(text)) !== null) {
      const min = parseFloat(match[1])
      const max = parseFloat(match[2])
      const context = this.getContext(text, match.index, 50)

      prices.push({
        item: this.extractItemName(context),
        price: (min + max) / 2, // Average
        currency: 'USD',
        priceType: 'range',
        conditions: [`Price range: $${min}-$${max}`],
        confidence: 0.8
      })
    }

    return prices
  }

  /**
   * Get context around a match
   */
  private getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length)
    const end = Math.min(text.length, index + length)
    return text.substring(start, end)
  }

  /**
   * Extract item name from context
   */
  private extractItemName(context: string): string {
    // Common product/service keywords
    const keywords = [
      'pizza', 'large', 'medium', 'small',
      'oil change', 'tire', 'brake',
      'appointment', 'service',
      'delivery', 'pickup',
      'installation', 'repair'
    ]

    for (const keyword of keywords) {
      if (context.toLowerCase().includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1)
      }
    }

    return 'Service'
  }

  /**
   * Detect price type
   */
  private detectPriceType(context: string): ExtractedPrice['priceType'] {
    const lower = context.toLowerCase()

    if (lower.includes('per hour') || lower.includes('/hour') || lower.includes('hourly')) {
      return 'hourly'
    }

    if (lower.includes('per') || lower.includes('each')) {
      return 'per_unit'
    }

    if (lower.includes('starting at') || lower.includes('starts at')) {
      return 'starting_at'
    }

    if (lower.includes('to') || lower.includes('-') || lower.includes('between')) {
      return 'range'
    }

    return 'fixed'
  }

  /**
   * Extract conditions
   */
  private extractConditions(context: string): string[] {
    const conditions: string[] = []
    const lower = context.toLowerCase()

    // Delivery fee
    if (lower.includes('delivery')) {
      conditions.push('Includes delivery')
    }

    // Tax
    if (lower.includes('plus tax') || lower.includes('+ tax')) {
      conditions.push('Plus tax')
    }

    // Additional fees
    if (lower.includes('additional') || lower.includes('extra')) {
      conditions.push('Additional fees may apply')
    }

    // Time-based
    if (lower.includes('today only') || lower.includes('this week')) {
      conditions.push('Limited time offer')
    }

    return conditions
  }

  /**
   * Merge duplicate prices
   */
  private mergePrices(prices: ExtractedPrice[]): ExtractedPrice[] {
    if (prices.length === 0) return []

    // Group by similar prices (within $1)
    const merged: ExtractedPrice[] = []
    
    for (const price of prices) {
      const existing = merged.find(p => 
        Math.abs(p.price - price.price) < 1 && 
        p.currency === price.currency
      )

      if (existing) {
        // Merge conditions
        existing.conditions = [
          ...new Set([...existing.conditions, ...price.conditions])
        ]
        // Use higher confidence
        existing.confidence = Math.max(existing.confidence, price.confidence)
      } else {
        merged.push(price)
      }
    }

    // Sort by confidence
    return merged.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Extract fees from transcript
   */
  extractFees(transcript: TranscriptEntry[]): { name: string; amount: number }[] {
    const fees: { name: string; amount: number }[] = []

    for (const entry of transcript) {
      if (entry.speaker !== 'human') continue

      const text = entry.message.toLowerCase()

      // Delivery fee
      const deliveryMatch = text.match(/delivery.*?\$(\d+(?:\.\d{2})?)|delivery.*?(\d+(?:\.\d{2})?)\s*dollars?/i)
      if (deliveryMatch) {
        fees.push({
          name: 'Delivery',
          amount: parseFloat(deliveryMatch[1] || deliveryMatch[2])
        })
      }

      // Service fee
      const serviceMatch = text.match(/service.*?\$(\d+(?:\.\d{2})?)|service.*?(\d+(?:\.\d{2})?)\s*dollars?/i)
      if (serviceMatch) {
        fees.push({
          name: 'Service Fee',
          amount: parseFloat(serviceMatch[1] || serviceMatch[2])
        })
      }

      // Tax
      const taxMatch = text.match(/tax.*?\$(\d+(?:\.\d{2})?)|tax.*?(\d+(?:\.\d{2})?)\s*dollars?/i)
      if (taxMatch) {
        fees.push({
          name: 'Tax',
          amount: parseFloat(taxMatch[1] || taxMatch[2])
        })
      }
    }

    return fees
  }

  /**
   * Calculate total with fees
   */
  calculateTotal(basePrice: number, fees: { name: string; amount: number }[]): number {
    return fees.reduce((total, fee) => total + fee.amount, basePrice)
  }

  /**
   * Format price for display
   */
  formatPrice(price: ExtractedPrice): string {
    const formatted = `$${price.price.toFixed(2)}`

    switch (price.priceType) {
      case 'hourly':
        return `${formatted}/hour`
      case 'per_unit':
        return `${formatted} each`
      case 'starting_at':
        return `Starting at ${formatted}`
      case 'range':
        return `${formatted} (varies)`
      default:
        return formatted
    }
  }
}

// Singleton instance
export const priceExtractor = new PriceExtractor()
















