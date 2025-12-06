'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Lightbulb, Target, DollarSign, Activity, Zap 
} from 'lucide-react'

export interface Insight {
  id: string
  type: 'success' | 'warning' | 'info' | 'tip'
  category: string
  title: string
  description: string
  action?: string
  icon: any
}

export function SmartInsights() {
  const { data, tasks, habits, bills, documents, events } = useData()
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    generateInsights()
  }, [data, tasks, habits, bills, documents, events])

  const generateInsights = () => {
    const newInsights: Insight[] = []

    // Bills insights
    const pendingBills = bills.filter(b => b.status === 'pending')
    const today = new Date()
    const urgentBills = pendingBills.filter(b => {
      const daysUntil = Math.ceil((new Date(b.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 3
    })

    if (urgentBills.length > 0) {
      const totalAmount = urgentBills.reduce((sum, b) => sum + b.amount, 0)
      newInsights.push({
        id: 'urgent-bills',
        type: 'warning',
        category: 'Finance',
        title: `${urgentBills.length} bills due soon`,
        description: `Total $${totalAmount.toFixed(2)} due within 3 days`,
        action: 'Review bills',
        icon: AlertTriangle,
      })
    } else if (pendingBills.length === 0 && bills.length > 0) {
      newInsights.push({
        id: 'bills-clear',
        type: 'success',
        category: 'Finance',
        title: 'All bills paid!',
        description: 'You\'re all caught up on bill payments',
        icon: CheckCircle,
      })
    }

    // Habits insights
    const maxStreak = Math.max(...habits.map(h => h.streak), 0)
    if (maxStreak >= 7) {
      newInsights.push({
        id: 'habit-streak',
        type: 'success',
        category: 'Habits',
        title: `${maxStreak} day streak!`,
        description: 'Amazing consistency! Keep it up',
        icon: Activity,
      })
    }

    const incompleteHabits = habits.filter(h => !h.completed)
    if (incompleteHabits.length > 0 && new Date().getHours() >= 18) {
      newInsights.push({
        id: 'habits-reminder',
        type: 'info',
        category: 'Habits',
        title: `${incompleteHabits.length} habits pending`,
        description: 'Complete them before the day ends',
        action: 'View habits',
        icon: Target,
      })
    }

    // Tasks insights
    const incompleteTasks = tasks.filter(t => !t.completed)
    const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high')
    
    if (highPriorityTasks.length > 0) {
      newInsights.push({
        id: 'high-priority-tasks',
        type: 'warning',
        category: 'Productivity',
        title: `${highPriorityTasks.length} high priority tasks`,
        description: 'Focus on these important items first',
        action: 'View tasks',
        icon: AlertTriangle,
      })
    }

    // Documents insights
    const expiringDocs = documents.filter(doc => {
      if (!doc.expiryDate) return false
      const daysUntil = Math.ceil((new Date(doc.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 30 && daysUntil >= 0
    })

    if (expiringDocs.length > 0) {
      newInsights.push({
        id: 'expiring-docs',
        type: 'warning',
        category: 'Documents',
        title: `${expiringDocs.length} documents expiring soon`,
        description: 'Review and renew important documents',
        action: 'View documents',
        icon: AlertTriangle,
      })
    }

    // Events insights
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date)
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil >= 0 && daysUntil <= 7
    })

    if (upcomingEvents.length > 0) {
      newInsights.push({
        id: 'upcoming-events',
        type: 'info',
        category: 'Calendar',
        title: `${upcomingEvents.length} events this week`,
        description: 'Check your calendar to stay prepared',
        action: 'View events',
        icon: Target,
      })
    }

    // General tips
    const totalItems = Object.values(data).reduce((sum, items) => sum + items.length, 0)
    if (totalItems === 0) {
      newInsights.push({
        id: 'getting-started',
        type: 'tip',
        category: 'Tips',
        title: 'Welcome to LifeHub!',
        description: 'Start by adding items to your favorite life domains',
        action: 'Explore domains',
        icon: Lightbulb,
      })
    }

    // Productivity insights
    const completedToday = tasks.filter(t => {
      if (!t.completed) return false
      // In a real app, you'd track completion date
      return true
    })

    if (completedToday.length >= 5) {
      newInsights.push({
        id: 'productive-day',
        type: 'success',
        category: 'Productivity',
        title: 'Productive day!',
        description: `You've completed ${completedToday.length} tasks`,
        icon: Zap,
      })
    }

    // Financial insights
    const thisMonthBills = bills.filter(b => {
      const billDate = new Date(b.dueDate)
      return billDate.getMonth() === today.getMonth() && billDate.getFullYear() === today.getFullYear()
    })
    const totalMonthlyBills = thisMonthBills.reduce((sum, b) => sum + b.amount, 0)

    if (totalMonthlyBills > 0) {
      newInsights.push({
        id: 'monthly-expenses',
        type: 'info',
        category: 'Finance',
        title: 'Monthly bills overview',
        description: `$${totalMonthlyBills.toFixed(2)} in bills this month`,
        icon: DollarSign,
      })
    }

    setInsights(newInsights)
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20'
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
      case 'tip':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
      default:
        return ''
    }
  }

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'tip':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return ''
    }
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map(insight => {
          const Icon = insight.icon
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <Badge className={`text-xs ${getInsightBadgeColor(insight.type)}`}>
                    {insight.category}
                  </Badge>
                </div>
              </div>
              <h4 className="font-semibold mb-1">{insight.title}</h4>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              {insight.action && (
                <button className="text-sm font-medium text-primary mt-2 hover:underline">
                  {insight.action} →
                </button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}








