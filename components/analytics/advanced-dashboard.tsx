'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, TrendingDown, DollarSign, Target, Calendar,
  Activity, Zap, Award, AlertCircle, Download, Share2,
  PieChart, Shield, CreditCard, Wrench, MoreHorizontal,
  Home, Car, Heart, Dumbbell, Brain, Utensils
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { DomainDataCharts } from './domain-data-charts'
import { calculateUnifiedNetWorth } from '@/lib/utils/unified-financial-calculator'

interface AnalyticsData {
  financialHealth: number
  lifeBalance: number
  productivity: number
  wellbeing: number
  goalProgress: number
}

export function AdvancedDashboard() {
  const router = useRouter()
  const { data, bills, tasks } = useData()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    financialHealth: 0,
    lifeBalance: 0,
    productivity: 0,
    wellbeing: 0,
    goalProgress: 0,
  })
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // Calculate real expense breakdown from domain data (same pattern as command center)
  const expenseBreakdown = useMemo(() => {
    const insuranceItems = Array.isArray(data.insurance) ? data.insurance : []
    const digitalItems = Array.isArray(data.digital) ? data.digital : []
    const financialItems = Array.isArray(data.financial) ? data.financial : []
    const homeItems = Array.isArray(data.home) ? data.home : []
    const vehiclesItems = Array.isArray(data.vehicles) ? data.vehicles : []
    
    let insurance = 0
    let subscriptions = 0
    let billsTotal = 0
    let maintenance = 0
    let other = 0

    // Insurance premiums
    insuranceItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const premium = parseFloat(String(meta?.monthlyPremium || meta?.premium || 0))
      if (premium > 0) insurance += premium
    })

    // Digital subscriptions
    digitalItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const isSubscription = meta?.type === 'subscription' || meta?.category === 'subscription'
      if (isSubscription) {
        const cost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
        if (cost > 0) subscriptions += cost
      }
    })

    // Financial bills & expenses
    financialItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const itemType = String(meta?.itemType || meta?.type || meta?.logType || '').toLowerCase()
      const amount = parseFloat(String(meta?.amount || meta?.value || 0))
      
      if (itemType.includes('bill') || itemType === 'recurring-bill') {
        billsTotal += Math.abs(amount)
      } else if (itemType.includes('expense')) {
        other += Math.abs(amount)
      }
    })

    // Home bills and utilities
    homeItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const itemType = String(meta?.itemType || '').toLowerCase()
      if (itemType === 'bill') {
        const amount = parseFloat(String(meta?.amount || 0))
        if (amount > 0) billsTotal += amount
      }
    })

    // Vehicle maintenance costs
    vehiclesItems.forEach((item: any) => {
      const meta = item?.metadata || {}
      const itemType = String(meta?.type || '').toLowerCase()
      if (itemType === 'cost') {
        const costType = String(meta?.costType || '').toLowerCase()
        const amount = parseFloat(String(meta?.amount || 0))
        if (costType === 'maintenance' || costType === 'repair') {
          maintenance += amount
        } else if (amount > 0) {
          other += amount
        }
      }
    })

    return { insurance, subscriptions, bills: billsTotal, maintenance, other }
  }, [data])

  // Calculate net worth using unified calculator
  const netWorthData = useMemo(() => {
    return calculateUnifiedNetWorth(data, { assets: 0, liabilities: 0 })
  }, [data])

  // Calculate domain item counts for distribution chart
  const domainDistribution = useMemo(() => {
    const domains = [
      { key: 'financial', label: 'Financial', icon: DollarSign, color: 'bg-green-500' },
      { key: 'health', label: 'Health', icon: Heart, color: 'bg-red-500' },
      { key: 'home', label: 'Home', icon: Home, color: 'bg-orange-500' },
      { key: 'vehicles', label: 'Vehicles', icon: Car, color: 'bg-blue-500' },
      { key: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-indigo-500' },
      { key: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'bg-pink-500' },
      { key: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'bg-yellow-500' },
      { key: 'mindfulness', label: 'Mindfulness', icon: Brain, color: 'bg-teal-500' },
    ]

    return domains.map(d => ({
      ...d,
      count: Array.isArray((data as any)[d.key]) ? ((data as any)[d.key] as any[]).length : 0
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count)
  }, [data])

  useEffect(() => {
    calculateAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, data, bills, tasks])

  const calculateAnalytics = () => {
    // Financial Health Score from bills in provider
    const paidBills = bills.filter((b: any) => b.status === 'paid').length
    const financialScore = bills.length > 0 ? (paidBills / bills.length) * 100 : 75

    // Life Balance (how many domains are actively used)
    const allDomains = ['financial', 'health', 'insurance', 'home', 'vehicles', 'fitness', 'nutrition', 'mindfulness', 'digital', 'pets'] as const
    const activeDomains = allDomains.filter(d => Array.isArray((data as any)[d]) && ((data as any)[d] as any[]).length > 0)
    const balanceScore = (activeDomains.length / allDomains.length) * 100

    // Productivity (task completion rate)
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const productivityScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 60

    // Wellbeing (health domain activity)
    const healthData = (data.health || []) as any[]
    const fitnessData = (data.fitness || []) as any[]
    const allWellnessData = [...healthData, ...fitnessData]
    const recentActivity = allWellnessData.filter((item: any) => {
      const date = new Date(item.metadata?.date || item.createdAt || item.created_at)
      return differenceInDays(new Date(), date) <= 7
    })
    const wellbeingScore = Math.min((recentActivity.length / 7) * 100, 100)

    // Goal Progress from financial goals items
    const goals = (data.financial || []).filter((i: any) => i.metadata?.itemType === 'goal')
    const avgProgress = goals.reduce((acc: number, g: any) => acc + (g.metadata?.progress || 0), 0) / (goals.length || 1)

    setAnalytics({
      financialHealth: Math.round(financialScore),
      lifeBalance: Math.round(balanceScore),
      productivity: Math.round(productivityScore),
      wellbeing: Math.round(wellbeingScore),
      goalProgress: Math.round(avgProgress),
    })
  }

  const predictiveInsights = useMemo(() => {
    const insights: any[] = []
    
    // Financial predictions
    const avgBill = bills.reduce((acc: number, b: any) => acc + (b.amount || 0), 0) / (bills.length || 1)
    if (avgBill > 0) {
      insights.push({
        type: 'prediction',
        category: 'Financial',
        title: 'Expected Bills Next Month',
        value: `$${Math.round(avgBill * bills.length)}`,
        trend: 'neutral',
        description: `Based on your average of $${Math.round(avgBill)} per bill`,
      })
    }

    // Health trends
    if (analytics.wellbeing > 70) {
      insights.push({
        type: 'positive',
        category: 'Health',
        title: 'Excellent Health Activity',
        value: `${analytics.wellbeing}%`,
        trend: 'up',
        description: 'Your workout frequency is above average',
      })
    } else if (analytics.wellbeing < 40) {
      insights.push({
        type: 'warning',
        category: 'Health',
        title: 'Low Health Activity',
        value: `${analytics.wellbeing}%`,
        trend: 'down',
        description: 'Consider scheduling more workouts this week',
      })
    }

    // Productivity insights
    if (analytics.productivity > 80) {
      insights.push({
        type: 'achievement',
        category: 'Productivity',
        title: 'High Task Completion',
        value: `${analytics.productivity}%`,
        trend: 'up',
        description: 'You\'re crushing your tasks! Keep it up!',
      })
    }

    // Balance insights
    if (analytics.lifeBalance < 50) {
      insights.push({
        type: 'suggestion',
        category: 'Balance',
        title: 'Expand Your Focus',
        value: `${Math.round(analytics.lifeBalance / 100 * 21)} of 21 domains`,
        trend: 'neutral',
        description: 'Try tracking more life areas for better balance',
      })
    }

    return insights
  }, [analytics])

  const overallScore = Math.round(
    (analytics.financialHealth + analytics.lifeBalance + 
     analytics.productivity + analytics.wellbeing + analytics.goalProgress) / 5
  )

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      scores: analytics,
      overallScore,
      insights: predictiveInsights,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lifehub-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Insights and predictions about your life management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overall Life Score */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Overall Life Score
          </CardTitle>
          <CardDescription>
            Your holistic life management health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{overallScore}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="mt-2 h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>
            <Badge 
              variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}
              className="text-lg px-4 py-2"
            >
              {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Financial Health"
          value={analytics.financialHealth}
          icon={DollarSign}
          color="green"
          description="Bill payment rate"
        />
        <MetricCard
          title="Life Balance"
          value={analytics.lifeBalance}
          icon={Activity}
          color="blue"
          description="Active life domains"
        />
        <MetricCard
          title="Productivity"
          value={analytics.productivity}
          icon={Zap}
          color="yellow"
          description="Task completion rate"
        />
        <MetricCard
          title="Wellbeing"
          value={analytics.wellbeing}
          icon={Activity}
          color="red"
          description="Health activity level"
        />
        <MetricCard
          title="Goal Progress"
          value={analytics.goalProgress}
          icon={Target}
          color="purple"
          description="Average goal completion"
        />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tracking Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{timeRange}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === 'week' ? 'Last 7 days' : 
               timeRange === 'month' ? 'Last 30 days' : 
               'Last 12 months'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Expense Breakdown - Real Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-orange-600" />
            Monthly Expense Breakdown
          </CardTitle>
          <CardDescription>
            Costs aggregated from all domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.values(expenseBreakdown).every(v => v === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expense data yet</p>
              <p className="text-sm">Add bills, subscriptions, or insurance to see breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total */}
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
                <p className="text-4xl font-bold">
                  ${(expenseBreakdown.insurance + expenseBreakdown.subscriptions + expenseBreakdown.bills + expenseBreakdown.maintenance + expenseBreakdown.other).toLocaleString()}
                </p>
              </div>
              
              {/* Breakdown bars */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <ExpenseCard label="Insurance" value={expenseBreakdown.insurance} icon={Shield} color="indigo" />
                <ExpenseCard label="Subscriptions" value={expenseBreakdown.subscriptions} icon={CreditCard} color="purple" />
                <ExpenseCard label="Bills" value={expenseBreakdown.bills} icon={DollarSign} color="blue" />
                <ExpenseCard label="Maintenance" value={expenseBreakdown.maintenance} icon={Wrench} color="orange" />
                <ExpenseCard label="Other" value={expenseBreakdown.other} icon={MoreHorizontal} color="gray" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Net Worth Summary - Real Data */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Net Worth Summary
          </CardTitle>
          <CardDescription>
            Calculated from all asset domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-green-600">
                ${netWorthData.totalAssets.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-600">
                ${netWorthData.totalLiabilities.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className={`text-2xl font-bold ${netWorthData.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netWorthData.netWorth.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Asset breakdown */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Asset Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {netWorthData.breakdown.homeValue > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Home:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.homeValue.toLocaleString()}</span>
                </div>
              )}
              {netWorthData.breakdown.vehicleValue > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Vehicles:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.vehicleValue.toLocaleString()}</span>
                </div>
              )}
              {netWorthData.breakdown.financialAssets > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Financial:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.financialAssets.toLocaleString()}</span>
                </div>
              )}
              {netWorthData.breakdown.collectiblesValue > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Collectibles:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.collectiblesValue.toLocaleString()}</span>
                </div>
              )}
              {netWorthData.breakdown.appliancesValue > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Appliances:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.appliancesValue.toLocaleString()}</span>
                </div>
              )}
              {netWorthData.breakdown.miscValue > 0 && (
                <div className="text-sm p-2 bg-white/50 dark:bg-gray-900/50 rounded">
                  <span className="text-muted-foreground">Other:</span>{' '}
                  <span className="font-semibold">${netWorthData.breakdown.miscValue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Distribution Chart */}
      {domainDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Domain Activity Distribution
            </CardTitle>
            <CardDescription>
              Items tracked across your life domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {domainDistribution.slice(0, 8).map((domain) => {
                const Icon = domain.icon
                const maxCount = domainDistribution[0]?.count || 1
                const percentage = Math.round((domain.count / maxCount) * 100)
                
                return (
                  <div key={domain.key} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${domain.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{domain.label}</span>
                        <span className="text-sm text-muted-foreground">{domain.count} items</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${domain.color} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
          <CardDescription>
            Smart predictions and recommendations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictiveInsights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Not enough data for insights yet</p>
              <p className="text-sm">Keep tracking to unlock predictions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictiveInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations - With Working Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.financialHealth < 70 && (
              <RecommendationItem
                title="Improve Financial Health"
                description="Review and pay pending bills to boost your financial score"
                action="View Bills"
                priority="high"
                onClick={() => router.push('/domains/financial')}
              />
            )}
            {analytics.lifeBalance < 60 && (
              <RecommendationItem
                title="Expand Life Balance"
                description="Try tracking more life domains for better overall balance"
                action="Explore Domains"
                priority="medium"
                onClick={() => router.push('/domains')}
              />
            )}
            {analytics.productivity < 50 && (
              <RecommendationItem
                title="Boost Productivity"
                description="Focus on completing pending tasks to improve your productivity score"
                action="View Tasks"
                priority="high"
                onClick={() => router.push('/tasks')}
              />
            )}
            {analytics.wellbeing < 60 && (
              <RecommendationItem
                title="Increase Health Activity"
                description="Log more workouts or health activities this week"
                action="Log Activity"
                priority="medium"
                onClick={() => router.push('/domains/fitness')}
              />
            )}
            {/* Always show at least one recommendation */}
            {analytics.financialHealth >= 70 && analytics.lifeBalance >= 60 && analytics.productivity >= 50 && analytics.wellbeing >= 60 && (
              <div className="text-center py-6 text-green-600">
                <Award className="h-12 w-12 mx-auto mb-3" />
                <p className="font-semibold">Great job! You're on track across all areas</p>
                <p className="text-sm text-muted-foreground mt-1">Keep up the excellent work</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Domain Data Charts */}
      <DomainDataCharts />
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  description 
}: { 
  title: string
  value: number
  icon: any
  color: string
  description: string
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 dark:bg-green-950',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
    red: 'text-red-600 bg-red-50 dark:bg-red-950',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="text-2xl font-bold">{value}%</div>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${color === 'green' ? 'bg-green-600' :
                  color === 'blue' ? 'bg-blue-600' :
                  color === 'yellow' ? 'bg-yellow-600' :
                  color === 'red' ? 'bg-red-600' :
                  'bg-purple-600'} transition-all`}
                style={{ width: `${value}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InsightCard({ insight }: { insight: any }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'prediction': return <TrendingUp className="h-5 w-5" />
      case 'positive': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'achievement': return <Award className="h-5 w-5 text-purple-600" />
      case 'suggestion': return <Target className="h-5 w-5 text-blue-600" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium">{insight.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
          </div>
          <Badge variant="secondary">{insight.category}</Badge>
        </div>
        <div className="text-2xl font-bold mt-2">{insight.value}</div>
      </div>
    </div>
  )
}

function RecommendationItem({ 
  title, 
  description, 
  action, 
  priority,
  onClick 
}: { 
  title: string
  description: string
  action: string
  priority: 'low' | 'medium' | 'high'
  onClick?: () => void
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium">{title}</div>
          <Badge 
            variant={priority === 'high' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onClick}>
        {action}
      </Button>
    </div>
  )
}

function ExpenseCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string
  value: number
  icon: any
  color: string
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  }
  
  return (
    <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">${value.toLocaleString()}</p>
    </div>
  )
}

