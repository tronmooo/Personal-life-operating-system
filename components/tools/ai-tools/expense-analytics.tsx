'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingDown, TrendingUp, DollarSign, PieChart, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CategorySpending {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  icon: string
}

export function ExpenseAnalytics() {
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<{
    totalSpent: number
    averageDaily: number
    categories: CategorySpending[]
    topExpenses: Array<{ merchant: string; amount: number; date: string; category: string }>
    insights: string[]
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch receipts from the database
      const response = await fetch('/api/ai-tools/receipts', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const receipts = result.data || []
        
        // Calculate analytics from receipts
        const daysAgo = parseInt(timeRange)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

        const filteredReceipts = receipts.filter((r: any) => 
          new Date(r.date) >= cutoffDate
        )

        // Calculate total spent
        const totalSpent = filteredReceipts.reduce((sum: number, r: any) => 
          sum + (parseFloat(r.amount) || 0), 0
        )

        // Group by category
        const categoryMap: Record<string, number> = {}
        filteredReceipts.forEach((r: any) => {
          const cat = r.category || 'Other'
          categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(r.amount) || 0)
        })

        // Create category breakdown
        const categories: CategorySpending[] = Object.entries(categoryMap).map(([cat, amount]) => ({
          category: cat,
          amount,
          percentage: (amount / totalSpent) * 100,
          trend: 'stable' as const,
          icon: getCategoryIcon(cat)
        })).sort((a, b) => b.amount - a.amount)

        // Top expenses
        const topExpenses = filteredReceipts
          .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
          .slice(0, 5)
          .map((r: any) => ({
            merchant: r.merchant_name || 'Unknown',
            amount: parseFloat(r.amount) || 0,
            date: r.date,
            category: r.category || 'Other'
          }))

        // Generate insights
        const insights = generateInsights(totalSpent, categories, parseInt(timeRange))

        setAnalytics({
          totalSpent,
          averageDaily: totalSpent / parseInt(timeRange),
          categories,
          topExpenses,
          insights
        })
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Show empty state on error - no mock data
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'Groceries': '🛒',
      'Dining': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Gas': '⛽',
      'Utilities': '💡',
      'Healthcare': '🏥',
      'Other': '📦'
    }
    return icons[category] || '📦'
  }

  const generateInsights = (total: number, categories: CategorySpending[], days: number): string[] => {
    const insights: string[] = []
    
    if (total > 2000) {
      insights.push(`High spending alert: $${total.toFixed(2)} in ${days} days`)
    }

    const topCategory = categories[0]
    if (topCategory && topCategory.percentage > 35) {
      insights.push(`${topCategory.category} accounts for ${topCategory.percentage.toFixed(0)}% of spending`)
    }

    insights.push(`Average daily spending: $${(total / days).toFixed(2)}`)
    
    if (categories.length > 5) {
      insights.push(`Spending across ${categories.length} categories`)
    }

    return insights
  }

  const exportData = () => {
    if (!analytics) return

    const csvContent = [
      ['Category', 'Amount', 'Percentage'],
      ...analytics.categories.map(c => [c.category, c.amount.toFixed(2), c.percentage.toFixed(1) + '%'])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-analytics-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Exported!',
      description: 'Analytics data exported to CSV.'
    })
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-4xl">📊</span>
            Expense Analytics Dashboard
          </CardTitle>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportData} disabled={!analytics}>
              Export CSV
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive analysis of your spending patterns powered by AI
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Analyzing your expenses...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ${analytics.totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Daily Average</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ${analytics.averageDaily.toFixed(2)}
                      </p>
                    </div>
                    <Calendar className="h-12 w-12 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Categories</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {analytics.categories.length}
                      </p>
                    </div>
                    <PieChart className="h-12 w-12 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-semibold">{cat.category}</span>
                        {cat.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                        {cat.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${cat.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topExpenses.map((exp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <div className="font-semibold">{exp.merchant}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(exp.date).toLocaleDateString()} • {exp.category}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        ${exp.amount.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <PieChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>No expense data available. Start scanning receipts to see analytics!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}














