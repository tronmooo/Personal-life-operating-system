'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, TrendingUp, Eye, MousePointer, 
  Calendar, Clock, Activity, Sparkles, Download, DollarSign, Target, Shield
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdvancedDashboard } from '@/components/analytics/advanced-dashboard'
import { LifeBalanceWheel } from '@/components/analytics/life-balance-wheel'
import { WhatIfScenarios } from '@/components/analytics/what-if-scenarios'
import { ComparativeBenchmarking } from '@/components/analytics/comparative-benchmarking'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'

interface AnalyticsSummary {
  total_events: number
  total_sessions: number
  most_viewed_domains: { domain: string; count: number }[]
  most_used_actions: { action: string; count: number }[]
  recent_activity: { event_type: string; created_at: string }[]
  daily_events: { date: string; count: number }[]
}

interface ComprehensiveAnalytics {
  financialHealth: any
  lifeBalance: any[]
  costAnalysis: any
  trends: any[]
  predictions: any
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [comprehensiveAnalytics, setComprehensiveAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingComprehensive, setIsLoadingComprehensive] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const supabase = createClientComponentClient()

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Calculate date range
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Fetch events
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Analytics error:', error)
        setAnalytics(null)
        setIsLoading(false)
        return
      }

      if (!events || events.length === 0) {
        setAnalytics(null)
        setIsLoading(false)
        return
      }

      // Process analytics
      const summary: AnalyticsSummary = {
        total_events: events.length,
        total_sessions: calculateSessions(events),
        most_viewed_domains: getMostViewedDomains(events),
        most_used_actions: getMostUsedActions(events),
        recent_activity: events.slice(0, 10).map(e => ({
          event_type: e.event_type,
          created_at: e.created_at,
        })),
        daily_events: getDailyEvents(events, daysAgo),
      }

      setAnalytics(summary)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, supabase])

  const loadComprehensiveAnalytics = useCallback(async () => {
    setIsLoadingComprehensive(true)
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const response = await fetch(`/api/analytics/comprehensive?timeRange=${daysAgo}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setComprehensiveAnalytics(result.data)
      } else {
        setComprehensiveAnalytics(null)
      }
    } catch (error) {
      console.error('Failed to load comprehensive analytics:', error)
      setComprehensiveAnalytics(null)
    } finally {
      setIsLoadingComprehensive(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadAnalytics()
    loadComprehensiveAnalytics()
  }, [loadAnalytics, loadComprehensiveAnalytics])

  const calculateSessions = (events: any[]) => {
    // Simple session calculation: group by 30-minute windows
    const sessions = new Set()
    events.forEach(event => {
      const sessionKey = Math.floor(new Date(event.created_at).getTime() / (30 * 60 * 1000))
      sessions.add(sessionKey)
    })
    return sessions.size
  }

  const getMostViewedDomains = (events: any[]) => {
    const domainCounts: Record<string, number> = {}
    events.forEach(event => {
      if (event.event_type === 'card_interaction' && event.event_data?.card_id) {
        const domain = event.event_data.card_id
        domainCounts[domain] = (domainCounts[domain] || 0) + 1
      }
    })
    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const getMostUsedActions = (events: any[]) => {
    const actionCounts: Record<string, number> = {}
    events.forEach(event => {
      actionCounts[event.event_type] = (actionCounts[event.event_type] || 0) + 1
    })
    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const getDailyEvents = (events: any[], days: number) => {
    const dailyCounts: Record<string, number> = {}
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyCounts[dateKey] = 0
    }

    // Count events by day
    events.forEach(event => {
      const dateKey = event.created_at.split('T')[0]
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++
      }
    })

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const exportAnalytics = () => {
    if (!analytics) return
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  if (isLoading && isLoadingComprehensive) {
    return <LoadingState message="Loading your analytics..." variant="spinner" size="lg" />
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your life data and usage patterns
          </p>
        </div>

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="comprehensive" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
            <TabsTrigger value="domain-data">Domain Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          </TabsList>

          {/* Comprehensive Analytics */}
          <TabsContent value="comprehensive" className="space-y-6">
            {isLoadingComprehensive ? (
              <LoadingState message="Loading comprehensive analytics..." />
            ) : comprehensiveAnalytics ? (
              <>
                {/* Financial Health Score */}
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Health Score
                    </CardTitle>
                    <CardDescription>
                      Comprehensive financial wellness assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-5xl font-bold">{comprehensiveAnalytics.financialHealth.score}</span>
                          <span className="text-2xl text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <Badge 
                        variant={comprehensiveAnalytics.financialHealth.score >= 80 ? 'default' : 
                                comprehensiveAnalytics.financialHealth.score >= 60 ? 'secondary' : 'destructive'}
                        className="text-lg px-4 py-2"
                      >
                        {comprehensiveAnalytics.financialHealth.score >= 80 ? 'Excellent' : 
                         comprehensiveAnalytics.financialHealth.score >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                        <span className="text-sm font-medium">Income vs Expenses</span>
                        <div className="text-2xl font-bold">
                          ${comprehensiveAnalytics.financialHealth.incomeVsExpenses.income.toFixed(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Monthly income
                        </p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                        <span className="text-sm font-medium">Debt-to-Income</span>
                        <div className="text-2xl font-bold">
                          {(comprehensiveAnalytics.financialHealth.debtToIncome.ratio * 100).toFixed(1)}%
                        </div>
                        <Badge variant={comprehensiveAnalytics.financialHealth.debtToIncome.ratio < 0.36 ? 'default' : 'destructive'}>
                          {comprehensiveAnalytics.financialHealth.debtToIncome.ratio < 0.36 ? 'Healthy' : 'High'}
                        </Badge>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                        <span className="text-sm font-medium">Emergency Fund</span>
                        <div className="text-2xl font-bold">
                          {comprehensiveAnalytics.financialHealth.emergencyFund.monthsCovered.toFixed(1)} mo
                        </div>
                        <Badge variant={
                          comprehensiveAnalytics.financialHealth.emergencyFund.status === 'excellent' ? 'default' :
                          comprehensiveAnalytics.financialHealth.emergencyFund.status === 'good' ? 'secondary' :
                          'destructive'
                        }>
                          {comprehensiveAnalytics.financialHealth.emergencyFund.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Cost Analysis
                    </CardTitle>
                    <CardDescription>
                      Total monthly costs across all domains
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-bold">
                          ${comprehensiveAnalytics.costAnalysis.totalMonthlyCost.toFixed(0)}
                        </span>
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-5">
                      {Object.entries(comprehensiveAnalytics.costAnalysis.breakdown).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-3 rounded-lg bg-secondary">
                          <p className="text-xs font-medium capitalize mb-1">{key}</p>
                          <p className="text-xl font-bold">${value.toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Predictive Analytics */}
                {comprehensiveAnalytics.predictions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        Predictive Analytics
                      </CardTitle>
                      <CardDescription>
                        Budget forecasts and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Next Month Budget Forecast</span>
                          <Badge variant="secondary">
                            {(comprehensiveAnalytics.predictions.budgetForecast.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Projected Spending</p>
                            <p className="text-2xl font-bold">
                              ${comprehensiveAnalytics.predictions.budgetForecast.projectedSpending}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Budget</p>
                            <p className="text-2xl font-bold">
                              ${comprehensiveAnalytics.predictions.budgetForecast.currentBudget}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Overage</p>
                            <p className={`text-2xl font-bold ${
                              comprehensiveAnalytics.predictions.budgetForecast.overageAmount > 0 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {comprehensiveAnalytics.predictions.budgetForecast.overageAmount > 0 ? '+' : ''}
                              ${comprehensiveAnalytics.predictions.budgetForecast.overageAmount}
                            </p>
                          </div>
                        </div>
                      </div>

                      {comprehensiveAnalytics.predictions.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Recommendations</h4>
                          {comprehensiveAnalytics.predictions.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary">
                              <Target className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Life Balance Wheel */}
                {comprehensiveAnalytics.lifeBalance && comprehensiveAnalytics.lifeBalance.length > 0 && (
                  <LifeBalanceWheel activities={comprehensiveAnalytics.lifeBalance} />
                )}

                {/* What-If Scenarios */}
                <WhatIfScenarios 
                  currentData={{
                    monthlyIncome: comprehensiveAnalytics.financialHealth.incomeVsExpenses.income,
                    monthlyExpenses: comprehensiveAnalytics.financialHealth.incomeVsExpenses.expenses,
                    savings: comprehensiveAnalytics.financialHealth.emergencyFund.current,
                    debt: comprehensiveAnalytics.financialHealth.debtToIncome.totalDebt,
                    netWorth: comprehensiveAnalytics.financialHealth.emergencyFund.current - comprehensiveAnalytics.financialHealth.debtToIncome.totalDebt
                  }}
                />

                {/* Comparative Benchmarking */}
                <ComparativeBenchmarking 
                  userProfile={{
                    age: 35,
                    location: 'USA',
                    incomeRange: '50k-100k'
                  }}
                  userMetrics={{
                    autoInsurance: 180,
                    healthInsurance: 450,
                    subscriptions: comprehensiveAnalytics.costAnalysis.breakdown.subscriptions,
                    savings: comprehensiveAnalytics.financialHealth.emergencyFund.current,
                    fitnessActivity: 3
                  }}
                />
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No domain data available yet. Add entries to your domains to see comprehensive insights!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Domain Data Analytics */}
          <TabsContent value="domain-data" className="space-y-6">
            <AdvancedDashboard />
          </TabsContent>

          {/* Usage Analytics */}
          <TabsContent value="usage" className="space-y-6">
            {/* Original usage analytics content */}
            {!analytics ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No usage analytics available yet. Start using your dashboard to see insights!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Time Range Selector */}
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                      {(['7d', '30d', '90d'] as const).map(range => (
                        <Button
                          key={range}
                          variant={timeRange === range ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setTimeRange(range)}
                          className={timeRange === range ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        >
                          {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                        </Button>
                      ))}
                    </div>

                    <Button variant="outline" onClick={exportAnalytics}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{analytics.total_events}</span>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{analytics.total_sessions}</span>
                <Clock className="h-8 w-8 text-green-600" />
                  </div>
            </CardContent>
          </Card>

          <Card className="card-hover-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Events/Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {Math.round(analytics.total_events / analytics.total_sessions) || 0}
                </span>
                <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
            </CardContent>
          </Card>

          <Card className="card-hover-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {Math.max(...analytics.daily_events.map(d => d.count))}
                </span>
                <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
            </CardContent>
          </Card>
                </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Viewed Domains */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Most Viewed Domains
              </CardTitle>
              <CardDescription>Your most frequently accessed areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.most_viewed_domains.map(({ domain, count }, index) => (
                <div key={domain} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{domain}</span>
                      <span className="text-sm text-muted-foreground">{count} views</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${(count / analytics.most_viewed_domains[0].count) * 100}%` }}
                      />
                    </div>
                    </div>
                  </div>
            ))}
            </CardContent>
        </Card>

          {/* Most Used Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Most Used Actions
              </CardTitle>
              <CardDescription>What you do most in the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.most_used_actions.map(({ action, count }, index) => (
                <div key={action} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{action.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-muted-foreground">{count}x</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                        style={{ width: `${(count / analytics.most_used_actions[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  </div>
            ))}
            </CardContent>
          </Card>
                  </div>

        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Daily Activity
            </CardTitle>
            <CardDescription>Your dashboard usage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {analytics.daily_events.slice(-30).map(({ date, count }) => (
                <div
                  key={date}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t hover:opacity-80 transition-opacity relative group"
                  style={{ height: `${(count / Math.max(...analytics.daily_events.map(d => d.count))) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {new Date(date).toLocaleDateString()}: {count} events
                  </div>
                </div>
            ))}
              </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{analytics.daily_events[0]?.date}</span>
              <span>{analytics.daily_events[analytics.daily_events.length - 1]?.date}</span>
            </div>
          </CardContent>
          </Card>

        {/* Insights */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                You're most active in the <strong>{analytics.most_viewed_domains[0]?.domain}</strong> domain. 
                Consider customizing this card for quick access!
              </p>
        </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                You typically access your dashboard <strong>{Math.round(analytics.total_sessions / 30)}</strong> times 
                per day on average.
              </p>
      </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Try the layout wizard to create a custom view focused on your most-used domains!
              </p>
    </div>
          </CardContent>
        </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
