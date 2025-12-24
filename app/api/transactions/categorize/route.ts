import { NextRequest, NextResponse } from 'next/server'
import * as AI from '@/lib/services/ai-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json()
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 })
    }

    const makePrompt = (tx: any) => `Analyze this transaction and respond with JSON fields: category, confidence, is_recurring, recurring_frequency, recurring_confidence, should_be_bill, bill_suggestion.
Merchant: ${tx.merchant_name || 'Unknown'}
Description: ${tx.name}
Amount: $${Math.abs(tx.amount).toFixed(2)}
Date: ${tx.date}
Current Category: ${tx.primary_category || 'None'}`

    const results: any[] = []
    for (const tx of transactions) {
      try {
        const aiResponse = await AI.requestAI({
          prompt: makePrompt(tx),
          systemPrompt: 'You are a financial transaction categorization assistant. Reply only with valid JSON.',
          temperature: 0.2,
          maxTokens: 200
        })

        const content = aiResponse.content || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        results.push({ id: tx.id, ...parsed })
      } catch (err) {
        // Fallback minimal mapping
        results.push({
          id: tx.id,
          category: 'finance',
          confidence: 0.5,
          is_recurring: false,
          should_be_bill: false,
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Categorization error:', error)
    return NextResponse.json({ error: error.message || 'Failed to categorize' }, { status: 500 })
  }
}




