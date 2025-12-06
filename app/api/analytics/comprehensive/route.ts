import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Domain } from '@/types/domains'

interface FinancialHealthScore {
  score: number
  incomeVsExpenses: {
    income: number
    expenses: number
    difference: number
    ratio: number
  }
  debtToIncome: {
    totalDebt: number
    monthlyIncome: number
    ratio: number
  }
  emergencyFund: {
    current: number
    target: number
    monthsCovered: number
    status: 'excellent' | 'good' | 'low' | 'critical'
  }
}

interface DomainActivity {
  domain: Domain
  count: number
  lastActivity: string | null
  trend: number // % change from previous period
  score: number // 0-100
}

interface CostAnalysis {
  totalMonthlyCost: number
  breakdown: {
    insurance: number
    subscriptions: number
    bills: number
    maintenance: number
    other: number
  }
  byDomain: Record<string, number>
}

interface TrendDetection {
  domain: Domain
  metric: string
  change: number // percentage
  period: string
  status: 'increased' | 'decreased' | 'stable'
  message: string
}

interface PredictiveAnalytics {
  budgetForecast: {
    projectedSpending: number
    currentBudget: number
    overageAmount: number
    confidence: number
  }
  recommendations: string[]
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30' // days

    // Fetch all domain entries for user
    const { data: entries, error: entriesError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }

    const now = new Date()
    const daysAgo = parseInt(timeRange)
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Filter entries by time range
    const currentEntries = entries?.filter(e => new Date(e.created_at) >= startDate) || []
    const previousEntries = entries?.filter(e => 
      new Date(e.created_at) >= previousStartDate && 
      new Date(e.created_at) < startDate
    ) || []

    // 1. FINANCIAL HEALTH SCORE
    const financialHealth = calculateFinancialHealth(entries || [])

    // 2. LIFE BALANCE (21 DOMAINS ACTIVITY)
    const lifeBalance = calculateLifeBalance(currentEntries, previousEntries)

    // 3. COST ANALYSIS
    const costAnalysis = calculateCostAnalysis(entries || [])

    // 4. TREND DETECTION
    const trends = detectTrends(currentEntries, previousEntries)

    // 5. PREDICTIVE ANALYTICS
    const predictions = generatePredictiveAnalytics(entries || [], costAnalysis)

    return NextResponse.json({
      success: true,
      data: {
        financialHealth,
        lifeBalance,
        costAnalysis,
        trends,
        predictions,
        metadata: {
          totalEntries: entries?.length || 0,
          timeRange: `${timeRange} days`,
          generatedAt: new Date().toISOString(),
        }
      }
    })

  } catch (error: any) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateFinancialHealth(entries: any[]): FinancialHealthScore {
  const financialEntries = entries.filter(e => e.domain === 'financial')
  
  // Calculate income vs expenses
  let totalIncome = 0
  let totalExpenses = 0
  let totalDebt = 0
  let emergencyFundBalance = 0

  financialEntries.forEach(entry => {
    const metadata = entry.metadata || {}
    const amount = parseFloat(metadata.amount || metadata.balance || metadata.value || 0)
    
    // Income
    if (metadata.transactionType === 'income' || metadata.type === 'income') {
      totalIncome += amount
    }
    
    // Expenses
    if (metadata.transactionType === 'expense' || metadata.type === 'expense') {
      totalExpenses += Math.abs(amount)
    }
    
    // Debt (loans, credit cards with negative balance)
    if (metadata.accountType === 'loan' || metadata.accountType === 'credit card') {
      if (amount < 0) totalDebt += Math.abs(amount)
    }
    
    // Emergency fund (savings accounts)
    if (metadata.accountType === 'savings' && metadata.title?.toLowerCase().includes('emergency')) {
      emergencyFundBalance += amount
    }
  })

  // Monthly income (assume entries span multiple months)
  const monthlyIncome = totalIncome > 0 ? totalIncome : 5000 // fallback estimate
  const monthlyExpenses = totalExpenses

  // Debt-to-income ratio
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) : 0

  // Emergency fund target (3-6 months of expenses)
  const targetEmergencyFund = monthlyExpenses * 3
  const monthsCovered = monthlyExpenses > 0 ? (emergencyFundBalance / monthlyExpenses) : 0
  
  let emergencyStatus: 'excellent' | 'good' | 'low' | 'critical' = 'critical'
  if (monthsCovered >= 6) emergencyStatus = 'excellent'
  else if (monthsCovered >= 3) emergencyStatus = 'good'
  else if (monthsCovered >= 1) emergencyStatus = 'low'

  // Calculate overall financial health score (0-100)
  let score = 50 // base score
  
  // Income vs expenses (30 points)
  if (monthlyIncome > monthlyExpenses) {
    score += 30 * ((monthlyIncome - monthlyExpenses) / monthlyIncome)
  }
  
  // Debt-to-income (25 points) - lower is better
  if (debtToIncomeRatio < 0.36) {
    score += 25 * (1 - debtToIncomeRatio / 0.36)
  }
  
  // Emergency fund (25 points)
  score += Math.min(25, (monthsCovered / 6) * 25)

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    incomeVsExpenses: {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      difference: monthlyIncome - monthlyExpenses,
      ratio: monthlyExpenses > 0 ? monthlyIncome / monthlyExpenses : 0
    },
    debtToIncome: {
      totalDebt,
      monthlyIncome,
      ratio: debtToIncomeRatio
    },
    emergencyFund: {
      current: emergencyFundBalance,
      target: targetEmergencyFund,
      monthsCovered,
      status: emergencyStatus
    }
  }
}

function calculateLifeBalance(currentEntries: any[], previousEntries: any[]): DomainActivity[] {
  const domains: Domain[] = [
    'financial', 'health', 'insurance', 'home', 'vehicles', 'appliances',
    'pets', 'relationships', 'digital', 'mindfulness', 'fitness', 'nutrition',
    'miscellaneous'
  ]

  return domains.map(domain => {
    const currentCount = currentEntries.filter(e => e.domain === domain).length
    const previousCount = previousEntries.filter(e => e.domain === domain).length
    
    // Calculate trend (% change)
    const trend = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100 
      : currentCount > 0 ? 100 : 0

    // Get last activity
    const domainEntries = currentEntries.filter(e => e.domain === domain)
    const lastActivity = domainEntries.length > 0 
      ? domainEntries[0].created_at 
      : null

    // Score based on activity level (0-100)
    const score = Math.min(100, currentCount * 10)

    return {
      domain,
      count: currentCount,
      lastActivity,
      trend: Math.round(trend * 10) / 10,
      score
    }
  })
}

function calculateCostAnalysis(entries: any[]): CostAnalysis {
  let insurance = 0
  let subscriptions = 0
  let bills = 0
  let maintenance = 0
  let other = 0
  
  const byDomain: Record<string, number> = {}

  entries.forEach(entry => {
    const metadata = entry.metadata || {}
    let cost = 0

    // Extract costs from different fields
    cost = parseFloat(
      metadata.monthlyPremium || 
      metadata.premium || 
      metadata.monthlyCost || 
      metadata.cost || 
      metadata.amount || 
      0
    )

    if (cost <= 0) return

    // Categorize
    if (entry.domain === 'insurance') {
      insurance += cost
    } else if (entry.domain === 'digital' || metadata.category === 'subscription') {
      subscriptions += cost
    } else if (metadata.type === 'bill' || metadata.itemType === 'bill') {
      bills += cost
    } else if (metadata.type === 'maintenance' || metadata.itemType === 'maintenance') {
      maintenance += cost
    } else {
      other += cost
    }

    // By domain
    byDomain[entry.domain] = (byDomain[entry.domain] || 0) + cost
  })

  return {
    totalMonthlyCost: insurance + subscriptions + bills + maintenance + other,
    breakdown: {
      insurance,
      subscriptions,
      bills,
      maintenance,
      other
    },
    byDomain
  }
}

function detectTrends(currentEntries: any[], previousEntries: any[]): TrendDetection[] {
  const trends: TrendDetection[] = []
  const domains: Domain[] = [
    'financial', 'health', 'insurance', 'home', 'vehicles', 'appliances',
    'pets', 'relationships', 'digital', 'mindfulness', 'fitness', 'nutrition',
    'miscellaneous'
  ]

  domains.forEach(domain => {
    const currentCount = currentEntries.filter(e => e.domain === domain).length
    const previousCount = previousEntries.filter(e => e.domain === domain).length

    if (previousCount === 0) return // skip if no previous data

    const change = ((currentCount - previousCount) / previousCount) * 100
    
    if (Math.abs(change) >= 20) { // only report significant changes
      const status = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'stable'
      const absChange = Math.abs(Math.round(change))
      
      let message = ''
      if (status === 'decreased') {
        message = `Your ${domain} activity has decreased ${absChange}% this period`
      } else if (status === 'increased') {
        message = `Your ${domain} activity has increased ${absChange}% this period`
      }

      trends.push({
        domain,
        metric: 'activity',
        change: Math.round(change * 10) / 10,
        period: 'current vs previous',
        status,
        message
      })
    }
  })

  return trends
}

function generatePredictiveAnalytics(entries: any[], costAnalysis: CostAnalysis): PredictiveAnalytics {
  const recommendations: string[] = []
  
  // Calculate projected spending (trend-based)
  const recentEntries = entries
    .filter(e => {
      const date = new Date(e.created_at)
      const daysAgo = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 30
    })
  
  const financialEntries = recentEntries.filter(e => e.domain === 'financial')
  const totalSpent = financialEntries.reduce((sum, e) => {
    const amount = parseFloat(e.metadata?.amount || e.metadata?.value || 0)
    return sum + (amount < 0 ? Math.abs(amount) : 0)
  }, 0)

  // Project next month
  const projectedSpending = totalSpent + costAnalysis.totalMonthlyCost
  const currentBudget = 5000 // TODO: get from user settings
  const overageAmount = Math.max(0, projectedSpending - currentBudget)

  // Generate recommendations
  if (overageAmount > 0) {
    recommendations.push(`Reduce spending by $${Math.round(overageAmount)} to stay within budget`)
  }
  
  if (costAnalysis.breakdown.subscriptions > 200) {
    recommendations.push('Review and cancel unused subscriptions to save money')
  }
  
  if (costAnalysis.breakdown.insurance > 1000) {
    recommendations.push('Consider comparing insurance providers for potential savings')
  }

  return {
    budgetForecast: {
      projectedSpending: Math.round(projectedSpending),
      currentBudget,
      overageAmount: Math.round(overageAmount),
      confidence: 0.75 // 75% confidence
    },
    recommendations
  }
}



