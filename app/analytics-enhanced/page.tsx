'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData } from '@/lib/providers/data-provider'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, AreaChart, Area,
  ComposedChart
} from 'recharts'
import {
  Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target, Zap,
  Heart, DollarSign, Briefcase, Home, Car, Plane,
  Users, GraduationCap, Leaf, Sparkles, Trophy,
  Download, MinusIcon,
  Flame, Brain, Lightbulb,
  ChevronRight, TrendingUpIcon, Award
} from 'lucide-react'
import { format, subDays } from 'date-fns'

const DOMAIN_CONFIGS = [
  { id: 'financial', name: 'Financial', icon: DollarSign, color: '#10b981' },
  { id: 'health', name: 'Health', icon: Heart, color: '#ef4444' },
  { id: 'nutrition', name: 'Nutrition', icon: Leaf, color: '#22c55e' },
  { id: 'hobbies', name: 'Fitness', icon: Activity, color: '#f59e0b' },
  { id: 'career', name: 'Career', icon: Briefcase, color: '#8b5cf6' },
  { id: 'home', name: 'Home', icon: Home, color: '#f59e0b' },
  { id: 'vehicles', name: 'Vehicles', icon: Car, color: '#06b6d4' },
  { id: 'pets', name: 'Pets', icon: Heart, color: '#84cc16' },
  { id: 'education', name: 'Education', icon: GraduationCap, color: '#14b8a6' },
  { id: 'travel', name: 'Travel', icon: Plane, color: '#ec4899' },
  { id: 'relationships', name: 'Relationships', icon: Users, color: '#f97316' },
  { id: 'mindfulness', name: 'Mindfulness', icon: Sparkles, color: '#a855f7' },
  { id: 'goals', name: 'Goals', icon: Target, color: '#a855f7' },
  { id: 'shopping', name: 'Shopping', icon: Activity, color: '#f43f5e' },
  { id: 'entertainment', name: 'Entertainment', icon: Sparkles, color: '#8b5cf6' },
  { id: 'appliances', name: 'Appliances', icon: Zap, color: '#eab308' },
]

export default function AnalyticsEnhancedPage() {
  const { data } = useData()
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | '365'>('30')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Calculate comprehensive life metrics
  const analytics = useMemo(() => {
    const now = new Date()
    const rangeStart = subDays(now, parseInt(dateRange))
    
    // Domain scores with trends
    const domainScores = DOMAIN_CONFIGS.map(config => {
      const items = (data[config.id as keyof typeof data] || []) as any[]
      const recentItems = items.filter(item => 
        new Date(item.createdAt || item.date) >= rangeStart
      )
      
      const score = items.length > 0 ? Math.min(100, 30 + (items.length * 7)) : 0
      const trend = recentItems.length >= items.length * 0.3 ? 'up' : 
                    recentItems.length >= items.length * 0.1 ? 'stable' : 'down'
      
      return {
        domain: config.name,
        id: config.id,
        score,
        items: items.length,
        recentItems: recentItems.length,
        trend,
        color: config.color,
        icon: config.icon
      }
    })

    // Overall life score
    const activeDomains = domainScores.filter(d => d.items > 0).length
    const totalScore = domainScores.reduce((sum, d) => sum + d.score, 0)
    const overallScore = activeDomains > 0 ? Math.round(totalScore / DOMAIN_CONFIGS.length) : 0
    
    // Coverage score
    const coverageScore = Math.round((activeDomains / DOMAIN_CONFIGS.length) * 100)
    
    // Balance score (variance-based)
    const itemCounts = domainScores.filter(d => d.items > 0).map(d => d.items)
    const avg = itemCounts.length > 0 ? itemCounts.reduce((a, b) => a + b, 0) / itemCounts.length : 0
    const variance = itemCounts.length > 0
      ? itemCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / itemCounts.length
      : 0
    const balanceScore = Math.max(0, Math.round(100 - (Math.sqrt(variance) * 2)))

    // Calculate streaks and consistency
    const totalItems = domainScores.reduce((sum, d) => sum + d.items, 0)
    const recentItems = domainScores.reduce((sum, d) => sum + d.recentItems, 0)
    
    // Financial metrics
    const financialData = (data.financial || []) as any[]
    const expenses = financialData.filter(item => 
      item.type === 'expense' && new Date(item.date) >= rangeStart
    )
    const income = financialData.filter(item => 
      item.type === 'income' && new Date(item.date) >= rangeStart
    )
    const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const totalIncome = income.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
    const netWorth = totalIncome - totalExpenses

    // Health metrics
    const healthData = (data.health || []) as any[]
    const weights = healthData.filter(item => item.weight).map(item => ({
      date: item.date,
      weight: parseFloat(item.weight)
    }))
    const weightTrend = weights.length >= 2 
      ? weights[weights.length - 1].weight - weights[0].weight
      : 0

    // Activity heatmap data (last 30 days)
    const activityHeatmap = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i)
      const dayItems = Object.values(data).flat().filter((item: any) =>
        item.date && new Date(item.date).toDateString() === date.toDateString()
      ).length
      
      return {
        date: format(date, 'MMM d'),
        items: dayItems,
        intensity: Math.min(100, dayItems * 20)
      }
    })

    // Top insights
    const insights = []
    if (savingsRate > 20) {
      insights.push({ type: 'positive', message: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income.` })
    }
    if (weightTrend < -5) {
      insights.push({ type: 'positive', message: `You've lost ${Math.abs(weightTrend).toFixed(1)} lbs - keep it up!` })
    }
    if (recentItems < totalItems * 0.1) {
      insights.push({ type: 'warning', message: 'Activity has been low recently. Time to log some progress!' })
    }
    if (activeDomains < 5) {
      insights.push({ type: 'info', message: `You're tracking ${activeDomains} domains. Consider expanding to other life areas.` })
    }

    return {
      overallScore,
      coverageScore,
      balanceScore,
      activeDomains,
      totalItems,
      recentItems,
      domainScores,
      topDomains: domainScores.filter(d => d.items > 0).sort((a, b) => b.score - a.score).slice(0, 5),
      needsAttention: domainScores.filter(d => d.items === 0),
      financialMetrics: {
        totalExpenses,
        totalIncome,
        savingsRate,
        netWorth,
        expenses,
        income
      },
      healthMetrics: {
        weights,
        weightTrend
      },
      activityHeatmap,
      insights,
      trend: recentItems >= totalItems * 0.3 ? 'up' : recentItems >= totalItems * 0.1 ? 'stable' : 'down'
    }
  }, [data, dateRange])

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <MinusIcon className="h-4 w-4 text-gray-600" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Comprehensive Life Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Deep insights across all {DOMAIN_CONFIGS.length} life domains with AI-powered recommendations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Summary - Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Life Operating System Score
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Your overall life management performance
              </CardDescription>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(analytics.overallScore)}`}>
              {analytics.overallScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Life Coverage</span>
                <Badge variant="outline">{analytics.coverageScore}%</Badge>
              </div>
              <Progress value={analytics.coverageScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {analytics.activeDomains}/{DOMAIN_CONFIGS.length} domains active
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Life Balance</span>
                <Badge variant="outline">{analytics.balanceScore}%</Badge>
              </div>
              <Progress value={analytics.balanceScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {analytics.balanceScore >= 70 ? 'Well balanced' : 'Room for improvement'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activity Trend</span>
                {getTrendIcon(analytics.trend)}
              </div>
              <Progress 
                value={analytics.totalItems > 0 ? (analytics.recentItems / analytics.totalItems) * 100 : 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {analytics.recentItems} items in last {dateRange} days
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Tracked</span>
                <Badge variant="outline">{analytics.totalItems}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">All-time entries</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold">
                ${Math.abs(analytics.financialMetrics.netWorth).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Net Flow</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <TrendingUpIcon className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">
                {analytics.financialMetrics.savingsRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Savings Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Heart className="h-8 w-8 text-red-600 mb-2" />
              <div className="text-2xl font-bold">
                {analytics.healthMetrics.weights.length > 0 
                  ? analytics.healthMetrics.weights[analytics.healthMetrics.weights.length - 1].weight.toFixed(1)
                  : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Current Weight</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Target className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold">
                {analytics.activeDomains}
              </div>
              <div className="text-xs text-muted-foreground">Active Domains</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <div className="text-2xl font-bold">
                {analytics.recentItems}
              </div>
              <div className="text-xs text-muted-foreground">Recent Items</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Award className="h-8 w-8 text-orange-600 mb-2" />
              <div className="text-2xl font-bold">
                {analytics.topDomains.length}
              </div>
              <div className="text-xs text-muted-foreground">Top Domains</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Alerts */}
      {analytics.insights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>Personalized insights based on your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'positive' ? 'bg-green-100 dark:bg-green-950/30' :
                  insight.type === 'warning' ? 'bg-orange-100 dark:bg-orange-950/30' :
                  'bg-blue-100 dark:bg-blue-950/30'
                }`}
              >
                {insight.type === 'positive' && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />}
                {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-2 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="domains">All Domains</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Deep Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Performance Overview</CardTitle>
                <CardDescription>Your focus across life areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analytics.topDomains}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="domain" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Consistency (Last 30 Days)</CardTitle>
                <CardDescription>Daily engagement patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.activityHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="items" name="Items Logged">
                      {analytics.activityHeatmap.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.intensity >= 60 ? '#10b981' : entry.intensity >= 30 ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top & Bottom Domains */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 5 Performing Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topDomains.map((domain, index) => (
                  <div key={domain.id} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg text-muted-foreground">#{index + 1}</div>
                      <domain.icon className="h-5 w-5" style={{ color: domain.color }} />
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-muted-foreground">{domain.items} items</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(domain.trend)}
                      <Badge>{domain.score}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Domains Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.needsAttention.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.needsAttention.slice(0, 8).map(domain => (
                      <div key={domain.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-center gap-2">
                          <domain.icon className="h-4 w-4" style={{ color: domain.color }} />
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">All domains have activity!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${analytics.financialMetrics.totalIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${analytics.financialMetrics.totalExpenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.financialMetrics.savingsRate.toFixed(1)}%
                </div>
                <Progress value={analytics.financialMetrics.savingsRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { name: 'Income', value: analytics.financialMetrics.totalIncome, fill: '#10b981' },
                  { name: 'Expenses', value: analytics.financialMetrics.totalExpenses, fill: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {[0, 1].map((index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
                <CardDescription>
                  {analytics.healthMetrics.weightTrend !== 0 && (
                    <span className={analytics.healthMetrics.weightTrend < 0 ? 'text-green-600' : 'text-orange-600'}>
                      {analytics.healthMetrics.weightTrend > 0 ? '+' : ''}
                      {analytics.healthMetrics.weightTrend.toFixed(1)} lbs
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.healthMetrics.weights.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.healthMetrics.weights}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    <div className="text-center">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start logging weight to see trends</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <span className="font-medium">Weight Logs</span>
                  <Badge>{analytics.healthMetrics.weights.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <span className="font-medium">Current Weight</span>
                  <Badge>
                    {analytics.healthMetrics.weights.length > 0
                      ? `${analytics.healthMetrics.weights[analytics.healthMetrics.weights.length - 1].weight.toFixed(1)} lbs`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <span className="font-medium">Trend</span>
                  <Badge variant={analytics.healthMetrics.weightTrend < 0 ? 'default' : 'secondary'}>
                    {analytics.healthMetrics.weightTrend < 0 ? 'Losing' :
                     analytics.healthMetrics.weightTrend > 0 ? 'Gaining' : 'Stable'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Domains Tab */}
        <TabsContent value="domains" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Domains Distribution</CardTitle>
              <CardDescription>Complete overview of tracked items</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={analytics.domainScores.filter(d => d.items > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="domain" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="items" name="Total Items" fill="#8b5cf6" />
                  <Bar dataKey="recentItems" name="Recent Items" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Heatmap</CardTitle>
              <CardDescription>Your consistency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.activityHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="items" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Trend Analysis</CardTitle>
              <CardDescription>Which areas are growing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.domainScores
                  .filter(d => d.items > 0)
                  .sort((a, b) => b.recentItems - a.recentItems)
                  .map(domain => (
                    <div key={domain.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <domain.icon className="h-8 w-8" style={{ color: domain.color }} />
                      <div className="flex-1">
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-muted-foreground">
                          {domain.recentItems} recent • {domain.items} total
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(domain.trend)}
                        <Progress value={domain.score} className="w-24" />
                        <span className="text-sm font-medium">{domain.score}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Pattern Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm">
                    💡 You're most active in {analytics.topDomains[0]?.domain || 'multiple domains'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm">
                    📊 Your life balance score is {analytics.balanceScore}% - 
                    {analytics.balanceScore >= 70 ? ' great distribution!' : ' consider diversifying'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm">
                    🎯 You're tracking {analytics.activeDomains} out of {DOMAIN_CONFIGS.length} domains
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.needsAttention.length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm">
                      ✨ Consider adding data to {analytics.needsAttention[0].domain} to improve coverage
                    </p>
                  </div>
                )}
                {analytics.financialMetrics.savingsRate < 20 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm">
                      💰 Your savings rate is {analytics.financialMetrics.savingsRate.toFixed(1)}% - 
                      aim for 20% or higher
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-sm">
                    🔥 Keep up the momentum! You've logged {analytics.recentItems} items recently
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Life at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics.topDomains.length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Strong Domains</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.recentItems}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Recent Activity</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent">
                  <div className="text-3xl font-bold text-purple-600">
                    {analytics.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.round(analytics.totalItems / (analytics.activeDomains || 1))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Avg Items/Domain</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
