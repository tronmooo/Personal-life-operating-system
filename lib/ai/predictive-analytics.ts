/**
 * Predictive Analytics Engine
 * Forecast future metrics based on historical data
 */

export interface Prediction {
  metric: string
  domain: string
  predicted_value: number
  confidence: number // 0 to 1
  date: Date
  reasoning: string
  historical_average: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Simple moving average prediction
 */
function movingAverage(values: number[], window: number = 7): number {
  if (values.length === 0) return 0
  const recentValues = values.slice(-window)
  return recentValues.reduce((a, b) => a + b, 0) / recentValues.length
}

/**
 * Calculate linear trend
 */
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable'

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const change = ((avgSecond - avgFirst) / avgFirst) * 100

  if (change > 5) return 'increasing'
  if (change < -5) return 'decreasing'
  return 'stable'
}

/**
 * Predict next month's bill amounts
 */
function predictBills(logs: any[]): Prediction[] {
  const billsByCategory: Record<string, number[]> = {}

  logs
    .filter(log => log.type === 'bill' || (log.category && log.category.includes('bill')))
    .forEach(log => {
      const category = log.data.category || log.category || 'Utilities'
      const amount = parseFloat(log.data.amount || 0)
      if (!billsByCategory[category]) {
        billsByCategory[category] = []
      }
      billsByCategory[category].push(amount)
    })

  return Object.entries(billsByCategory)
    .filter(([, amounts]) => amounts.length >= 2)
    .map(([category, amounts]) => {
      const predicted = movingAverage(amounts, 3)
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const trend = calculateTrend(amounts)
      
      let reasoning = `Based on ${amounts.length} historical payments. `
      if (trend === 'increasing') {
        reasoning += `Bill is trending upward (+${Math.round(((predicted - avg) / avg) * 100)}%)`
      } else if (trend === 'decreasing') {
        reasoning += `Bill is trending downward (${Math.round(((predicted - avg) / avg) * 100)}%)`
      } else {
        reasoning += `Bill amount is stable`
      }

      return {
        metric: `${category} Bill`,
        domain: 'financial',
        predicted_value: Math.round(predicted * 100) / 100,
        confidence: Math.min(amounts.length / 6, 0.95),
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        reasoning,
        historical_average: Math.round(avg * 100) / 100,
        trend
      }
    })
}

/**
 * Predict weight goal achievement
 */
function predictWeightGoal(logs: any[], goalWeight?: number): Prediction | null {
  const weightLogs = logs
    .filter(log => log.type === 'weight' && log.data.weight)
    .map(log => ({
      date: new Date(log.data.date || log.timestamp),
      weight: parseFloat(log.data.weight)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (weightLogs.length < 5) return null

  const weights = weightLogs.map(l => l.weight)
  const currentWeight = weights[weights.length - 1]
  const startWeight = weights[0]
  const trend = calculateTrend(weights)

  // Calculate average weekly change
  const firstDate = weightLogs[0].date
  const lastDate = weightLogs[weightLogs.length - 1].date
  const weeks = (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  const totalChange = currentWeight - startWeight
  const weeklyChange = weeks > 0 ? totalChange / weeks : 0

  let reasoning = `Based on ${weightLogs.length} weight measurements. `
  reasoning += `Average weekly change: ${Math.abs(weeklyChange).toFixed(2)} lbs ${weeklyChange < 0 ? 'loss' : 'gain'}. `

  if (goalWeight) {
    const remainingChange = goalWeight - currentWeight
    const weeksToGoal = weeklyChange !== 0 ? remainingChange / weeklyChange : 0
    
    if (weeksToGoal > 0 && weeksToGoal < 52) {
      const goalDate = new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000)
      reasoning += `At current pace, you'll reach ${goalWeight} lbs in ${Math.round(weeksToGoal)} weeks`

      return {
        metric: 'Weight Goal Achievement',
        domain: 'health',
        predicted_value: goalWeight,
        confidence: Math.min(weightLogs.length / 20, 0.85),
        date: goalDate,
        reasoning,
        historical_average: currentWeight,
        trend
      }
    }
  }

  // Predict weight in 30 days
  const predictedWeight = currentWeight + (weeklyChange * 4.3) // ~4.3 weeks in a month
  reasoning += `Predicted weight in 30 days: ${predictedWeight.toFixed(1)} lbs`

  return {
    metric: 'Weight Trend',
    domain: 'health',
    predicted_value: Math.round(predictedWeight * 10) / 10,
    confidence: Math.min(weightLogs.length / 15, 0.8),
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reasoning,
    historical_average: currentWeight,
    trend
  }
}

/**
 * Predict budget forecast
 */
function predictBudget(logs: any[]): Prediction[] {
  const monthlyData: Record<string, { income: number, expenses: number }> = {}

  logs.forEach(log => {
    const date = new Date(log.data.date || log.timestamp)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 }
    }

    if (log.type === 'income') {
      monthlyData[month].income += parseFloat(log.data.amount || 0)
    } else if (log.type === 'expense') {
      monthlyData[month].expenses += parseFloat(log.data.amount || 0)
    }
  })

  const months = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
  if (months.length < 2) return []

  const incomes = months.map(([, data]) => data.income)
  const expenses = months.map(([, data]) => data.expenses)

  const predictions: Prediction[] = []

  // Predict next month income
  const predictedIncome = movingAverage(incomes, 3)
  predictions.push({
    metric: 'Monthly Income',
    domain: 'financial',
    predicted_value: Math.round(predictedIncome),
    confidence: Math.min(months.length / 6, 0.9),
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reasoning: `Based on ${months.length} months of income data`,
    historical_average: Math.round(incomes.reduce((a, b) => a + b, 0) / incomes.length),
    trend: calculateTrend(incomes)
  })

  // Predict next month expenses
  const predictedExpenses = movingAverage(expenses, 3)
  predictions.push({
    metric: 'Monthly Expenses',
    domain: 'financial',
    predicted_value: Math.round(predictedExpenses),
    confidence: Math.min(months.length / 6, 0.85),
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reasoning: `Based on ${months.length} months of spending data`,
    historical_average: Math.round(expenses.reduce((a, b) => a + b, 0) / expenses.length),
    trend: calculateTrend(expenses)
  })

  return predictions
}

/**
 * Predict habit streak likelihood
 */
function predictHabitStreak(logs: any[], habitName: string): Prediction | null {
  const habitLogs = logs.filter(log => 
    log.data.habit === habitName || log.data.activity?.includes(habitName)
  )

  if (habitLogs.length < 7) return null

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentLogs = habitLogs.filter(log => 
    new Date(log.timestamp) > thirtyDaysAgo
  )

  const completionRate = recentLogs.length / 30
  const confidence = completionRate

  let reasoning = `Based on ${recentLogs.length} completions in last 30 days. `
  if (completionRate > 0.8) {
    reasoning += `Strong consistency! You have an ${Math.round(completionRate * 100)}% chance of maintaining this streak`
  } else if (completionRate > 0.5) {
    reasoning += `Moderate consistency at ${Math.round(completionRate * 100)}%`
  } else {
    reasoning += `Low consistency at ${Math.round(completionRate * 100)}%. Consider setting reminders`
  }

  return {
    metric: `${habitName} Streak`,
    domain: 'goals',
    predicted_value: Math.round(completionRate * 100),
    confidence,
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    reasoning,
    historical_average: completionRate * 100,
    trend: recentLogs.length > habitLogs.length / 2 ? 'increasing' : 'decreasing'
  }
}

/**
 * Generate all predictions
 */
export function generatePredictions(allLogs: Record<string, any[]>): Prediction[] {
  const predictions: Prediction[] = []

  // Financial predictions
  const financialLogs = allLogs['financial'] || []
  predictions.push(...predictBills(financialLogs))
  predictions.push(...predictBudget(financialLogs))

  // Health predictions
  const healthLogs = allLogs['health'] || []
  const weightPrediction = predictWeightGoal(healthLogs)
  if (weightPrediction) predictions.push(weightPrediction)

  return predictions.sort((a, b) => b.confidence - a.confidence)
}







