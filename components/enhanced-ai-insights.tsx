'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  DollarSign, Heart, Target, Zap, Clock, Award, AlertCircle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'
import { subDays, format, differenceInDays } from 'date-fns'

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info'
  category: string
  title: string
  description: string
  icon: any
  actionable: boolean
  recommendation?: string
  priority: 'high' | 'medium' | 'low'
}

export function EnhancedAIInsights() {
  const { data, habits, bills, tasks } = useData()

  const insights = useMemo<Insight[]>(() => {
    const allInsights: Insight[] = []
    const now = new Date()
    const last30Days = subDays(now, 30)
    const last7Days = subDays(now, 7)

    // === FINANCIAL INSIGHTS ===
    const financialData = (data.financial || []) as any[]
    
    // Calculate spending by category
    const expenses = financialData.filter(item => {
      const type = item.type || item.metadata?.type
      const itemDate = new Date(item.date || item.createdAt)
      return (type === 'expense' || type === 'bill') && itemDate >= last30Days
    })

    const income = financialData.filter(item => {
      const type = item.type || item.metadata?.type
      const itemDate = new Date(item.date || item.createdAt)
      return type === 'income' && itemDate >= last30Days
    })

    const totalExpenses = expenses.reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item.amount || item.metadata?.amount || 0))
    }, 0)

    const totalIncome = income.reduce((sum, item) => {
      return sum + Math.abs(parseFloat(item.amount || item.metadata?.amount || 0))
    }, 0)

    // Spending by category
    const spendingByCategory: Record<string, number> = {}
    expenses.forEach(item => {
      const category = item.metadata?.category || item.category || 'Other'
      spendingByCategory[category] = (spendingByCategory[category] || 0) + 
        Math.abs(parseFloat(item.amount || item.metadata?.amount || 0))
    })

    const topCategory = Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])[0]

    // Financial insights
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100
      
      if (savingsRate >= 30) {
        allInsights.push({
          type: 'success',
          category: 'Financial',
          title: 'Excellent Savings Rate',
          description: `You're saving ${savingsRate.toFixed(1)}% of your income - that's outstanding!`,
          icon: DollarSign,
          actionable: false,
          priority: 'medium',
        })
      } else if (savingsRate < 10) {
        allInsights.push({
          type: 'danger',
          category: 'Financial',
          title: 'Low Savings Rate',
          description: `You're only saving ${savingsRate.toFixed(1)}% of your income`,
          recommendation: 'Try to increase savings to at least 20%. Review your expenses and find areas to cut back.',
          icon: AlertTriangle,
          actionable: true,
          priority: 'high',
        })
      }
    }

    if (topCategory && topCategory[1] > totalExpenses * 0.4) {
      allInsights.push({
        type: 'warning',
        category: 'Financial',
        title: `High Spending in ${topCategory[0]}`,
        description: `${topCategory[0]} accounts for ${((topCategory[1] / totalExpenses) * 100).toFixed(0)}% of your expenses ($${topCategory[1].toFixed(0)})`,
        recommendation: `Review your ${topCategory[0]} spending. Small reductions in your biggest category have the most impact.`,
        icon: DollarSign,
        actionable: true,
        priority: 'medium',
      })
    }

    // Recent spending trend
    const last7DaysExpenses = expenses.filter(item => 
      new Date(item.date || item.createdAt) >= last7Days
    )
    const last7DaysTotal = last7DaysExpenses.reduce((sum, item) => 
      sum + Math.abs(parseFloat(item.amount || item.metadata?.amount || 0)), 0
    )
    const dailyAverage = last7DaysTotal / 7
    const monthlyProjected = dailyAverage * 30

    if (monthlyProjected > totalExpenses * 1.2) {
      allInsights.push({
        type: 'warning',
        category: 'Financial',
        title: 'Spending Spike Detected',
        description: `Your recent spending is 20% higher than your 30-day average`,
        recommendation: 'Review recent purchases and consider if this is sustainable.',
        icon: TrendingUp,
        actionable: true,
        priority: 'high',
      })
    }

    // === HEALTH INSIGHTS ===
    const healthData = (data.health || []) as any[]
    const recentHealthLogs = healthData.filter(item => 
      new Date(item.date || item.createdAt) >= last7Days
    )

    if (recentHealthLogs.length === 0 && healthData.length > 0) {
      allInsights.push({
        type: 'warning',
        category: 'Health',
        title: 'No Recent Health Tracking',
        description: "You haven't logged health data in over 7 days",
        recommendation: 'Regular health tracking helps identify patterns and maintain accountability.',
        icon: Heart,
        actionable: true,
        priority: 'medium',
      })
    }

    const weights = healthData.filter(item => item.weight || item.metadata?.weight)
      .map(item => ({
        date: new Date(item.date || item.createdAt),
        weight: parseFloat(item.weight || item.metadata?.weight)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (weights.length >= 3) {
      const recentWeights = weights.slice(-3)
      const trend = recentWeights[2].weight - recentWeights[0].weight
      
      if (trend < -5) {
        allInsights.push({
          type: 'success',
          category: 'Health',
          title: 'Great Weight Loss Progress',
          description: `You've lost ${Math.abs(trend).toFixed(1)} lbs in your last 3 weigh-ins`,
          icon: TrendingDown,
          actionable: false,
          priority: 'low',
        })
      } else if (trend > 5) {
        allInsights.push({
          type: 'info',
          category: 'Health',
          title: 'Weight Increase Detected',
          description: `You've gained ${trend.toFixed(1)} lbs recently`,
          recommendation: 'If this is unintentional, review your nutrition and activity levels.',
          icon: TrendingUp,
          actionable: true,
          priority: 'medium',
        })
      }
    }

    // === PRODUCTIVITY INSIGHTS ===
    const incompleteTasks = tasks.filter(t => !t.completed)
    const overdueTasks = incompleteTasks.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) < now
    })

    if (overdueTasks.length > 0) {
      allInsights.push({
        type: 'danger',
        category: 'Productivity',
        title: `${overdueTasks.length} Overdue Tasks`,
        description: 'You have tasks that need immediate attention',
        recommendation: 'Prioritize or reschedule overdue tasks to maintain momentum.',
        icon: AlertTriangle,
        actionable: true,
        priority: 'high',
      })
    }

    const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high')
    if (highPriorityTasks.length > 5) {
      allInsights.push({
        type: 'warning',
        category: 'Productivity',
        title: 'Too Many High Priority Tasks',
        description: `You have ${highPriorityTasks.length} high-priority tasks`,
        recommendation: 'Having too many "high priority" items dilutes focus. Re-evaluate priorities.',
        icon: Target,
        actionable: true,
        priority: 'medium',
      })
    }

    // === HABITS INSIGHTS ===
    const completedToday = habits.filter(h => {
      if (!h.lastCompleted) return false
      const lastDate = new Date(h.lastCompleted).toDateString()
      return lastDate === now.toDateString()
    })

    const completionRate = habits.length > 0 ? (completedToday.length / habits.length) * 100 : 0

    if (habits.length > 0 && completionRate === 100) {
      allInsights.push({
        type: 'success',
        category: 'Habits',
        title: 'Perfect Habit Day!',
        description: `You've completed all ${habits.length} habits today`,
        icon: Award,
        actionable: false,
        priority: 'low',
      })
    } else if (completionRate < 50 && habits.length > 0) {
      allInsights.push({
        type: 'warning',
        category: 'Habits',
        title: 'Habit Completion Low',
        description: `Only ${completionRate.toFixed(0)}% of habits completed today`,
        recommendation: 'Review your habit list. Are they realistic? Consider starting with fewer, more achievable habits.',
        icon: Clock,
        actionable: true,
        priority: 'medium',
      })
    }

    // === BILLS INSIGHTS ===
    const upcomingBills = bills.filter(bill => {
      if (bill.status === 'paid') return false
      const dueDate = new Date(bill.dueDate)
      const daysUntil = differenceInDays(dueDate, now)
      return daysUntil <= 7 && daysUntil >= 0
    })

    if (upcomingBills.length > 0) {
      const totalDue = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)
      allInsights.push({
        type: 'warning',
        category: 'Financial',
        title: `${upcomingBills.length} Bills Due This Week`,
        description: `Total: $${totalDue.toFixed(0)} due in the next 7 days`,
        recommendation: 'Review and schedule payments to avoid late fees.',
        icon: AlertCircle,
        actionable: true,
        priority: 'high',
      })
    }

    // === ACTIVITY INSIGHTS ===
    const allDomainData = Object.values(data).flat()
    const recentActivity = allDomainData.filter(item => {
      try {
        const itemDate = new Date((item as any).date || item.createdAt)
        return itemDate >= last7Days
      } catch {
        return false
      }
    })

    const activityCount = recentActivity.length
    if (activityCount < 5) {
      allInsights.push({
        type: 'info',
        category: 'Activity',
        title: 'Low Activity This Week',
        description: `Only ${activityCount} entries logged in the past 7 days`,
        recommendation: 'Regular tracking provides better insights. Try to log something daily.',
        icon: Zap,
        actionable: true,
        priority: 'low',
      })
    } else if (activityCount > 50) {
      allInsights.push({
        type: 'success',
        category: 'Activity',
        title: 'Highly Active Tracking!',
        description: `${activityCount} entries this week - excellent consistency!`,
        icon: Zap,
        actionable: false,
        priority: 'low',
      })
    }

    // Sort by priority
    return allInsights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [data, habits, bills, tasks])

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
      case 'danger':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getIconStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'danger':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Intelligent recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start logging data to receive personalized insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              {insights.length} insights found • Updated in real-time
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            AI Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${getTypeStyles(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getIconStyles(insight.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    {insight.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <div className="flex items-start gap-2 mt-2 p-2 rounded bg-background/50">
                      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium">
                        {insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

