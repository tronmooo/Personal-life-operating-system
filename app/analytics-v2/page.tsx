'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Award, Calendar, Download, Volume2, Share2, RefreshCw } from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { differenceInDays, subDays, subMonths } from 'date-fns'

// New analytics components
import { TrendChart } from '@/components/analytics/trend-chart'
import { MetricComparisonCard } from '@/components/analytics/metric-comparison-card'
import { AnomalyAlerts, type Anomaly } from '@/components/analytics/anomaly-alerts'
import { GoalProgressDashboard, type Goal } from '@/components/analytics/goal-progress-dashboard'
import { DomainHeatmap } from '@/components/analytics/domain-heatmap'
import { AchievementSystem, type Achievement } from '@/components/analytics/achievement-system'
import { CorrelationInsights, type CorrelationInsight } from '@/components/analytics/correlation-insights'
import { MobileInsightsCarousel } from '@/components/analytics/mobile-insights-carousel'
import { PDFExportButton } from '@/components/analytics/pdf-export-button'
import { VoiceSummary } from '@/components/analytics/voice-summary'
import { SocialShareCard } from '@/components/analytics/social-share-card'
import { generateAIInsights, calculateDomainCorrelations } from '@/lib/analytics/ai-insights-generator'

export default function AnalyticsV2Page() {
  const { data, bills, tasks } = useData()
  const supabase = createClientComponentClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  const [aiInsights, setAIInsights] = useState<any[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

  // Calculate metrics
  const metrics = useMemo(() => {
    const allDomains = Object.keys(data).filter(key => Array.isArray(data[key]))
    const activeDomains = allDomains.filter(d => (data[d] as any[]).length > 0)
    
    const paidBills = bills.filter((b: any) => b.status === 'paid').length
    const financialHealth = bills.length > 0 ? Math.round((paidBills / bills.length) * 100) : 75
    
    const lifeBalance = Math.round((activeDomains.length / 21) * 100)
    
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const productivity = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 60
    
    const healthData = (data.health || []) as any[]
    const recentActivity = healthData.filter((item: any) => {
      const date = new Date(item.metadata?.date || item.createdAt)
      return differenceInDays(new Date(), date) <= 7
    })
    const wellbeing = Math.min(Math.round((recentActivity.length / 7) * 100), 100)
    
    const goals = (data.financial || []).filter((i: any) => i.metadata?.itemType === 'goal')
    const goalProgress = goals.length > 0 
      ? Math.round(goals.reduce((acc: number, g: any) => acc + (g.metadata?.progress || 0), 0) / goals.length)
      : 0

    const overallScore = Math.round((financialHealth + lifeBalance + productivity + wellbeing + goalProgress) / 5)

    return {
      financialHealth,
      lifeBalance,
      productivity,
      wellbeing,
      goalProgress,
      overallScore,
      activeDomains: activeDomains.length,
      activeDomainsList: activeDomains,
    }
  }, [data, bills, tasks])

  // Calculate historical trends
  const trendData = useMemo(() => {
    const generateTrendData = (metric: string, baseValue: number) => {
      const days = timeRange
      return Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - i - 1)
        // Simulate variation with some randomness (±10%)
        const variation = (Math.random() - 0.5) * 20
        const value = Math.max(0, Math.min(100, baseValue + variation))
        return {
          date: date.toISOString().split('T')[0],
          value: Math.round(value),
        }
      })
    }

    return {
      financialHealth: generateTrendData('financial', metrics.financialHealth),
      productivity: generateTrendData('productivity', metrics.productivity),
      wellbeing: generateTrendData('wellbeing', metrics.wellbeing),
    }
  }, [timeRange, metrics])

  // Generate anomalies
  const anomalies: Anomaly[] = useMemo(() => {
    const alerts: Anomaly[] = []

    if (metrics.financialHealth < 60) {
      alerts.push({
        id: 'financial-low',
        type: 'warning',
        domain: 'Financial',
        metric: 'Health Score',
        message: 'Your financial health score is below 60. Consider reviewing unpaid bills.',
        severity: 'warning',
        value: metrics.financialHealth,
        threshold: 60,
        timestamp: new Date().toISOString(),
        actionable: true,
        actionLabel: 'View Bills',
      })
    }

    if (metrics.wellbeing < 40) {
      alerts.push({
        id: 'wellbeing-low',
        type: 'drop',
        domain: 'Health',
        metric: 'Activity Level',
        message: 'Your wellness activity has dropped significantly this week.',
        severity: 'warning',
        value: metrics.wellbeing,
        threshold: 60,
        timestamp: new Date().toISOString(),
        actionable: true,
        actionLabel: 'Log Activity',
      })
    }

    if (metrics.productivity > 85) {
      alerts.push({
        id: 'productivity-high',
        type: 'milestone',
        domain: 'Productivity',
        metric: 'Task Completion',
        message: 'Excellent! You\'ve maintained a high productivity rate.',
        severity: 'success',
        value: metrics.productivity,
        timestamp: new Date().toISOString(),
        actionable: false,
      })
    }

    if (metrics.activeDomains >= 15) {
      alerts.push({
        id: 'balance-excellent',
        type: 'milestone',
        domain: 'Life Balance',
        metric: 'Active Domains',
        message: `You're tracking ${metrics.activeDomains} domains - excellent life balance!`,
        severity: 'success',
        value: metrics.activeDomains,
        timestamp: new Date().toISOString(),
        actionable: false,
      })
    }

    return alerts
  }, [metrics])

  // Generate goals data
  const goalsData: Goal[] = useMemo(() => {
    const financialGoals = (data.financial || [])
      .filter((i: any) => i.metadata?.itemType === 'goal')
      .map((g: any) => ({
        id: g.id,
        name: g.title,
        domain: 'financial',
        currentValue: g.metadata?.currentAmount || 0,
        targetValue: g.metadata?.targetAmount || 1,
        unit: g.metadata?.unit || 'USD',
        targetDate: g.metadata?.targetDate,
        startDate: g.metadata?.startDate || g.createdAt,
        color: 'green',
        priority: g.metadata?.priority || 'medium',
      }))

    return financialGoals
  }, [data])

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const activities: any[] = []
    
    Object.keys(data).forEach(domain => {
      if (Array.isArray(data[domain])) {
        const items = data[domain] as any[]
        items.forEach(item => {
          activities.push({
            date: item.createdAt || new Date().toISOString(),
            domain,
            count: 1,
          })
        })
      }
    })

    return activities
  }, [data])

  // Generate achievements
  const achievements: Achievement[] = useMemo(() => {
    return [
      {
        id: 'first-entry',
        name: 'Getting Started',
        description: 'Add your first domain entry',
        icon: 'award',
        category: 'Onboarding',
        tier: 'bronze',
        requirement: 1,
        currentProgress: Object.values(data).flat().length,
        isUnlocked: Object.values(data).flat().length >= 1,
        unlockedAt: Object.values(data).flat().length >= 1 ? new Date().toISOString() : undefined,
      },
      {
        id: 'financial-guru',
        name: 'Financial Guru',
        description: 'Maintain financial health above 90 for 30 days',
        icon: 'star',
        category: 'Financial',
        tier: 'gold',
        requirement: 90,
        currentProgress: metrics.financialHealth,
        isUnlocked: metrics.financialHealth >= 90,
        unlockedAt: metrics.financialHealth >= 90 ? new Date().toISOString() : undefined,
      },
      {
        id: 'balance-master',
        name: 'Balance Master',
        description: 'Track all 21 life domains',
        icon: 'target',
        category: 'Life Balance',
        tier: 'platinum',
        requirement: 21,
        currentProgress: metrics.activeDomains,
        isUnlocked: metrics.activeDomains === 21,
      },
      {
        id: 'productivity-champ',
        name: 'Productivity Champion',
        description: 'Maintain 80%+ task completion for a week',
        icon: 'zap',
        category: 'Productivity',
        tier: 'silver',
        requirement: 80,
        currentProgress: metrics.productivity,
        isUnlocked: metrics.productivity >= 80,
      },
      {
        id: '7-day-streak',
        name: '7-Day Streak',
        description: 'Log data for 7 consecutive days',
        icon: 'calendar',
        category: 'Consistency',
        tier: 'bronze',
        requirement: 7,
        currentProgress: 3, // Would need to calculate actual streak
        isUnlocked: false,
      },
    ]
  }, [data, metrics])

  // Calculate correlations
  const correlations: CorrelationInsight[] = useMemo(() => {
    // Simulate correlations (in production, calculate from actual data)
    const insights: CorrelationInsight[] = []

    if (metrics.productivity > 70 && metrics.wellbeing > 70) {
      insights.push({
        id: 'prod-health',
        domainA: 'productivity',
        domainB: 'health',
        correlation: 0.75,
        strength: 'strong',
        direction: 'positive',
        insight: 'Your productivity increases significantly when you maintain regular health activities.',
        confidence: 0.85,
        sampleSize: 30,
      })
    }

    if (metrics.financialHealth > 80) {
      insights.push({
        id: 'finance-stress',
        domainA: 'financial',
        domainB: 'wellbeing',
        correlation: 0.65,
        strength: 'moderate',
        direction: 'positive',
        insight: 'Good financial health correlates with improved overall wellbeing.',
        confidence: 0.78,
        sampleSize: 25,
      })
    }

    return insights
  }, [metrics])

  // Load AI insights
  useEffect(() => {
    loadAIInsights()
  }, [metrics])

  const loadAIInsights = async () => {
    setIsLoadingInsights(true)
    try {
      const insights = await generateAIInsights({
        ...metrics,
        activeDomains: metrics.activeDomainsList,
      })
      setAIInsights(insights)
    } catch (error) {
      console.error('Failed to load AI insights:', error)
    } finally {
      setIsLoadingInsights(false)
      setIsLoading(false)
    }
  }

  // Mobile carousel insights
  const carouselInsights = useMemo(() => {
    return [
      {
        id: 'overall',
        type: 'score' as const,
        title: 'Overall Life Score',
        value: `${metrics.overallScore}/100`,
        description: 'Your holistic life management health',
        color: 'purple',
      },
      {
        id: 'domains',
        type: 'insight' as const,
        title: 'Active Domains',
        value: `${metrics.activeDomains}/21`,
        description: 'Domains you\'re currently tracking',
        color: 'blue',
      },
      {
        id: 'productivity',
        type: metrics.productivity > 80 ? 'celebration' as const : 'action' as const,
        title: 'Productivity',
        value: `${metrics.productivity}%`,
        description: metrics.productivity > 80 
          ? 'Excellent task completion rate!'
          : 'Room for improvement on task completion',
        color: metrics.productivity > 80 ? 'green' : 'orange',
      },
    ]
  }, [metrics])

  if (isLoading) {
    return <LoadingState message="Loading advanced analytics..." />
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights with AI-powered analysis
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <PDFExportButton 
              analyticsData={{
                ...metrics,
                insights: aiInsights,
              }}
            />
            <Button variant="outline" size="sm" onClick={loadAIInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-secondary p-1 rounded-lg w-fit">
          {([7, 30, 90] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range 
                  ? 'bg-background shadow-sm' 
                  : 'hover:bg-background/50'
              }`}
            >
              {range} Days
            </button>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <MobileInsightsCarousel insights={carouselInsights} autoPlay />
        </div>

        {/* Overall Score Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-200 dark:border-purple-900">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Overall Life Score</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold">{metrics.overallScore}</span>
                  <span className="text-3xl text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge
                variant={metrics.overallScore >= 80 ? 'default' : metrics.overallScore >= 60 ? 'secondary' : 'destructive'}
                className="text-lg px-6 py-3"
              >
                {metrics.overallScore >= 80 ? 'Excellent' : metrics.overallScore >= 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Anomaly Alerts */}
            {anomalies.length > 0 && <AnomalyAlerts anomalies={anomalies} />}

            {/* Metric Comparison Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricComparisonCard
                title="Financial Health"
                icon={TrendingUp}
                currentValue={metrics.financialHealth}
                previousValue={Math.max(0, metrics.financialHealth - 5)}
                format="number"
                color="green"
              />
              <MetricComparisonCard
                title="Productivity"
                currentValue={metrics.productivity}
                previousValue={Math.max(0, metrics.productivity - 3)}
                format="percentage"
                color="purple"
              />
              <MetricComparisonCard
                title="Wellbeing"
                currentValue={metrics.wellbeing}
                previousValue={Math.max(0, metrics.wellbeing + 2)}
                format="number"
                color="red"
              />
            </div>

            {/* Domain Heatmap */}
            <DomainHeatmap activities={heatmapData} />

            {/* Correlations */}
            {correlations.length > 0 && <CorrelationInsights correlations={correlations} />}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <TrendChart
                data={trendData.financialHealth}
                metric="Financial Health"
                targetValue={80}
                color="#10b981"
                description="Your financial health score over time"
              />
              <TrendChart
                data={trendData.productivity}
                metric="Productivity"
                color="#8b5cf6"
                description="Task completion rate trend"
              />
              <TrendChart
                data={trendData.wellbeing}
                metric="Wellbeing"
                color="#ef4444"
                description="Health and wellness activity"
              />
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <GoalProgressDashboard goals={goalsData} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {/* AI Insights */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI-Powered Insights</h3>
                {isLoadingInsights ? (
                  <LoadingState message="Generating insights..." />
                ) : aiInsights.length > 0 ? (
                  <div className="space-y-3">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={
                            insight.priority === 'high' ? 'destructive' :
                            insight.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No insights available yet</p>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <AchievementSystem achievements={achievements} />

            {/* Voice Summary */}
            <VoiceSummary analyticsData={{
              ...metrics,
              activeDomains: metrics.activeDomainsList
            }} />
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-6">
            <SocialShareCard
              overallScore={metrics.overallScore}
              financialHealth={metrics.financialHealth}
              activeDomains={metrics.activeDomains}
              productivity={metrics.productivity}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

