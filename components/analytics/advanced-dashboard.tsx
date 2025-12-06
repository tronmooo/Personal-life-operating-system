'use client'

import { useState, useEffect, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, TrendingDown, DollarSign, Target, Calendar,
  Activity, Zap, Award, AlertCircle, Download, Share2
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { DomainDataCharts } from './domain-data-charts'

interface AnalyticsData {
  financialHealth: number
  lifeBalance: number
  productivity: number
  wellbeing: number
  goalProgress: number
}

export function AdvancedDashboard() {
  const { data, bills, tasks } = useData()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    financialHealth: 0,
    lifeBalance: 0,
    productivity: 0,
    wellbeing: 0,
    goalProgress: 0,
  })
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    calculateAnalytics()
  }, [timeRange, data, bills, tasks])

  const calculateAnalytics = () => {
    // Financial Health Score from bills in provider
    const paidBills = bills.filter((b: any) => b.status === 'paid').length
    const financialScore = bills.length > 0 ? (paidBills / bills.length) * 100 : 75

    // Life Balance (how many domains are actively used)
    const allDomains = ['financial', 'health', 'career', 'home', 'social', 'education'] as const
    const activeDomains = allDomains.filter(d => Array.isArray((data as any)[d]) && ((data as any)[d] as any[]).length > 0)
    const balanceScore = (activeDomains.length / allDomains.length) * 100

    // Productivity (task completion rate)
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const productivityScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 60

    // Wellbeing (health domain activity)
    const healthData = (data.health || []) as any[]
    const recentActivity = healthData.filter((item: any) => {
      const date = new Date(item.metadata?.date || item.createdAt)
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

      {/* Recommendations */}
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
              />
            )}
            {analytics.lifeBalance < 60 && (
              <RecommendationItem
                title="Expand Life Balance"
                description="Try tracking more life domains for better overall balance"
                action="Explore Domains"
                priority="medium"
              />
            )}
            {analytics.productivity < 50 && (
              <RecommendationItem
                title="Boost Productivity"
                description="Focus on completing pending tasks to improve your productivity score"
                action="View Tasks"
                priority="high"
              />
            )}
            {analytics.wellbeing < 60 && (
              <RecommendationItem
                title="Increase Health Activity"
                description="Log more workouts or health activities this week"
                action="Log Activity"
                priority="medium"
              />
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
  priority 
}: { 
  title: string
  description: string
  action: string
  priority: 'low' | 'medium' | 'high'
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
      <Button size="sm" variant="outline">
        {action}
      </Button>
    </div>
  )
}

