/**
 * Intelligent Data Analysis Module for LifeHub AI Assistant
 * 
 * Provides AI-powered analysis of user data including:
 * - Pattern detection across domains
 * - Correlation analysis between different metrics
 * - Trend analysis with forecasting
 * - Anomaly detection
 * - Goal progress tracking
 * - Spending pattern analysis
 * - Health/fitness insights
 */

import { SupabaseClient } from '@supabase/supabase-js'

// Types for analysis results
interface PatternInsight {
  type: 'pattern' | 'correlation' | 'anomaly' | 'trend' | 'achievement'
  severity: 'info' | 'warning' | 'success' | 'critical'
  domain: string
  title: string
  description: string
  dataPoints?: number
  confidence?: number
  suggestion?: string
}

interface AnalysisResult {
  summary: string
  insights: PatternInsight[]
  correlations: Array<{
    domain1: string
    domain2: string
    metric1: string
    metric2: string
    correlation: number
    description: string
  }>
  trends: Array<{
    domain: string
    metric: string
    direction: 'up' | 'down' | 'stable'
    changePercent: number
    period: string
  }>
  recommendations: string[]
  visualization?: any
}

interface DomainData {
  domain: string
  entries: any[]
  metrics: Record<string, number[]>
  dates: string[]
}

/**
 * Fetch all user data across domains for analysis
 */
export async function fetchUserDataForAnalysis(
  supabase: SupabaseClient,
  userId: string,
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
): Promise<DomainData[]> {
  const now = new Date()
  let startDate = new Date()
  
  switch (dateRange) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    case 'all':
      startDate = new Date('2020-01-01')
      break
  }

  // Fetch domain entries
  console.log(`🔍 [FETCH-DATA] Fetching entries from ${startDate.toISOString()} to now for user ${userId}`)
  const { data: entries, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (error || !entries) {
    console.error('❌ [FETCH-DATA] Error fetching data for analysis:', error)
    return []
  }
  
  console.log(`📊 [FETCH-DATA] Found ${entries.length} entries`)

  // Group by domain and extract metrics
  const domainMap = new Map<string, DomainData>()

  for (const entry of entries) {
    if (!domainMap.has(entry.domain)) {
      domainMap.set(entry.domain, {
        domain: entry.domain,
        entries: [],
        metrics: {},
        dates: []
      })
    }

    const domainData = domainMap.get(entry.domain)!
    domainData.entries.push(entry)
    domainData.dates.push(entry.created_at)

    // Extract numeric metrics from metadata
    if (entry.metadata) {
      for (const [key, value] of Object.entries(entry.metadata)) {
        if (typeof value === 'number') {
          if (!domainData.metrics[key]) {
            domainData.metrics[key] = []
          }
          domainData.metrics[key].push(value)
        }
      }
    }
  }

  return Array.from(domainMap.values())
}

/**
 * Calculate correlation between two numeric arrays
 */
function calculateCorrelation(arr1: number[], arr2: number[]): number {
  const n = Math.min(arr1.length, arr2.length)
  if (n < 3) return 0

  const mean1 = arr1.slice(0, n).reduce((a, b) => a + b, 0) / n
  const mean2 = arr2.slice(0, n).reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denom1 = 0
  let denom2 = 0

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1
    const diff2 = arr2[i] - mean2
    numerator += diff1 * diff2
    denom1 += diff1 * diff1
    denom2 += diff2 * diff2
  }

  const denominator = Math.sqrt(denom1 * denom2)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate trend direction and magnitude
 */
function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable', changePercent: number } {
  if (values.length < 2) return { direction: 'stable', changePercent: 0 }

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  if (avgFirst === 0) return { direction: 'stable', changePercent: 0 }

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100

  if (Math.abs(changePercent) < 5) {
    return { direction: 'stable', changePercent }
  }

  return {
    direction: changePercent > 0 ? 'up' : 'down',
    changePercent: Math.round(changePercent * 10) / 10
  }
}

/**
 * Detect anomalies using simple statistical methods
 */
function detectAnomalies(values: number[]): number[] {
  if (values.length < 5) return []

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  )

  const threshold = 2 // 2 standard deviations
  const anomalyIndices: number[] = []

  values.forEach((val, idx) => {
    if (Math.abs(val - mean) > threshold * stdDev) {
      anomalyIndices.push(idx)
    }
  })

  return anomalyIndices
}

/**
 * Use AI to generate intelligent analysis of user data
 */
export async function analyzeDataWithAI(
  domainData: DomainData[],
  userMessage: string,
  openAIKey?: string
): Promise<AnalysisResult> {
  // First, calculate basic statistics
  const insights: PatternInsight[] = []
  const correlations: AnalysisResult['correlations'] = []
  const trends: AnalysisResult['trends'] = []
  const recommendations: string[] = []

  // Analyze each domain for trends and patterns
  for (const domain of domainData) {
    for (const [metric, values] of Object.entries(domain.metrics)) {
      if (values.length >= 3) {
        const trend = calculateTrend(values)
        if (trend.direction !== 'stable') {
          trends.push({
            domain: domain.domain,
            metric,
            direction: trend.direction,
            changePercent: trend.changePercent,
            period: 'analyzed period'
          })

          insights.push({
            type: 'trend',
            severity: trend.direction === 'up' ? 'success' : 'warning',
            domain: domain.domain,
            title: `${metric} ${trend.direction === 'up' ? 'Increasing' : 'Decreasing'}`,
            description: `Your ${metric} has ${trend.direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(trend.changePercent)}% over the analyzed period.`,
            dataPoints: values.length,
            confidence: Math.min(values.length * 10, 90)
          })
        }

        // Check for anomalies
        const anomalies = detectAnomalies(values)
        if (anomalies.length > 0) {
          insights.push({
            type: 'anomaly',
            severity: 'warning',
            domain: domain.domain,
            title: `Unusual ${metric} Detected`,
            description: `Found ${anomalies.length} unusual ${metric} readings that deviate significantly from your normal pattern.`,
            dataPoints: anomalies.length
          })
        }
      }
    }
  }

  // Cross-domain correlation analysis
  for (let i = 0; i < domainData.length; i++) {
    for (let j = i + 1; j < domainData.length; j++) {
      const domain1 = domainData[i]
      const domain2 = domainData[j]

      for (const [metric1, values1] of Object.entries(domain1.metrics)) {
        for (const [metric2, values2] of Object.entries(domain2.metrics)) {
          if (values1.length >= 5 && values2.length >= 5) {
            const correlation = calculateCorrelation(values1, values2)
            
            if (Math.abs(correlation) > 0.5) {
              correlations.push({
                domain1: domain1.domain,
                domain2: domain2.domain,
                metric1,
                metric2,
                correlation: Math.round(correlation * 100) / 100,
                description: correlation > 0
                  ? `Higher ${metric1} tends to coincide with higher ${metric2}`
                  : `Higher ${metric1} tends to coincide with lower ${metric2}`
              })

              insights.push({
                type: 'correlation',
                severity: 'info',
                domain: `${domain1.domain} & ${domain2.domain}`,
                title: `${metric1} ↔ ${metric2} Connection Found`,
                description: `There's a ${correlation > 0 ? 'positive' : 'negative'} correlation (${Math.abs(Math.round(correlation * 100))}%) between your ${metric1} and ${metric2}.`,
                confidence: Math.abs(correlation) * 100
              })
            }
          }
        }
      }
    }
  }

  // If we have OpenAI key, use AI for deeper insights
  if (openAIKey) {
    console.log(`🤖 [INTELLIGENT-ANALYSIS] Calling OpenAI for deeper insights...`)
    try {
      const aiInsights = await generateAIInsights(domainData, insights, correlations, trends, userMessage, openAIKey)
      console.log(`✅ [INTELLIGENT-ANALYSIS] OpenAI response received:`, {
        summaryLength: aiInsights.summary?.length,
        additionalInsights: aiInsights.additionalInsights?.length,
        recommendations: aiInsights.recommendations?.length
      })
      insights.push(...aiInsights.additionalInsights)
      recommendations.push(...aiInsights.recommendations)
      
      return {
        summary: aiInsights.summary,
        insights,
        correlations,
        trends,
        recommendations,
        visualization: generateVisualization(domainData, trends)
      }
    } catch (error) {
      console.error('❌ [INTELLIGENT-ANALYSIS] AI insight generation failed:', error)
    }
  } else {
    console.log(`⚠️ [INTELLIGENT-ANALYSIS] No OpenAI key, using basic analysis`)
  }

  // Fallback summary without AI
  console.log(`📝 [INTELLIGENT-ANALYSIS] Using fallback basic summary`)
  const summary = generateBasicSummary(domainData, insights, correlations, trends)

  return {
    summary,
    insights,
    correlations,
    trends,
    recommendations: generateBasicRecommendations(insights, trends),
    visualization: generateVisualization(domainData, trends)
  }
}

/**
 * Generate AI-powered insights using OpenAI
 */
async function generateAIInsights(
  domainData: DomainData[],
  existingInsights: PatternInsight[],
  correlations: AnalysisResult['correlations'],
  trends: AnalysisResult['trends'],
  userMessage: string,
  openAIKey: string
): Promise<{
  summary: string
  additionalInsights: PatternInsight[]
  recommendations: string[]
}> {
  // Prepare context for AI
  const dataContext = domainData.map(d => ({
    domain: d.domain,
    entryCount: d.entries.length,
    metrics: Object.fromEntries(
      Object.entries(d.metrics).map(([k, v]) => [
        k,
        {
          count: v.length,
          min: Math.min(...v),
          max: Math.max(...v),
          avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100,
          recent: v.slice(-3)
        }
      ])
    )
  }))

  const prompt = `You are an expert life coach and data analyst for LifeHub, a personal life management app. Analyze this user's data and provide personalized, actionable insights.

USER'S QUESTION: "${userMessage}"

DATA SUMMARY BY DOMAIN:
${JSON.stringify(dataContext, null, 2)}

DETECTED TRENDS:
${JSON.stringify(trends, null, 2)}

CORRELATIONS FOUND:
${JSON.stringify(correlations, null, 2)}

EXISTING INSIGHTS:
${JSON.stringify(existingInsights.slice(0, 5), null, 2)}

Provide your response as JSON with this structure:
{
  "summary": "A 2-3 sentence personalized summary answering the user's question with specific numbers from their data",
  "additionalInsights": [
    {
      "type": "pattern",
      "severity": "info|warning|success|critical",
      "domain": "domain name",
      "title": "Short insight title",
      "description": "Detailed description with specific numbers",
      "suggestion": "Actionable suggestion"
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2"
  ]
}

Be specific, use actual numbers from the data, and provide actionable insights. Focus on patterns that would genuinely help the user improve their life.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert data analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content?.trim()

  // Parse JSON from response (handle potential markdown code blocks)
  let parsed
  try {
    // Remove markdown code blocks if present
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    console.error('Failed to parse AI response:', content)
    throw new Error('Invalid AI response format')
  }

  return {
    summary: parsed.summary || 'Analysis complete.',
    additionalInsights: (parsed.additionalInsights || []).map((i: any) => ({
      type: i.type || 'pattern',
      severity: i.severity || 'info',
      domain: i.domain || 'general',
      title: i.title || 'Insight',
      description: i.description || '',
      suggestion: i.suggestion
    })),
    recommendations: parsed.recommendations || []
  }
}

/**
 * Generate basic summary without AI
 */
function generateBasicSummary(
  domainData: DomainData[],
  insights: PatternInsight[],
  correlations: AnalysisResult['correlations'],
  trends: AnalysisResult['trends']
): string {
  const totalEntries = domainData.reduce((sum, d) => sum + d.entries.length, 0)
  const activeDomains = domainData.length

  let summary = `📊 **Analysis of Your Data**\n\n`
  summary += `Analyzed **${totalEntries}** entries across **${activeDomains}** domains.\n\n`

  if (trends.length > 0) {
    const upTrends = trends.filter(t => t.direction === 'up')
    const downTrends = trends.filter(t => t.direction === 'down')
    
    if (upTrends.length > 0) {
      summary += `📈 **Increasing:** ${upTrends.map(t => `${t.metric} (+${t.changePercent}%)`).join(', ')}\n`
    }
    if (downTrends.length > 0) {
      summary += `📉 **Decreasing:** ${downTrends.map(t => `${t.metric} (${t.changePercent}%)`).join(', ')}\n`
    }
  }

  if (correlations.length > 0) {
    summary += `\n🔗 **Correlations Found:** ${correlations.length} cross-domain connections detected.\n`
  }

  if (insights.filter(i => i.type === 'anomaly').length > 0) {
    summary += `\n⚠️ **Anomalies:** Some unusual patterns detected that may need attention.\n`
  }

  return summary
}

/**
 * Generate basic recommendations without AI
 */
function generateBasicRecommendations(
  insights: PatternInsight[],
  trends: AnalysisResult['trends']
): string[] {
  const recommendations: string[] = []

  // Based on negative trends
  const negativeTrends = trends.filter(t => t.direction === 'down')
  for (const trend of negativeTrends.slice(0, 2)) {
    recommendations.push(
      `Consider focusing on improving your ${trend.metric} - it's down ${Math.abs(trend.changePercent)}% recently.`
    )
  }

  // Based on anomalies
  const anomalies = insights.filter(i => i.type === 'anomaly')
  if (anomalies.length > 0) {
    recommendations.push(
      `Review the unusual patterns in ${anomalies.map(a => a.domain).join(', ')} to understand what caused them.`
    )
  }

  // Based on positive patterns
  const successInsights = insights.filter(i => i.severity === 'success')
  if (successInsights.length > 0) {
    recommendations.push(
      `Keep up the great work on ${successInsights[0].domain} - maintain your current approach!`
    )
  }

  return recommendations
}

/**
 * Generate visualization data for the analysis
 */
function generateVisualization(
  domainData: DomainData[],
  trends: AnalysisResult['trends']
): any {
  // Create a multi-domain overview chart
  const chartData = domainData
    .filter(d => d.entries.length > 0)
    .map(d => ({
      name: d.domain.toUpperCase(),
      value: d.entries.length,
      domain: d.domain
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return {
    type: 'bar',
    title: 'Activity by Domain',
    xAxis: 'Domain',
    yAxis: 'Entries',
    data: chartData,
    config: {
      height: 300,
      showGrid: true,
      colors: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
    }
  }
}

/**
 * Specialized analysis: Financial spending patterns
 */
export async function analyzeSpendingPatterns(
  supabase: SupabaseClient,
  userId: string,
  dateRange: 'week' | 'month' | 'quarter' = 'month'
): Promise<{
  summary: string
  byCategory: Array<{ category: string; total: number; percent: number }>
  byDay: Array<{ day: string; total: number }>
  trends: Array<{ category: string; trend: string; change: number }>
  insights: string[]
}> {
  const domainData = await fetchUserDataForAnalysis(supabase, userId, dateRange)
  const financialData = domainData.find(d => d.domain === 'financial')

  if (!financialData || financialData.entries.length === 0) {
    return {
      summary: 'No financial data found for the selected period.',
      byCategory: [],
      byDay: [],
      trends: [],
      insights: []
    }
  }

  // Categorize spending
  const categoryTotals = new Map<string, number>()
  const dayTotals = new Map<string, number>()
  let totalSpending = 0

  for (const entry of financialData.entries) {
    const amount = Math.abs(entry.metadata?.amount || 0)
    const category = entry.metadata?.category || entry.metadata?.type || 'Other'
    const day = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })

    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount)
    dayTotals.set(day, (dayTotals.get(day) || 0) + amount)
    totalSpending += amount
  }

  const byCategory = Array.from(categoryTotals.entries())
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      percent: totalSpending > 0 ? Math.round((total / totalSpending) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)

  const byDay = Array.from(dayTotals.entries())
    .map(([day, total]) => ({ day, total: Math.round(total * 100) / 100 }))

  const insights: string[] = []
  
  // Top spending category
  if (byCategory.length > 0) {
    insights.push(`Your top spending category is ${byCategory[0].category} at $${byCategory[0].total.toFixed(2)} (${byCategory[0].percent}% of total)`)
  }

  // Highest spending day
  const maxDay = byDay.reduce((max, curr) => curr.total > max.total ? curr : max, byDay[0])
  if (maxDay) {
    insights.push(`You tend to spend most on ${maxDay.day}s ($${maxDay.total.toFixed(2)} average)`)
  }

  return {
    summary: `Total spending: $${totalSpending.toFixed(2)} across ${byCategory.length} categories and ${financialData.entries.length} transactions.`,
    byCategory,
    byDay,
    trends: [],
    insights
  }
}

/**
 * Specialized analysis: Health & fitness progress
 */
export async function analyzeHealthProgress(
  supabase: SupabaseClient,
  userId: string,
  dateRange: 'week' | 'month' | 'quarter' = 'month'
): Promise<{
  summary: string
  metrics: Array<{ metric: string; current: number; trend: string; change: number }>
  streaks: Array<{ activity: string; days: number }>
  insights: string[]
}> {
  const domainData = await fetchUserDataForAnalysis(supabase, userId, dateRange)
  
  const healthData = domainData.find(d => d.domain === 'health')
  const fitnessData = domainData.find(d => d.domain === 'fitness')
  const nutritionData = domainData.find(d => d.domain === 'nutrition')

  const metrics: Array<{ metric: string; current: number; trend: string; change: number }> = []
  const insights: string[] = []

  // Analyze weight if available
  if (healthData?.metrics?.weight?.length) {
    const weights = healthData.metrics.weight
    const current = weights[weights.length - 1]
    const trend = calculateTrend(weights)
    
    metrics.push({
      metric: 'Weight',
      current,
      trend: trend.direction,
      change: trend.changePercent
    })

    if (trend.direction === 'down') {
      insights.push(`Great progress! Your weight has decreased by ${Math.abs(trend.changePercent)}%`)
    }
  }

  // Analyze workouts
  if (fitnessData?.entries?.length) {
    const workoutCount = fitnessData.entries.length
    insights.push(`You've logged ${workoutCount} workouts in this period`)
    
    metrics.push({
      metric: 'Workouts',
      current: workoutCount,
      trend: workoutCount > 10 ? 'up' : 'stable',
      change: 0
    })
  }

  // Analyze nutrition
  if (nutritionData?.metrics?.calories?.length) {
    const avgCalories = Math.round(
      nutritionData.metrics.calories.reduce((a, b) => a + b, 0) / nutritionData.metrics.calories.length
    )
    
    metrics.push({
      metric: 'Avg Calories',
      current: avgCalories,
      trend: 'stable',
      change: 0
    })
  }

  return {
    summary: `Analyzed ${(healthData?.entries?.length || 0) + (fitnessData?.entries?.length || 0) + (nutritionData?.entries?.length || 0)} health & fitness entries.`,
    metrics,
    streaks: [], // Would need habit data for streaks
    insights
  }
}

/**
 * Main entry point for intelligent analysis
 */
export async function performIntelligentAnalysis(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  analysisType: 'general' | 'financial' | 'health' | 'correlations' | 'trends' = 'general',
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
): Promise<{
  response: string
  data: any
  visualization: any
  analysisType: string
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  console.log(`🔬 [INTELLIGENT-ANALYSIS] Starting analysis type: ${analysisType}, dateRange: ${dateRange}, hasOpenAIKey: ${!!openAIKey}`)

  try {
    // Fetch user data
    const domainData = await fetchUserDataForAnalysis(supabase, userId, dateRange)
    
    console.log(`📦 [INTELLIGENT-ANALYSIS] Fetched data:`, {
      domains: domainData.map(d => d.domain),
      entryCounts: domainData.map(d => `${d.domain}: ${d.entries.length}`),
      totalEntries: domainData.reduce((sum, d) => sum + d.entries.length, 0),
      metricsPerDomain: domainData.map(d => `${d.domain}: ${Object.keys(d.metrics).join(', ') || 'none'}`)
    })

    if (domainData.length === 0 || domainData.every(d => d.entries.length === 0)) {
      console.log(`⚠️ [INTELLIGENT-ANALYSIS] No data found for analysis`)
      return {
        response: `📊 **No Data Found**\n\nI don't have enough data to analyze for this time period. Try adding some entries first, or expand your date range.`,
        data: null,
        visualization: null,
        analysisType
      }
    }

    // Perform analysis based on type
    switch (analysisType) {
      case 'financial':
        const spendingAnalysis = await analyzeSpendingPatterns(supabase, userId, dateRange as 'week' | 'month' | 'quarter')
        return {
          response: formatSpendingResponse(spendingAnalysis),
          data: spendingAnalysis,
          visualization: {
            type: 'pie',
            title: 'Spending by Category',
            data: spendingAnalysis.byCategory.slice(0, 8).map(c => ({
              name: c.category,
              value: c.total
            }))
          },
          analysisType: 'financial'
        }

      case 'health':
        const healthAnalysis = await analyzeHealthProgress(supabase, userId, dateRange as 'week' | 'month' | 'quarter')
        return {
          response: formatHealthResponse(healthAnalysis),
          data: healthAnalysis,
          visualization: healthAnalysis.metrics.length > 0 ? {
            type: 'bar',
            title: 'Health Metrics',
            data: healthAnalysis.metrics.map(m => ({
              name: m.metric,
              value: m.current
            }))
          } : null,
          analysisType: 'health'
        }

      case 'correlations':
      case 'trends':
      case 'general':
      default:
        const analysis = await analyzeDataWithAI(domainData, userMessage, openAIKey)
        return {
          response: formatGeneralAnalysisResponse(analysis),
          data: analysis,
          visualization: analysis.visualization,
          analysisType: 'general'
        }
    }
  } catch (error) {
    console.error('Intelligent analysis error:', error)
    return {
      response: `❌ **Analysis Error**\n\nI encountered an error while analyzing your data. Please try again.`,
      data: null,
      visualization: null,
      analysisType
    }
  }
}

/**
 * Format spending analysis response
 */
function formatSpendingResponse(analysis: Awaited<ReturnType<typeof analyzeSpendingPatterns>>): string {
  let response = `💰 **Spending Analysis**\n\n${analysis.summary}\n\n`

  if (analysis.byCategory.length > 0) {
    response += `**📊 Top Categories:**\n`
    for (const cat of analysis.byCategory.slice(0, 5)) {
      const bar = '█'.repeat(Math.ceil(cat.percent / 10))
      response += `• ${cat.category}: $${cat.total.toFixed(2)} (${cat.percent}%) ${bar}\n`
    }
    response += '\n'
  }

  if (analysis.insights.length > 0) {
    response += `**💡 Insights:**\n`
    for (const insight of analysis.insights) {
      response += `• ${insight}\n`
    }
  }

  return response
}

/**
 * Format health analysis response
 */
function formatHealthResponse(analysis: Awaited<ReturnType<typeof analyzeHealthProgress>>): string {
  let response = `🏥 **Health & Fitness Analysis**\n\n${analysis.summary}\n\n`

  if (analysis.metrics.length > 0) {
    response += `**📈 Key Metrics:**\n`
    for (const metric of analysis.metrics) {
      const trendIcon = metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️'
      response += `• ${metric.metric}: ${metric.current} ${trendIcon}`
      if (metric.change !== 0) {
        response += ` (${metric.change > 0 ? '+' : ''}${metric.change}%)`
      }
      response += '\n'
    }
    response += '\n'
  }

  if (analysis.insights.length > 0) {
    response += `**💡 Insights:**\n`
    for (const insight of analysis.insights) {
      response += `• ${insight}\n`
    }
  }

  return response
}

/**
 * Format general analysis response
 */
function formatGeneralAnalysisResponse(analysis: AnalysisResult): string {
  let response = analysis.summary + '\n\n'

  // Add key insights
  const significantInsights = analysis.insights.filter(i => 
    i.severity === 'success' || i.severity === 'warning' || i.severity === 'critical'
  ).slice(0, 5)

  if (significantInsights.length > 0) {
    response += `**🔍 Key Findings:**\n`
    for (const insight of significantInsights) {
      const icon = insight.severity === 'success' ? '✅' : 
                   insight.severity === 'warning' ? '⚠️' : 
                   insight.severity === 'critical' ? '🚨' : '💡'
      response += `${icon} **${insight.title}**\n   ${insight.description}\n`
      if (insight.suggestion) {
        response += `   → ${insight.suggestion}\n`
      }
      response += '\n'
    }
  }

  // Add correlations
  if (analysis.correlations.length > 0) {
    response += `**🔗 Interesting Correlations:**\n`
    for (const corr of analysis.correlations.slice(0, 3)) {
      const strength = Math.abs(corr.correlation) > 0.7 ? 'strong' : 'moderate'
      response += `• ${corr.domain1} ↔ ${corr.domain2}: ${corr.description} (${strength})\n`
    }
    response += '\n'
  }

  // Add recommendations
  if (analysis.recommendations.length > 0) {
    response += `**💪 Recommendations:**\n`
    for (const rec of analysis.recommendations.slice(0, 3)) {
      response += `• ${rec}\n`
    }
  }

  return response
}

/**
 * Detect what type of analysis the user wants
 */
export function detectAnalysisType(message: string): {
  type: 'general' | 'financial' | 'health' | 'correlations' | 'trends'
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all'
} {
  const lowerMessage = message.toLowerCase()

  // Detect analysis type
  let type: 'general' | 'financial' | 'health' | 'correlations' | 'trends' = 'general'
  
  if (/spend|money|financ|budget|expense|income|cost|dollar|\$/i.test(lowerMessage)) {
    type = 'financial'
  } else if (/health|fitness|weight|workout|exercise|calorie|nutrition|diet|sleep|step/i.test(lowerMessage)) {
    type = 'health'
  } else if (/correlat|connection|relationship|affect|impact|influence/i.test(lowerMessage)) {
    type = 'correlations'
  } else if (/trend|pattern|over time|progress|change|improv/i.test(lowerMessage)) {
    type = 'trends'
  }

  // Detect date range
  let dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
  
  if (/this week|past week|last 7 days/i.test(lowerMessage)) {
    dateRange = 'week'
  } else if (/this month|past month|last 30 days/i.test(lowerMessage)) {
    dateRange = 'month'
  } else if (/quarter|past 3 months|last 3 months/i.test(lowerMessage)) {
    dateRange = 'quarter'
  } else if (/year|annual|12 months/i.test(lowerMessage)) {
    dateRange = 'year'
  } else if (/all time|ever|all data|everything/i.test(lowerMessage)) {
    dateRange = 'all'
  }

  return { type, dateRange }
}

