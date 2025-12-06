/**
 * AI Suggestions Engine for Financial Tools
 * Provides personalized AI-powered financial advice
 */

import OpenAI from 'openai'

// Lazy initialize OpenAI client only when needed
let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found. AI suggestions will use fallback data.')
      return null
    }
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // For client-side usage
    })
  }
  return openaiClient
}

export interface AISuggestion {
  emoji: string
  title: string
  description: string
  impact?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface ToolUserData {
  // Financial metrics
  netWorth?: number
  assets?: number
  liabilities?: number
  income?: number
  expenses?: number
  age?: number
  
  // Debt info
  debts?: Array<{
    name: string
    balance: number
    rate: number
    payment: number
  }>
  
  // Retirement info
  currentSavings?: number
  retirementAge?: number
  desiredIncome?: number
  
  // Emergency fund
  monthlyExpenses?: number
  currentEmergencySavings?: number
  
  // Budget
  budgetCategories?: Record<string, number>
  totalIncome?: number
}

/**
 * Get AI suggestions for a specific financial tool
 */
export async function getAISuggestions(
  toolId: string,
  userData: ToolUserData
): Promise<AISuggestion[]> {
  try {
    const openai = getOpenAIClient()
    
    // If no API key, return fallback suggestions immediately
    if (!openai) {
      console.log('💡 Using fallback suggestions (no API key)')
      return getDefaultSuggestions(toolId)
    }
    
    const prompt = buildPrompt(toolId, userData)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a certified financial advisor AI assistant. Provide specific, actionable, and personalized financial advice. 
          
Rules:
- Be concise (2-3 sentences max per suggestion)
- Use clear, non-jargon language
- Provide specific numbers and timeframes
- Focus on actionable steps
- Be encouraging but realistic
- Always return EXACTLY 3 suggestions
- Format as JSON array with: emoji, title, description, impact (optional), priority (high/medium/low)`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) return getDefaultSuggestions(toolId)
    
    const parsed = JSON.parse(content)
    return parsed.suggestions || getDefaultSuggestions(toolId)
  } catch (error) {
    console.error('AI Suggestions error:', error)
    return getDefaultSuggestions(toolId)
  }
}

/**
 * Build prompt based on tool type and user data
 */
function buildPrompt(toolId: string, userData: ToolUserData): string {
  switch (toolId) {
    case 'net-worth':
      return `
User's Financial Profile:
- Net Worth: $${userData.netWorth?.toLocaleString() || 0}
- Assets: $${userData.assets?.toLocaleString() || 0}
- Liabilities: $${userData.liabilities?.toLocaleString() || 0}
- Monthly Income: $${userData.income?.toLocaleString() || 0}
- Monthly Expenses: $${userData.expenses?.toLocaleString() || 0}
- Age: ${userData.age || 'Unknown'}

Provide 3 specific, actionable suggestions to improve their net worth over the next 12 months.
Include estimated dollar impact when possible.

Return JSON: { "suggestions": [{ "emoji": "💰", "title": "...", "description": "...", "impact": "$X,XXX/year", "priority": "high" }, ...] }
      `
    
    case 'budget':
      return `
User's Budget Analysis:
- Total Monthly Income: $${userData.totalIncome?.toLocaleString() || 0}
- Total Monthly Expenses: $${userData.expenses?.toLocaleString() || 0}
- Spending by Category: ${JSON.stringify(userData.budgetCategories || {})}
- Savings Rate: ${userData.totalIncome && userData.expenses ? ((userData.totalIncome - userData.expenses) / userData.totalIncome * 100).toFixed(1) : 0}%

Identify 3 specific budget optimization opportunities. Focus on categories where they're overspending.

Return JSON: { "suggestions": [{ "emoji": "💡", "title": "...", "description": "...", "impact": "Save $X/month", "priority": "high" }, ...] }
      `
    
    case 'debt':
      return `
User's Debt Situation:
${userData.debts?.map((d, i) => `- Debt ${i + 1}: $${d.balance.toLocaleString()} @ ${d.rate}% APR (${d.name})`).join('\n') || 'No debts provided'}
- Monthly Income: $${userData.income?.toLocaleString() || 0}

Analyze their debt and provide 3 strategic recommendations for faster payoff.
Include estimated time savings and interest saved.

Return JSON: { "suggestions": [{ "emoji": "💳", "title": "...", "description": "...", "impact": "Save $X in interest", "priority": "high" }, ...] }
      `
    
    case 'emergency-fund':
      return `
User's Emergency Fund Status:
- Monthly Expenses: $${userData.monthlyExpenses?.toLocaleString() || 0}
- Current Emergency Savings: $${userData.currentEmergencySavings?.toLocaleString() || 0}
- Recommended Fund: $${((userData.monthlyExpenses || 0) * 6).toLocaleString()} (6 months)
- Gap: $${Math.max(0, ((userData.monthlyExpenses || 0) * 6) - (userData.currentEmergencySavings || 0)).toLocaleString()}
- Monthly Income: $${userData.income?.toLocaleString() || 0}

Provide 3 actionable strategies to build their emergency fund faster.

Return JSON: { "suggestions": [{ "emoji": "🚨", "title": "...", "description": "...", "impact": "Reach goal X months faster", "priority": "high" }, ...] }
      `
    
    case 'retirement':
      return `
User's Retirement Planning:
- Age: ${userData.age || 'Unknown'}
- Current Retirement Savings: $${userData.currentSavings?.toLocaleString() || 0}
- Target Retirement Age: ${userData.retirementAge || 65}
- Desired Retirement Income: $${userData.desiredIncome?.toLocaleString() || 0}/year
- Monthly Income: $${userData.income?.toLocaleString() || 0}

Analyze their retirement readiness and provide 3 specific actions to improve their retirement outlook.

Return JSON: { "suggestions": [{ "emoji": "🏖️", "title": "...", "description": "...", "impact": "Additional $XXX,XXX by retirement", "priority": "high" }, ...] }
      `
    
    default:
      return `
Provide 3 general financial improvement suggestions for a user with:
- Net Worth: $${userData.netWorth?.toLocaleString() || 0}
- Monthly Income: $${userData.income?.toLocaleString() || 0}
- Monthly Expenses: $${userData.expenses?.toLocaleString() || 0}

Return JSON: { "suggestions": [{ "emoji": "💡", "title": "...", "description": "...", "priority": "medium" }, ...] }
      `
  }
}

/**
 * Fallback suggestions if AI fails
 */
function getDefaultSuggestions(toolId: string): AISuggestion[] {
  const suggestions: Record<string, AISuggestion[]> = {
    'net-worth': [
      {
        emoji: '💰',
        title: 'Increase Your Savings Rate',
        description: 'Try to save at least 20% of your monthly income. Set up automatic transfers to make it effortless.',
        priority: 'high'
      },
      {
        emoji: '📈',
        title: 'Invest for Growth',
        description: 'Consider low-cost index funds for long-term wealth building. Even small amounts compound significantly over time.',
        priority: 'medium'
      },
      {
        emoji: '💳',
        title: 'Pay Down High-Interest Debt',
        description: 'Focus on eliminating credit card debt first. Every dollar of debt paid is a guaranteed return at the interest rate.',
        priority: 'high'
      }
    ],
    'budget': [
      {
        emoji: '🎯',
        title: 'Follow the 50/30/20 Rule',
        description: 'Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment.',
        priority: 'high'
      },
      {
        emoji: '🍽️',
        title: 'Reduce Dining Out',
        description: 'Most people spend 20-40% of food budget on restaurants. Try meal prepping to cut this by half.',
        priority: 'medium'
      },
      {
        emoji: '📱',
        title: 'Review Subscriptions',
        description: 'Cancel unused subscriptions and negotiate bills. Average household can save $200-300/month.',
        priority: 'medium'
      }
    ],
    'debt': [
      {
        emoji: '🎯',
        title: 'Use Avalanche Method',
        description: 'Pay minimum on all debts, then extra on highest interest rate. Saves the most money on interest.',
        priority: 'high'
      },
      {
        emoji: '💡',
        title: 'Consider Balance Transfer',
        description: 'Transfer high-interest credit card debt to 0% APR card. Can save thousands in interest if paid off during promo.',
        priority: 'medium'
      },
      {
        emoji: '💰',
        title: 'Increase Monthly Payment',
        description: 'Even an extra $50-100/month can cut years off your debt payoff timeline.',
        priority: 'high'
      }
    ],
    'emergency-fund': [
      {
        emoji: '🎯',
        title: 'Aim for 6 Months Expenses',
        description: 'Build an emergency fund covering 6 months of essential expenses. Start with $1,000 as your first milestone.',
        priority: 'high'
      },
      {
        emoji: '💡',
        title: 'Automate Your Savings',
        description: 'Set up automatic transfer of 10% of each paycheck to a high-yield savings account.',
        priority: 'high'
      },
      {
        emoji: '📈',
        title: 'Use Windfalls Wisely',
        description: 'Allocate tax refunds, bonuses, and gifts to your emergency fund until fully funded.',
        priority: 'medium'
      }
    ],
    'retirement': [
      {
        emoji: '💼',
        title: 'Max Out Employer Match',
        description: 'Always contribute enough to get full 401(k) match. It\'s free money with 100% instant return.',
        priority: 'high'
      },
      {
        emoji: '📈',
        title: 'Increase Contributions Annually',
        description: 'Boost retirement contributions by 1-2% each year. You won\'t miss it, but your future self will thank you.',
        priority: 'medium'
      },
      {
        emoji: '🎯',
        title: 'Consider Roth IRA',
        description: 'Open a Roth IRA for tax-free retirement income. You can contribute $6,500/year ($7,500 if 50+).',
        priority: 'medium'
      }
    ]
  }
  
  return suggestions[toolId] || suggestions['net-worth']
}

/**
 * Get AI analysis of financial trends
 */
export async function getFinancialAnalysis(
  monthlyData: Array<{ month: string; netWorth: number; income: number; expenses: number }>
): Promise<string> {
  try {
    const openai = getOpenAIClient()
    
    if (!openai) {
      return 'Unable to analyze trends at this time. Please ensure your OpenAI API key is configured.'
    }
    
    const prompt = `
Analyze this user's 6-month financial trend:

${monthlyData.map(m => `${m.month}: Net Worth: $${m.netWorth.toLocaleString()}, Income: $${m.income.toLocaleString()}, Expenses: $${m.expenses.toLocaleString()}`).join('\n')}

Provide a brief 2-3 sentence analysis highlighting:
1. Overall trend (improving/declining)
2. Key observation
3. One actionable recommendation
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst. Provide concise, actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
    
    return response.choices[0].message.content || 'Unable to analyze trends at this time.'
  } catch (error) {
    console.error('Financial analysis error:', error)
    return 'Unable to analyze trends at this time.'
  }
}

