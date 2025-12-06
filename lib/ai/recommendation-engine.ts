/**
 * Recommendation Engine
 * Generates smart, actionable recommendations based on user data
 */

export interface Recommendation {
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  action: string
  impact: string
  reasoning: string
}

/**
 * Analyze workout patterns and recommend optimal times
 */
function recommendWorkoutTime(logs: any[]): Recommendation | null {
  const workoutLogs = logs.filter(log => log.type === 'workout')
  if (workoutLogs.length < 10) return null

  // Track completion by time of day
  const hourCounts: Record<number, { total: number, completed: number }> = {}
  
  workoutLogs.forEach(log => {
    const time = log.data.time
    if (time) {
      const hour = parseInt(time.split(':')[0])
      if (!hourCounts[hour]) {
        hourCounts[hour] = { total: 0, completed: 0 }
      }
      hourCounts[hour].total++
      if (log.data.intensity === 'High' || parseFloat(log.data.duration || 0) > 30) {
        hourCounts[hour].completed++
      }
    }
  })

  // Find hour with best completion rate
  let bestHour = 0
  let bestRate = 0
  Object.entries(hourCounts).forEach(([hour, stats]) => {
    const rate = stats.completed / stats.total
    if (stats.total >= 3 && rate > bestRate) {
      bestRate = rate
      bestHour = parseInt(hour)
    }
  })

  if (bestRate > 0.7) {
    return {
      category: 'Fitness',
      priority: 'medium',
      title: 'Optimal Workout Time Identified',
      description: `Your best workout performance is at ${bestHour}:00`,
      action: `Schedule workouts for ${bestHour}:00-${bestHour + 1}:00`,
      impact: `${Math.round(bestRate * 100)}% success rate at this time`,
      reasoning: `Based on ${hourCounts[bestHour].total} workouts with ${Math.round(bestRate * 100)}% completion`
    }
  }

  return null
}

/**
 * Recommend budget adjustments
 */
function recommendBudget(logs: any[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  const expenses = logs.filter(log => log.type === 'expense')
  const income = logs.filter(log => log.type === 'income')

  if (expenses.length < 10 || income.length < 2) return recommendations

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, log) => sum + parseFloat(log.data.amount || 0), 0)
  const totalIncome = income.reduce((sum, log) => sum + parseFloat(log.data.amount || 0), 0)
  const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100

  // Spending by category
  const categorySpending: Record<string, number> = {}
  expenses.forEach(log => {
    const category = log.data.category || 'Other'
    categorySpending[category] = (categorySpending[category] || 0) + parseFloat(log.data.amount || 0)
  })

  // Find highest spending category
  const sortedCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)

  if (savingsRate < 10) {
    recommendations.push({
      category: 'Financial',
      priority: 'high',
      title: 'Low Savings Rate',
      description: `Currently saving only ${savingsRate.toFixed(1)}% of income`,
      action: 'Increase savings to at least 20% of income',
      impact: 'Build financial security and emergency fund',
      reasoning: 'Financial experts recommend 20%+ savings rate'
    })

    // Recommend cutting highest category
    if (sortedCategories.length > 0) {
      const [topCategory, amount] = sortedCategories[0]
      const percentage = (amount / totalExpenses) * 100
      
      if (percentage > 30) {
        recommendations.push({
          category: 'Financial',
          priority: 'medium',
          title: `High ${topCategory} Spending`,
          description: `${topCategory} accounts for ${percentage.toFixed(1)}% of expenses ($${amount.toFixed(2)})`,
          action: `Reduce ${topCategory} spending by 15-20%`,
          impact: `Save $${(amount * 0.15).toFixed(2)}-$${(amount * 0.20).toFixed(2)}/month`,
          reasoning: `Highest expense category - small cuts = big savings`
        })
      }
    }
  } else if (savingsRate > 30) {
    recommendations.push({
      category: 'Financial',
      priority: 'low',
      title: 'Excellent Savings Rate!',
      description: `Saving ${savingsRate.toFixed(1)}% of income - great job!`,
      action: 'Consider investing excess savings for growth',
      impact: 'Compound returns over time',
      reasoning: 'You\'re in great financial shape'
    })
  }

  return recommendations
}

/**
 * Health checkup recommendations
 */
function recommendHealthCheckups(logs: any[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  const appointments = logs.filter(log => log.category === 'Medical Records' || log.type === 'appointment')
  
  // Check for overdue checkups
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const recentAppointments = appointments.filter(log => 
    new Date(log.data.date || log.createdAt) > sixMonthsAgo
  )

  if (recentAppointments.length === 0 && appointments.length > 0) {
    recommendations.push({
      category: 'Health',
      priority: 'high',
      title: 'Overdue Health Checkup',
      description: 'No medical appointments logged in past 6 months',
      action: 'Schedule annual physical exam',
      impact: 'Preventive care catches issues early',
      reasoning: 'Regular checkups recommended every 6-12 months'
    })
  }

  // Check for dental
  const dentalAppointments = appointments.filter(log => 
    log.data.type?.toLowerCase().includes('dental') || 
    log.data.provider?.toLowerCase().includes('dentist')
  )

  const recentDental = dentalAppointments.filter(log => 
    new Date(log.data.date || log.createdAt) > sixMonthsAgo
  )

  if (recentDental.length === 0 && dentalAppointments.length > 0) {
    recommendations.push({
      category: 'Health',
      priority: 'medium',
      title: 'Dental Checkup Due',
      description: 'No dental visits in past 6 months',
      action: 'Schedule dental cleaning and exam',
      impact: 'Prevent cavities and gum disease',
      reasoning: 'Dentists recommend visits every 6 months'
    })
  }

  return recommendations
}

/**
 * Productivity recommendations
 */
function recommendProductivity(logs: any[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Check journal/mindfulness logs for mood patterns
  const journalLogs = logs.filter(log => log.type === 'journal')
  if (journalLogs.length < 7) return recommendations

  // Find most productive days of week
  const dayProductivity: Record<number, { total: number, high: number }> = {}
  
  journalLogs.forEach(log => {
    const date = new Date(log.data.date || log.timestamp)
    const dayOfWeek = date.getDay()
    const energy = log.data.energy

    if (!dayProductivity[dayOfWeek]) {
      dayProductivity[dayOfWeek] = { total: 0, high: 0 }
    }
    dayProductivity[dayOfWeek].total++
    if (energy === 'High') {
      dayProductivity[dayOfWeek].high++
    }
  })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let bestDay = 0
  let bestRate = 0

  Object.entries(dayProductivity).forEach(([day, stats]) => {
    const rate = stats.high / stats.total
    if (stats.total >= 3 && rate > bestRate) {
      bestRate = rate
      bestDay = parseInt(day)
    }
  })

  if (bestRate > 0.5) {
    recommendations.push({
      category: 'Productivity',
      priority: 'medium',
      title: 'Peak Performance Day Identified',
      description: `You're most productive on ${dayNames[bestDay]}s`,
      action: `Schedule important tasks for ${dayNames[bestDay]}s`,
      impact: `${Math.round(bestRate * 100)}% high-energy rate`,
      reasoning: `Based on ${dayProductivity[bestDay].total} ${dayNames[bestDay]}s logged`
    })
  }

  return recommendations
}

/**
 * Generate all recommendations
 */
export function generateRecommendations(allLogs: Record<string, any[]>): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Fitness recommendations
  const fitnessLogs = allLogs['hobbies'] || []
  const workoutRec = recommendWorkoutTime(fitnessLogs)
  if (workoutRec) recommendations.push(workoutRec)

  // Financial recommendations
  const financialLogs = allLogs['financial'] || []
  recommendations.push(...recommendBudget(financialLogs))

  // Health recommendations
  const healthLogs = allLogs['health'] || []
  recommendations.push(...recommendHealthCheckups(healthLogs))

  // Productivity recommendations
  const mindfulnessLogs = allLogs['mindfulness'] || []
  recommendations.push(...recommendProductivity(mindfulnessLogs))

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}







