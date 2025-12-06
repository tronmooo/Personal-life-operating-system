/**
 * Exchange Rate API Integration Service
 * 
 * Provides real-time currency conversion rates
 * Uses exchangerate-api.com (free tier available)
 */

export interface ExchangeRates {
  base: string
  rates: { [currency: string]: number }
  timestamp: Date
}

export interface ConversionResult {
  from: string
  to: string
  amount: number
  result: number
  rate: number
}

export class ExchangeRateService {
  private apiKey: string
  private baseURL = 'https://v6.exchangerate-api.com/v6'
  private cachedRates: ExchangeRates | null = null
  private cacheExpiry: Date | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY || 'demo'
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'demo'
  }

  /**
   * Get all exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    // Check cache (valid for 1 hour)
    if (this.cachedRates && this.cacheExpiry && new Date() < this.cacheExpiry) {
      return this.cachedRates
    }

    const url = `${this.baseURL}/${this.apiKey}/latest/${baseCurrency}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Exchange Rate API Error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.result !== 'success') {
        throw new Error('Failed to fetch exchange rates')
      }

      this.cachedRates = {
        base: data.base_code,
        rates: data.conversion_rates,
        timestamp: new Date()
      }

      // Cache for 1 hour
      this.cacheExpiry = new Date()
      this.cacheExpiry.setHours(this.cacheExpiry.getHours() + 1)

      return this.cachedRates
    } catch (error) {
      // Return fallback rates if API fails
      console.warn('Exchange rate API unavailable, using fallback rates')
      return this.getFallbackRates(baseCurrency)
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(from: string, to: string, amount: number): Promise<ConversionResult> {
    const rates = await this.getExchangeRates(from)
    const rate = rates.rates[to]

    if (!rate) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`)
    }

    return {
      from,
      to,
      amount,
      result: amount * rate,
      rate
    }
  }

  /**
   * Get popular currency pairs
   */
  getPopularCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN']
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
      INR: '₹',
      MXN: '$',
      BRL: 'R$',
      KRW: '₩'
    }
    return symbols[currency] || currency
  }

  /**
   * Fallback rates (approximate) when API is unavailable
   */
  private getFallbackRates(baseCurrency: string): ExchangeRates {
    // These are approximate rates as of late 2024
    const usdRates: { [key: string]: number } = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CAD: 1.36,
      AUD: 1.52,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.25,
      MXN: 17.15,
      BRL: 4.95,
      KRW: 1310
    }

    // Convert to requested base currency
    if (baseCurrency === 'USD') {
      return {
        base: 'USD',
        rates: usdRates,
        timestamp: new Date()
      }
    }

    const baseRate = usdRates[baseCurrency]
    if (!baseRate) {
      throw new Error(`Unsupported base currency: ${baseCurrency}`)
    }

    const convertedRates: { [key: string]: number } = {}
    Object.entries(usdRates).forEach(([currency, rate]) => {
      convertedRates[currency] = rate / baseRate
    })

    return {
      base: baseCurrency,
      rates: convertedRates,
      timestamp: new Date()
    }
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService()






