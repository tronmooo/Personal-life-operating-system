/**
 * AI-Powered Analytics Insights Generator
 * Uses Gemini API to generate natural language insights from analytics data
 */

interface AnalyticsData {
  financialHealth: number
  lifeBalance: number
  productivity: number
  wellbeing: number
  goalProgress: number
  activeDomains: string[]
  topSpending?: { category: string; amount: number }[]
  recentTrends?: { domain: string; change: number }[]
}

interface AIInsight {
  type: 'observation' | 'recommendation' | 'warning' | 'celebration'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  actionLabel?: string
}

export async function generateAIInsights(data: AnalyticsData): Promise<AIInsight[]> {
  try {
    const prompt = buildInsightsPrompt(data)
    
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, data }),
    })

    if (!response.ok) {
      console.error('AI insights API error:', response.statusText)
      return getFallbackInsights(data)
    }

    const result = await response.json()
    return result.insights || getFallbackInsights(data)
  } catch (error) {
    console.error('Failed to generate AI insights:', error)
    return getFallbackInsights(data)
  }
}

function buildInsightsPrompt(data: AnalyticsData): string {
  return `Analyze this user's life management data and provide 3-5 specific, actionable insights:

**Current Metrics:**
- Financial Health: ${data.financialHealth}/100
- Life Balance: ${data.lifeBalance}/100
- Productivity: ${data.productivity}/100
- Wellbeing: ${data.wellbeing}/100
- Goal Progress: ${data.goalProgress}/100

**Active Domains:** ${data.activeDomains.join(', ')}

**Recent Trends:**
${data.recentTrends?.map(t => `- ${t.domain}: ${t.change > 0 ? '+' : ''}${t.change}%`).join('\n') || 'No significant trends'}

Provide insights in this JSON format:
[
  {
    "type": "observation|recommendation|warning|celebration",
    "title": "Short title (max 50 chars)",
    "message": "Specific, actionable message (max 200 chars)",
    "priority": "low|medium|high",
    "actionable": true|false,
    "actionLabel": "Action button text (optional)"
  }
]

Focus on:
1. Patterns and trends
2. Specific, personalized recommendations
3. Encouraging positive behaviors
4. Addressing areas needing attention
5. Celebrating achievements

Keep insights concise, positive, and actionable.`
}

function getFallbackInsights(data: AnalyticsData): AIInsight[] {
  const insights: AIInsight[] = []

  // Financial Health Insights
  if (data.financialHealth >= 80) {
    insights.push({
      type: 'celebration',
      title: 'Excellent Financial Health',
      message: `Your financial health score of ${data.financialHealth} is outstanding! Keep up the great work managing your finances.`,
      priority: 'low',
      actionable: false,
    })
  } else if (data.financialHealth < 60) {
    insights.push({
      type: 'warning',
      title: 'Financial Health Needs Attention',
      message: `Your financial health score is ${data.financialHealth}. Consider reviewing unpaid bills and setting up automated payments.`,
      priority: 'high',
      actionable: true,
      actionLabel: 'View Bills',
    })
  }

  // Life Balance Insights
  if (data.lifeBalance < 50) {
    insights.push({
      type: 'recommendation',
      title: 'Expand Your Life Balance',
      message: `You're actively tracking ${data.activeDomains.length} domains. Try exploring more areas to get a complete picture of your life.`,
      priority: 'medium',
      actionable: true,
      actionLabel: 'Explore Domains',
    })
  }

  // Productivity Insights
  if (data.productivity > 80) {
    insights.push({
      type: 'celebration',
      title: 'Productivity Champion',
      message: `Amazing! Your ${data.productivity}% task completion rate shows you're crushing your goals. Keep the momentum!`,
      priority: 'low',
      actionable: false,
    })
  } else if (data.productivity < 50) {
    insights.push({
      type: 'recommendation',
      title: 'Boost Your Productivity',
      message: `Your task completion is at ${data.productivity}%. Break down large tasks into smaller, manageable steps.`,
      priority: 'medium',
      actionable: true,
      actionLabel: 'Review Tasks',
    })
  }

  // Wellbeing Insights
  if (data.wellbeing < 60) {
    insights.push({
      type: 'recommendation',
      title: 'Prioritize Your Wellbeing',
      message: `Your wellness activity is lower than ideal. Consider scheduling regular exercise or health checkups this week.`,
      priority: 'high',
      actionable: true,
      actionLabel: 'Log Activity',
    })
  }

  // Goal Progress Insights
  if (data.goalProgress > 70) {
    insights.push({
      type: 'celebration',
      title: 'Goals on Track',
      message: `You're ${data.goalProgress}% toward your goals! Your consistent progress is paying off.`,
      priority: 'low',
      actionable: false,
    })
  }

  // Trend-based insights
  if (data.recentTrends && data.recentTrends.length > 0) {
    const biggestIncrease = data.recentTrends.reduce((max, t) => 
      t.change > max.change ? t : max
    )
    
    if (biggestIncrease.change > 20) {
      insights.push({
        type: 'observation',
        title: `${biggestIncrease.domain} Activity Spike`,
        message: `Your ${biggestIncrease.domain} activity increased ${biggestIncrease.change}% recently. This is a positive trend!`,
        priority: 'low',
        actionable: false,
      })
    }
  }

  return insights.slice(0, 5) // Return max 5 insights
}

/**
 * Generate a voice summary of analytics
 */
export function generateVoiceSummary(data: AnalyticsData): string {
  const parts: string[] = []

  parts.push('Here is your analytics summary.')

  // Overall score
  const overallScore = Math.round(
    (data.financialHealth + data.lifeBalance + data.productivity + 
     data.wellbeing + data.goalProgress) / 5
  )
  
  if (overallScore >= 80) {
    parts.push(`Your overall life score is ${overallScore}, which is excellent.`)
  } else if (overallScore >= 60) {
    parts.push(`Your overall life score is ${overallScore}, which is good.`)
  } else {
    parts.push(`Your overall life score is ${overallScore}, which could use some improvement.`)
  }

  // Financial
  if (data.financialHealth >= 80) {
    parts.push(`Financial health is strong at ${data.financialHealth}.`)
  } else if (data.financialHealth < 60) {
    parts.push(`Financial health needs attention, currently at ${data.financialHealth}.`)
  }

  // Life balance
  parts.push(`You're actively tracking ${data.activeDomains.length} life domains.`)

  // Productivity
  if (data.productivity > 80) {
    parts.push(`Your productivity is excellent at ${data.productivity} percent.`)
  } else if (data.productivity < 50) {
    parts.push(`Consider focusing on task completion, currently at ${data.productivity} percent.`)
  }

  // Wellbeing
  if (data.wellbeing < 60) {
    parts.push(`Remember to prioritize your health and wellness activities.`)
  }

  // Goals
  if (data.goalProgress > 70) {
    parts.push(`You're making great progress on your goals at ${data.goalProgress} percent.`)
  }

  parts.push('Keep up the great work managing your life!')

  return parts.join(' ')
}

/**
 * Calculate domain correlations
 */
export function calculateDomainCorrelations(
  domainData: Record<string, Array<{ date: string; value: number }>>
): Array<{
  domainA: string
  domainB: string
  correlation: number
  strength: 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative'
}> {
  const correlations: any[] = []
  const domains = Object.keys(domainData)

  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domainA = domains[i]
      const domainB = domains[j]
      
      const correlation = calculatePearsonCorrelation(
        domainData[domainA],
        domainData[domainB]
      )

      if (correlation !== null && Math.abs(correlation) > 0.3) {
        correlations.push({
          domainA,
          domainB,
          correlation,
          strength: Math.abs(correlation) > 0.7 ? 'strong' :
                   Math.abs(correlation) > 0.5 ? 'moderate' : 'weak',
          direction: correlation > 0 ? 'positive' : 'negative',
        })
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

function calculatePearsonCorrelation(
  dataA: Array<{ date: string; value: number }>,
  dataB: Array<{ date: string; value: number }>
): number | null {
  // Align data by date
  const aligned: Array<[number, number]> = []
  
  dataA.forEach(a => {
    const b = dataB.find(b => b.date === a.date)
    if (b) {
      aligned.push([a.value, b.value])
    }
  })

  if (aligned.length < 3) return null

  const n = aligned.length
  const sumX = aligned.reduce((sum, [x]) => sum + x, 0)
  const sumY = aligned.reduce((sum, [, y]) => sum + y, 0)
  const sumXY = aligned.reduce((sum, [x, y]) => sum + x * y, 0)
  const sumX2 = aligned.reduce((sum, [x]) => sum + x * x, 0)
  const sumY2 = aligned.reduce((sum, [, y]) => sum + y * y, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return null

  return numerator / denominator
}





