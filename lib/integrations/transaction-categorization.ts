/**
 * Transaction Categorization with OpenAI
 * Auto-categorizes transactions and detects recurring payments
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface TransactionToCategorize {
  id: string
  merchant_name: string | null
  name: string
  amount: number
  date: string
  primary_category: string | null
}

export interface CategorizationResult {
  category: string
  confidence: number
  is_recurring: boolean
  recurring_frequency?: 'monthly' | 'weekly' | 'biweekly' | 'yearly' | null
  recurring_confidence?: number
  should_be_bill: boolean
  bill_suggestion?: string
}

// Category mapping to LifeHub domains
const CATEGORY_MAPPING: Record<string, string> = {
  // Food & Dining
  'Food and Drink': 'nutrition',
  'Restaurants': 'nutrition',
  'Groceries': 'nutrition',
  'Fast Food': 'nutrition',
  'Coffee Shops': 'nutrition',
  
  // Transportation
  'Transportation': 'vehicles',
  'Gas': 'vehicles',
  'Parking': 'vehicles',
  'Public Transportation': 'vehicles',
  'Ride Share': 'vehicles',
  'Auto & Transport': 'vehicles',
  
  // Healthcare
  'Healthcare': 'health',
  'Medical': 'health',
  'Pharmacy': 'health',
  'Doctors': 'health',
  'Dentists': 'health',
  
  // Insurance
  'Insurance': 'insurance',
  'Life Insurance': 'insurance',
  'Health Insurance': 'insurance',
  'Auto Insurance': 'insurance',
  'Home Insurance': 'insurance',
  
  // Utilities
  'Utilities': 'utilities',
  'Internet': 'utilities',
  'Phone': 'utilities',
  'Electric': 'utilities',
  'Water': 'utilities',
  'Gas Utility': 'utilities',
  
  // Entertainment
  'Entertainment': 'entertainment',
  'Movies': 'entertainment',
  'Music': 'entertainment',
  'Streaming Services': 'entertainment',
  'Games': 'entertainment',
  
  // Shopping
  'Shopping': 'shopping',
  'Clothing': 'shopping',
  'Electronics': 'shopping',
  'Home Improvement': 'home',
  
  // Education
  'Education': 'education',
  'Tuition': 'education',
  'Books': 'education',
  
  // Fitness
  'Gym': 'fitness',
  'Sports': 'fitness',
  'Fitness': 'fitness',
  
  // Travel
  'Travel': 'travel',
  'Hotels': 'travel',
  'Airfare': 'travel',
  
  // Default
  'Other': 'finance',
}

export class TransactionCategorizationService {
  private supabase = createClientComponentClient()

  /**
   * Categorize a single transaction using OpenAI
   */
  async categorizeTransaction(
    transaction: TransactionToCategorize
  ): Promise<CategorizationResult> {
    try {
      const res = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [transaction] }),
      })
      const data = await res.json()
      if (!res.ok || !data?.results) throw new Error(data?.error || 'Categorization failed')
      return data.results[0]
    } catch (error) {
      console.error('Error categorizing transaction:', error)
      return this.fallbackCategorization(transaction)
    }
  }

  /**
   * Categorize multiple transactions in batch
   */
  async categorizeTransactionsBatch(
    transactions: TransactionToCategorize[]
  ): Promise<Map<string, CategorizationResult>> {
    const results = new Map<string, CategorizationResult>()
    try {
      const res = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.results)) {
        data.results.forEach((r: CategorizationResult & { id: string }) => {
          // server returns mapped result with id
          // @ts-ignore - tolerate id on result for mapping back
          results.set((r as any).id, r)
        })
        return results
      }
      throw new Error(data?.error || 'Categorization failed')
    } catch (error) {
      console.error('Batch categorization failed, using fallback:', error)
      transactions.forEach((tx) => results.set(tx.id, this.fallbackCategorization(tx)))
      return results
    }
  }

  /**
   * Update transaction categories in database
   */
  async updateTransactionCategories(
    categorizations: Map<string, CategorizationResult>
  ): Promise<void> {
    for (const [transactionId, result] of categorizations) {
      await this.supabase
        .from('transactions')
        .update({
          auto_category: result.category,
          confidence_score: result.confidence,
          is_recurring: result.is_recurring,
          recurring_frequency: result.recurring_frequency,
          recurring_confidence: result.recurring_confidence,
          suggested_as_bill: result.should_be_bill,
        })
        .eq('id', transactionId)
    }
    
    console.log(`✅ Updated ${categorizations.size} transaction categories`)
  }

  /**
   * Detect recurring transactions using pattern analysis
   */
  async detectRecurringTransactions(userId: string): Promise<any[]> {
    // Get all transactions from last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data: transactions } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sixMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (!transactions || transactions.length === 0) {
      return []
    }
    
    // Group by merchant
    const merchantGroups = new Map<string, any[]>()
    
    for (const tx of transactions) {
      const key = tx.merchant_name || tx.name
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, [])
      }
      const group = merchantGroups.get(key)
      if (group) {
        group.push(tx)
      }
    }
    
    // Detect patterns
    const recurring: any[] = []
    
    for (const [merchant, txs] of merchantGroups) {
      if (txs.length >= 3) {
        // Check if amounts are similar
        const amounts = txs.map(t => Math.abs(t.amount))
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
        const stdDev = Math.sqrt(variance)
        
        // If standard deviation is low, amounts are consistent
        if (stdDev < avgAmount * 0.1) {
          // Check time intervals
          const dates = txs.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime())
          const intervals: number[] = []
          
          for (let i = 1; i < dates.length; i++) {
            const daysBetween = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
            intervals.push(daysBetween)
          }
          
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
          
          let frequency: string | null = null
          let confidence = 0
          
          // Determine frequency
          if (avgInterval >= 28 && avgInterval <= 32) {
            frequency = 'monthly'
            confidence = 0.9
          } else if (avgInterval >= 6 && avgInterval <= 8) {
            frequency = 'weekly'
            confidence = 0.85
          } else if (avgInterval >= 13 && avgInterval <= 16) {
            frequency = 'biweekly'
            confidence = 0.85
          } else if (avgInterval >= 360 && avgInterval <= 370) {
            frequency = 'yearly'
            confidence = 0.9
          }
          
          if (frequency && confidence > 0.7) {
            recurring.push({
              merchant,
              amount: avgAmount,
              frequency,
              confidence,
              occurrences: txs.length,
              transactions: txs,
            })
          }
        }
      }
    }
    
    return recurring
  }

  /**
   * Build categorization prompt
   */
  private buildCategorizationPrompt(tx: TransactionToCategorize): string {
    return `Analyze this transaction:
Merchant: ${tx.merchant_name || 'Unknown'}
Description: ${tx.name}
Amount: $${Math.abs(tx.amount).toFixed(2)}
Date: ${tx.date}
Current Category: ${tx.primary_category || 'None'}

Provide analysis in this JSON format:
{
  "category": "category name",
  "confidence": 0.95,
  "is_recurring": false,
  "recurring_frequency": null,
  "recurring_confidence": 0,
  "should_be_bill": false,
  "bill_suggestion": null
}

Common categories: Food and Drink, Transportation, Healthcare, Insurance, Utilities, Entertainment, Shopping, Education, Travel, Other`
  }

  /**
   * Fallback categorization when OpenAI fails
   */
  private fallbackCategorization(tx: TransactionToCategorize): CategorizationResult {
    const name = (tx.merchant_name || tx.name).toLowerCase()
    
    // Simple keyword matching
    if (name.includes('grocery') || name.includes('food') || name.includes('restaurant')) {
      return {
        category: 'nutrition',
        confidence: 0.7,
        is_recurring: false,
        should_be_bill: false,
      }
    } else if (name.includes('gas') || name.includes('fuel') || name.includes('parking')) {
      return {
        category: 'vehicles',
        confidence: 0.7,
        is_recurring: false,
        should_be_bill: false,
      }
    } else if (name.includes('insurance')) {
      return {
        category: 'insurance',
        confidence: 0.8,
        is_recurring: true,
        recurring_frequency: 'monthly',
        recurring_confidence: 0.7,
        should_be_bill: true,
        bill_suggestion: `${tx.merchant_name || tx.name} - $${Math.abs(tx.amount).toFixed(2)}/month`,
      }
    } else if (name.includes('electric') || name.includes('water') || name.includes('internet')) {
      return {
        category: 'utilities',
        confidence: 0.8,
        is_recurring: true,
        recurring_frequency: 'monthly',
        recurring_confidence: 0.8,
        should_be_bill: true,
        bill_suggestion: `${tx.merchant_name || tx.name} - $${Math.abs(tx.amount).toFixed(2)}/month`,
      }
    }
    
    return {
      category: 'finance',
      confidence: 0.5,
      is_recurring: false,
      should_be_bill: false,
    }
  }
}

/**
 * Singleton instance
 */
export const transactionCategorizationService = new TransactionCategorizationService()

