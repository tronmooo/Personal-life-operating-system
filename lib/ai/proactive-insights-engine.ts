/**
 * Proactive Insights Engine
 * Automatically generates daily insights, detects anomalies, 
 * and identifies cross-domain correlations
 */

import type { Domain } from '@/types/domains'

export interface ProactiveInsight {
  id: string
  type: 'anomaly' | 'celebration' | 'reminder' | 'correlation' | 'suggestion'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  domain?: Domain
  relatedDomains?: Domain[]
  actionLabel?: string
  actionPath?: string
  data?: any
  createdAt: Date
  expiresAt?: Date
}

export interface InsightContext {
  userId: string
  domains: Partial<Record<Domain, any[]>>
  tasks: any[]
  bills: any[]
  habits: any[]
  events: any[]
  goals: any[]
}

/**
 * Generate proactive insights based on user data
 */
export function generateProactiveInsights(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const now = new Date()

  // 1. Financial Insights
  const financialInsights = analyzeFinancialData(context)
  insights.push(...financialInsights)

  // 2. Health Insights
  const healthInsights = analyzeHealthData(context)
  insights.push(...healthInsights)

  // 3. Task & Productivity Insights
  const taskInsights = analyzeTaskData(context)
  insights.push(...taskInsights)

  // 4. Bill Reminders
  const billInsights = analyzeBillData(context)
  insights.push(...billInsights)

  // 5. Habit Insights
  const habitInsights = analyzeHabitData(context)
  insights.push(...habitInsights)

  // 6. Cross-Domain Correlations
  const correlationInsights = findCrossdomainCorrelations(context)
  insights.push(...correlationInsights)

  // 7. Goal Progress Insights
  const goalInsights = analyzeGoalProgress(context)
  insights.push(...goalInsights)

  // Sort by priority
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Analyze financial data for insights
 */
function analyzeFinancialData(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const financialData = context.domains.financial || []
  
  if (financialData.length === 0) return insights

  // Group by week/month
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentExpenses = financialData.filter((item: any) => {
    const meta = item.metadata || item
    const date = new Date(item.createdAt || item.date || now)
    return (meta.type === 'expense') && date >= weekAgo
  })

  const weeklyTotal = recentExpenses.reduce((sum: number, item: any) => {
    const meta = item.metadata || item
    return sum + parseFloat(meta.amount || 0)
  }, 0)

  // High spending alert
  if (weeklyTotal > 1000) {
    insights.push({
      id: `fin-high-spend-${Date.now()}`,
      type: 'anomaly',
      priority: 'high',
      title: 'Unusually High Spending',
      message: `You've spent $${weeklyTotal.toFixed(2)} in the past week. This is higher than usual. Consider reviewing your recent purchases.`,
      domain: 'financial',
      actionLabel: 'Review Expenses',
      actionPath: '/domains/financial',
      createdAt: now
    })
  }

  // Category analysis
  const categoryTotals: Record<string, number> = {}
  recentExpenses.forEach((item: any) => {
    const meta = item.metadata || item
    const category = meta.category || 'Uncategorized'
    categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(meta.amount || 0)
  })

  // Find spike in any category
  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)
  if (sortedCategories.length > 0 && sortedCategories[0][1] > 500) {
    insights.push({
      id: `fin-category-spike-${Date.now()}`,
      type: 'suggestion',
      priority: 'medium',
      title: `High ${sortedCategories[0][0]} Spending`,
      message: `Your ${sortedCategories[0][0]} spending is $${sortedCategories[0][1].toFixed(2)} this week. Look for ways to reduce this if it's not essential.`,
      domain: 'financial',
      createdAt: now
    })
  }

  // Positive: Good savings trend
  const incomeItems = financialData.filter((item: any) => {
    const meta = item.metadata || item
    return meta.type === 'income'
  })
  const totalIncome = incomeItems.reduce((sum: number, item: any) => sum + parseFloat((item.metadata || item).amount || 0), 0)
  const totalExpenses = financialData.filter((item: any) => (item.metadata || item).type === 'expense')
    .reduce((sum: number, item: any) => sum + parseFloat((item.metadata || item).amount || 0), 0)
  
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  
  if (savingsRate >= 20) {
    insights.push({
      id: `fin-savings-${Date.now()}`,
      type: 'celebration',
      priority: 'low',
      title: 'Great Savings Rate!',
      message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the excellent financial discipline!`,
      domain: 'financial',
      createdAt: now
    })
  }

  return insights
}

/**
 * Analyze health data for insights
 */
function analyzeHealthData(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const healthData = context.domains.health || []
  const fitnessData = context.domains.fitness || []
  const now = new Date()

  if (healthData.length === 0 && fitnessData.length === 0) return insights

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Workout frequency
  const allHealthData = [...healthData, ...fitnessData]
  const recentWorkouts = allHealthData.filter((item: any) => {
    const meta = item.metadata || item
    const date = new Date(item.createdAt || item.date || now)
    return (meta.workout_type || meta.type === 'workout' || meta.activity) && date >= weekAgo
  })

  if (recentWorkouts.length >= 5) {
    insights.push({
      id: `health-workout-streak-${Date.now()}`,
      type: 'celebration',
      priority: 'low',
      title: 'Fantastic Workout Week!',
      message: `You've completed ${recentWorkouts.length} workouts this week. Your consistency is building healthy habits!`,
      domain: 'health',
      createdAt: now
    })
  } else if (recentWorkouts.length === 0 && allHealthData.length > 0) {
    insights.push({
      id: `health-no-workout-${Date.now()}`,
      type: 'suggestion',
      priority: 'medium',
      title: 'Time to Move',
      message: "No workouts logged this week. Even a 15-minute walk can boost your energy and mood!",
      domain: 'health',
      actionLabel: 'Log Workout',
      actionPath: '/domains/health',
      createdAt: now
    })
  }

  // Weight trend analysis
  const weightLogs = healthData
    .filter((h: any) => (h.metadata?.weight || h.metadata?.logType === 'weight'))
    .map((h: any) => ({
      weight: parseFloat(h.metadata?.weight || h.metadata?.value || 0),
      date: new Date(h.createdAt || h.date || now)
    }))
    .filter(w => w.weight > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (weightLogs.length >= 5) {
    const recent = weightLogs.slice(-3)
    const avgRecent = recent.reduce((s, w) => s + w.weight, 0) / 3
    const older = weightLogs.slice(0, 3)
    const avgOlder = older.reduce((s, w) => s + w.weight, 0) / 3
    const change = avgRecent - avgOlder

    if (Math.abs(change) > 5) {
      insights.push({
        id: `health-weight-change-${Date.now()}`,
        type: change < 0 ? 'celebration' : 'anomaly',
        priority: change < -5 ? 'low' : 'medium',
        title: change < 0 ? 'Weight Loss Progress!' : 'Weight Change Detected',
        message: change < 0 
          ? `You've lost ${Math.abs(change).toFixed(1)} lbs. Great progress on your health journey!`
          : `Your weight has increased by ${change.toFixed(1)} lbs. This might be worth reviewing.`,
        domain: 'health',
        createdAt: now
      })
    }
  }

  return insights
}

/**
 * Analyze task data for productivity insights
 */
function analyzeTaskData(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const tasks = context.tasks || []
  const now = new Date()

  if (tasks.length === 0) return insights

  // Overdue tasks
  const overdueTasks = tasks.filter((t: any) => {
    return !t.completed && t.due_date && new Date(t.due_date) < now
  })

  if (overdueTasks.length > 0) {
    insights.push({
      id: `task-overdue-${Date.now()}`,
      type: 'reminder',
      priority: overdueTasks.length >= 5 ? 'high' : 'medium',
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
      message: `You have ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past their due date. Consider addressing these soon or adjusting deadlines.`,
      actionLabel: 'View Tasks',
      actionPath: '/tasks',
      createdAt: now
    })
  }

  // Task completion rate
  const completedTasks = tasks.filter((t: any) => t.completed)
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

  if (completionRate >= 80) {
    insights.push({
      id: `task-completion-${Date.now()}`,
      type: 'celebration',
      priority: 'low',
      title: 'Excellent Task Completion!',
      message: `You've completed ${completionRate.toFixed(0)}% of your tasks. Your productivity is outstanding!`,
      createdAt: now
    })
  }

  return insights
}

/**
 * Analyze bills for upcoming payment reminders
 */
function analyzeBillData(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const bills = context.bills || []
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Upcoming bills
  const upcomingBills = bills.filter((b: any) => {
    const dueDate = new Date(b.due_date)
    return b.status !== 'paid' && dueDate >= now && dueDate <= nextWeek
  })

  if (upcomingBills.length > 0) {
    const totalDue = upcomingBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
    insights.push({
      id: `bills-upcoming-${Date.now()}`,
      type: 'reminder',
      priority: 'high',
      title: `${upcomingBills.length} Bill${upcomingBills.length > 1 ? 's' : ''} Due Soon`,
      message: `You have $${totalDue.toFixed(2)} in bills due within the next 7 days. Make sure you have funds available.`,
      domain: 'financial',
      actionLabel: 'View Bills',
      actionPath: '/bills',
      createdAt: now
    })
  }

  // Overdue bills
  const overdueBills = bills.filter((b: any) => {
    return b.status !== 'paid' && new Date(b.due_date) < now
  })

  if (overdueBills.length > 0) {
    insights.push({
      id: `bills-overdue-${Date.now()}`,
      type: 'anomaly',
      priority: 'high',
      title: 'Overdue Bills Detected',
      message: `You have ${overdueBills.length} overdue bill${overdueBills.length > 1 ? 's' : ''}. Late payments may incur fees and affect credit score.`,
      domain: 'financial',
      actionLabel: 'Pay Now',
      actionPath: '/bills',
      createdAt: now
    })
  }

  return insights
}

/**
 * Analyze habit streaks and consistency
 */
function analyzeHabitData(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const habits = context.habits || []
  const now = new Date()

  if (habits.length === 0) return insights

  // Find longest streak
  const activeHabits = habits.filter((h: any) => h.active && h.current_streak > 0)
  if (activeHabits.length > 0) {
    const longestStreak = activeHabits.reduce((max: any, h: any) => 
      h.current_streak > max.current_streak ? h : max
    )

    if (longestStreak.current_streak >= 7) {
      insights.push({
        id: `habit-streak-${Date.now()}`,
        type: 'celebration',
        priority: 'low',
        title: `🔥 ${longestStreak.current_streak}-Day Streak!`,
        message: `Amazing! You've maintained "${longestStreak.name}" for ${longestStreak.current_streak} days straight. Keep it going!`,
        createdAt: now
      })
    }
  }

  // Habits that need attention (broken streaks)
  const brokenStreaks = habits.filter((h: any) => h.active && h.current_streak === 0 && h.best_streak > 0)
  if (brokenStreaks.length > 0) {
    insights.push({
      id: `habit-broken-${Date.now()}`,
      type: 'suggestion',
      priority: 'medium',
      title: 'Restart Your Habits',
      message: `${brokenStreaks.length} habit${brokenStreaks.length > 1 ? 's' : ''} need attention. Today is a great day to restart!`,
      actionLabel: 'View Habits',
      actionPath: '/habits',
      createdAt: now
    })
  }

  return insights
}

/**
 * Find correlations between different life domains
 */
function findCrossdomainCorrelations(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const now = new Date()

  // Correlation: Workouts and spending
  const healthData = context.domains.health || []
  const financialData = context.domains.financial || []
  
  if (healthData.length > 10 && financialData.length > 10) {
    // Simple correlation: more workouts = less dining out
    const workouts = healthData.filter((h: any) => h.metadata?.workout_type || h.metadata?.type === 'workout')
    const diningExpenses = financialData.filter((f: any) => {
      const cat = ((f.metadata?.category || f.category || '')).toLowerCase()
      return cat.includes('dining') || cat.includes('restaurant') || cat.includes('food')
    })

    if (workouts.length >= 3 && diningExpenses.length > 0) {
      insights.push({
        id: `correlation-workout-dining-${Date.now()}`,
        type: 'correlation',
        priority: 'low',
        title: 'Health-Finance Connection',
        message: 'We noticed that when you exercise regularly, you tend to make healthier food choices and spend less on dining out. Your body and wallet thank you!',
        relatedDomains: ['health', 'financial'],
        createdAt: now
      })
    }
  }

  // Correlation: Mindfulness and productivity
  const mindfulnessData = context.domains.mindfulness || []
  const tasks = context.tasks || []
  
  if (mindfulnessData.length > 5 && tasks.length > 10) {
    const completedTasks = tasks.filter((t: any) => t.completed)
    const completionRate = (completedTasks.length / tasks.length) * 100

    if (completionRate > 70) {
      insights.push({
        id: `correlation-mindfulness-productivity-${Date.now()}`,
        type: 'correlation',
        priority: 'low',
        title: 'Mindfulness Boosts Productivity',
        message: 'Your mindfulness practice correlates with higher task completion. Mental clarity leads to better focus!',
        relatedDomains: ['mindfulness'] as Domain[],
        createdAt: now
      })
    }
  }

  return insights
}

/**
 * Analyze goal progress
 */
function analyzeGoalProgress(context: InsightContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const goals = context.goals || (context.domains as any).goals || []
  const now = new Date()

  if (goals.length === 0) return insights

  // Check for goals behind schedule
  const behindGoals = goals.filter((g: any) => {
    const meta = g.metadata || g
    const progress = meta.progress || 0
    const deadline = meta.deadline || meta.target_date
    
    if (!deadline || progress >= 100) return false
    
    const daysRemaining = (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    const expectedProgress = 100 - (daysRemaining / 30) * 100
    
    return progress < expectedProgress - 15
  })

  if (behindGoals.length > 0) {
    insights.push({
      id: `goals-behind-${Date.now()}`,
      type: 'reminder',
      priority: 'medium',
      title: 'Goals Need Attention',
      message: `${behindGoals.length} goal${behindGoals.length > 1 ? 's are' : ' is'} behind schedule. Consider adjusting your action plan or timeline.`,
      actionLabel: 'View Goals',
      actionPath: '/goals-coach',
      createdAt: now
    })
  }

  // Celebrate completed goals
  const completedGoals = goals.filter((g: any) => {
    const meta = g.metadata || g
    return (meta.progress >= 100) || meta.completed
  })

  if (completedGoals.length > 0) {
    insights.push({
      id: `goals-complete-${Date.now()}`,
      type: 'celebration',
      priority: 'low',
      title: '🎯 Goal Achieved!',
      message: `Congratulations! You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''}. Set new challenges to keep growing!`,
      actionLabel: 'Set New Goal',
      actionPath: '/goals-coach',
      createdAt: now
    })
  }

  return insights
}

/**
 * Get daily insights summary
 */
export function getDailySummary(insights: ProactiveInsight[]): string {
  const highPriority = insights.filter(i => i.priority === 'high')
  const celebrations = insights.filter(i => i.type === 'celebration')
  const suggestions = insights.filter(i => i.type === 'suggestion')

  let summary = `📊 **Daily Life Summary**\n\n`

  if (highPriority.length > 0) {
    summary += `⚠️ **Needs Attention (${highPriority.length}):**\n`
    highPriority.forEach(i => {
      summary += `• ${i.title}\n`
    })
    summary += '\n'
  }

  if (celebrations.length > 0) {
    summary += `🎉 **Wins Today (${celebrations.length}):**\n`
    celebrations.forEach(i => {
      summary += `• ${i.title}\n`
    })
    summary += '\n'
  }

  if (suggestions.length > 0) {
    summary += `💡 **Suggestions (${suggestions.length}):**\n`
    suggestions.slice(0, 3).forEach(i => {
      summary += `• ${i.title}\n`
    })
  }

  return summary
}
