'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, AlertCircle, Calendar, DollarSign, Heart } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns'

type Insight = {
  icon: React.ReactNode
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  color: string
}

export function InsightsCardWorking() {
  const { data, tasks, habits, bills, documents } = useData()
  const [insights, setInsights] = useState<Insight[]>([])

  const generateInsights = useMemo(() => {
    const generated: Insight[] = []
    const now = new Date()

    // 1. Check for upcoming bills
    const upcomingBills = bills.filter(bill => {
      if (!bill.dueDate) return false
      const dueDate = parseISO(bill.dueDate)
      const daysUntil = differenceInDays(dueDate, now)
      return daysUntil >= 0 && daysUntil <= 7
    })
    
    if (upcomingBills.length > 0) {
      const totalAmount = upcomingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
      generated.push({
        icon: <DollarSign className="w-4 h-4" />,
        title: 'Bills Due Soon',
        message: `💳 ${upcomingBills.length} bills due this week ($${totalAmount.toFixed(0)})`,
        priority: 'high',
        color: 'bg-orange-500'
      })
    }

    // 2. Check overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      const dueDate = parseISO(task.dueDate)
      return isBefore(dueDate, now)
    })

    if (overdueTasks.length > 0) {
      generated.push({
        icon: <AlertCircle className="w-4 h-4" />,
        title: 'Overdue Tasks',
        message: `⚠️ ${overdueTasks.length} tasks past due date`,
        priority: 'high',
        color: 'bg-red-500'
      })
    }

    // 3. Check habit streaks
    const activeHabits = habits.filter(h => !h.completed && h.streak && h.streak > 5)
    if (activeHabits.length > 0) {
      const bestStreak = Math.max(...activeHabits.map(h => h.streak || 0))
      generated.push({
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Great Momentum!',
        message: `🔥 ${bestStreak}-day streak on habits! Keep it up!`,
        priority: 'low',
        color: 'bg-green-500'
      })
    }

    // 4. Check domain activity
    const allEntries = Object.values(data).flat()
    const recentEntries = allEntries.filter(entry => {
      if (!entry.createdAt) return false
      const created = new Date(entry.createdAt)
      return differenceInDays(now, created) <= 7
    })

    if (recentEntries.length > 5) {
      generated.push({
        icon: <Sparkles className="w-4 h-4" />,
        title: 'Productive Week',
        message: `✨ ${recentEntries.length} new items added this week`,
        priority: 'low',
        color: 'bg-blue-500'
      })
    }

    // 5. Check for expiring documents
    const expiringDocs = allEntries.filter(entry => {
      const expDate = entry.metadata?.expirationDate || entry.metadata?.expiration_date
      if (!expDate) return false
      try {
        const expirationDate = new Date(String(expDate))
        if (isNaN(expirationDate.getTime())) return false
        const daysUntil = differenceInDays(expirationDate, now)
        return daysUntil >= 0 && daysUntil <= 30
      } catch {
        return false
      }
    })

    if (expiringDocs.length > 0) {
      generated.push({
        icon: <Calendar className="w-4 h-4" />,
        title: 'Documents Expiring',
        message: `📄 ${expiringDocs.length} documents expire in 30 days`,
        priority: 'medium',
        color: 'bg-yellow-500'
      })
    }

    // 6. Check financial domain activity
    const financialEntries = data.financial || []
    if (financialEntries.length > 0) {
      const totalValue = financialEntries.reduce((sum, entry: any) => {
        const amount = entry.amount || entry.balance || entry.value || entry.metadata?.amount || 0
        return sum + (typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0)
      }, 0)

      if (totalValue > 1000) {
        generated.push({
          icon: <DollarSign className="w-4 h-4" />,
          title: 'Financial Overview',
          message: `💰 Tracking $${(totalValue / 1000).toFixed(1)}K across ${financialEntries.length} items`,
          priority: 'low',
          color: 'bg-green-500'
        })
      }
    }

    // 7. Health domain check
    const healthEntries = data.health || []
    if (healthEntries.length > 0) {
      const recentHealth = healthEntries.filter((entry: any) => {
        if (!entry.createdAt) return false
        return differenceInDays(now, new Date(entry.createdAt)) <= 30
      })
      
      if (recentHealth.length > 0) {
        generated.push({
          icon: <Heart className="w-4 h-4" />,
          title: 'Health Tracking',
          message: `❤️ ${recentHealth.length} health records logged this month`,
          priority: 'low',
          color: 'bg-red-500'
        })
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return generated
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5)
  }, [data, tasks, habits, bills, documents])

  useEffect(() => {
    setInsights(generateInsights)
  }, [generateInsights])

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="text-lg">Weekly Insights</span>
          </div>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
            AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">Add more data to see insights!</p>
            <p className="text-xs text-gray-400 mt-1">Track tasks, bills, and activities</p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <div className={`${insight.color} text-white p-2 rounded-lg flex-shrink-0`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {insight.title}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          insight.priority === 'high' ? 'border-red-500 text-red-600' :
                          insight.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                          'border-green-500 text-green-600'
                        }`}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

