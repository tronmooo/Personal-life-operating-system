'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  TrendingUp, TrendingDown, Minus, Brain, DollarSign, Heart, Target,
  Calendar, Sparkles, ArrowRight, BarChart3,
  Loader2, Lightbulb, Activity, Zap, ChevronRight
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Prediction {
  id: string
  metric: string
  domain: string
  predicted_value: number
  confidence: number
  date: string
  reasoning: string
  historical_average: number
  trend: 'increasing' | 'decreasing' | 'stable'
  aiEnhanced?: boolean
  aiInsight?: string
}

interface WhatIfScenario {
  id: string
  title: string
  description: string
  impact: string
  savings?: number
  domain: string
}

export default function PredictiveAnalyticsPage() {
  const { data } = useData()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEnhancingWithAI, setIsEnhancingWithAI] = useState(false)
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('all')

  // Generate predictions from data
  const generatePredictions = useCallback(() => {
    const preds: Prediction[] = []

    // Financial predictions
    const financialData = (data.financial || []) as any[]
    if (financialData.length > 0) {
      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number }> = {}
      financialData.forEach((item: any) => {
        const meta = item.metadata || item
        const date = new Date(item.createdAt || item.date || Date.now())
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 }
        }
        
        const amount = parseFloat(meta.amount || 0)
        if (meta.type === 'income') {
          monthlyData[month].income += amount
        } else if (meta.type === 'expense') {
          monthlyData[month].expenses += amount
        }
      })

      const months = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
      if (months.length >= 2) {
        const incomes = months.map(([, d]) => d.income)
        const expenses = months.map(([, d]) => d.expenses)
        
        // Predict next month income
        const avgIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length
        const predictedIncome = incomes.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, incomes.length)
        const incomeTrend = predictedIncome > avgIncome * 1.05 ? 'increasing' : predictedIncome < avgIncome * 0.95 ? 'decreasing' : 'stable'
        
        preds.push({
          id: 'pred-income',
          metric: 'Monthly Income',
          domain: 'financial',
          predicted_value: Math.round(predictedIncome),
          confidence: Math.min(months.length / 6, 0.9),
          date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          reasoning: `Based on ${months.length} months of income data`,
          historical_average: Math.round(avgIncome),
          trend: incomeTrend
        })

        // Predict next month expenses
        const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length
        const predictedExpenses = expenses.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, expenses.length)
        const expenseTrend = predictedExpenses > avgExpenses * 1.05 ? 'increasing' : predictedExpenses < avgExpenses * 0.95 ? 'decreasing' : 'stable'
        
        preds.push({
          id: 'pred-expenses',
          metric: 'Monthly Expenses',
          domain: 'financial',
          predicted_value: Math.round(predictedExpenses),
          confidence: Math.min(months.length / 6, 0.85),
          date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          reasoning: `Based on ${months.length} months of spending data`,
          historical_average: Math.round(avgExpenses),
          trend: expenseTrend
        })

        // Net savings prediction
        const predictedSavings = predictedIncome - predictedExpenses
        preds.push({
          id: 'pred-savings',
          metric: 'Net Savings',
          domain: 'financial',
          predicted_value: Math.round(predictedSavings),
          confidence: Math.min(months.length / 6, 0.8),
          date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          reasoning: `Projected savings based on income and expense trends`,
          historical_average: Math.round(avgIncome - avgExpenses),
          trend: predictedSavings > (avgIncome - avgExpenses) * 1.05 ? 'increasing' : predictedSavings < (avgIncome - avgExpenses) * 0.95 ? 'decreasing' : 'stable'
        })
      }
    }

    // Health predictions
    const healthData = (data.health || []) as any[]
    const weightLogs = healthData
      .filter((h: any) => h.metadata?.weight || h.metadata?.logType === 'weight')
      .map((h: any) => ({
        weight: parseFloat(h.metadata?.weight || h.metadata?.value || 0),
        date: new Date(h.createdAt || h.date || Date.now())
      }))
      .filter(w => w.weight > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (weightLogs.length >= 3) {
      const weights = weightLogs.map(w => w.weight)
      const currentWeight = weights[weights.length - 1]
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
      
      // Calculate weekly change
      const firstDate = weightLogs[0].date
      const lastDate = weightLogs[weightLogs.length - 1].date
      const weeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const totalChange = currentWeight - weights[0]
      const weeklyChange = totalChange / weeks
      
      const predictedWeight = currentWeight + (weeklyChange * 4.3)
      const weightTrend = weeklyChange > 0.2 ? 'increasing' : weeklyChange < -0.2 ? 'decreasing' : 'stable'

      preds.push({
        id: 'pred-weight',
        metric: 'Weight Forecast',
        domain: 'health',
        predicted_value: Math.round(predictedWeight * 10) / 10,
        confidence: Math.min(weightLogs.length / 15, 0.8),
        date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        reasoning: `Based on ${weightLogs.length} measurements. ${weeklyChange < 0 ? 'Losing' : 'Gaining'} ~${Math.abs(weeklyChange).toFixed(1)} lbs/week`,
        historical_average: Math.round(avgWeight * 10) / 10,
        trend: weightTrend
      })
    }

    // Workout predictions
    const workouts = healthData.filter((h: any) => 
      h.metadata?.workout_type || h.metadata?.type === 'workout' || h.metadata?.activity
    )
    if (workouts.length >= 5) {
      const now = new Date()
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentWorkouts = workouts.filter(w => new Date(w.createdAt || w.date) >= lastMonth)
      
      const workoutsPerWeek = (recentWorkouts.length / 4.3)
      const predictedMonthly = Math.round(workoutsPerWeek * 4.3)
      
      preds.push({
        id: 'pred-workouts',
        metric: 'Monthly Workouts',
        domain: 'health',
        predicted_value: predictedMonthly,
        confidence: Math.min(workouts.length / 20, 0.75),
        date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        reasoning: `Based on recent activity: ~${workoutsPerWeek.toFixed(1)} workouts/week`,
        historical_average: recentWorkouts.length,
        trend: workoutsPerWeek >= 3 ? 'stable' : 'decreasing'
      })
    }

    setPredictions(preds)
    setIsLoading(false)
  }, [data])

  // Generate what-if scenarios
  const generateScenarios = useCallback(() => {
    const scenarioList: WhatIfScenario[] = []

    const financialData = (data.financial || []) as any[]
    if (financialData.length > 0) {
      // Find dining out expenses
      const diningExpenses = financialData.filter((f: any) => {
        const cat = (f.metadata?.category || f.category || '').toLowerCase()
        return cat.includes('dining') || cat.includes('restaurant') || cat.includes('food')
      })
      
      if (diningExpenses.length > 0) {
        const totalDining = diningExpenses.reduce((sum, f: any) => sum + parseFloat(f.metadata?.amount || f.amount || 0), 0)
        const monthlySavings = Math.round(totalDining * 0.3)
        
        if (monthlySavings > 50) {
          scenarioList.push({
            id: 'scenario-dining',
            title: 'Reduce Dining Out by 30%',
            description: 'Cook more meals at home instead of eating out',
            impact: `Save ~$${monthlySavings}/month`,
            savings: monthlySavings,
            domain: 'financial'
          })
        }
      }

      // Subscription savings
      const subscriptions = financialData.filter((f: any) => {
        const cat = (f.metadata?.category || f.category || '').toLowerCase()
        return cat.includes('subscription') || cat.includes('streaming') || cat.includes('membership')
      })
      
      if (subscriptions.length > 2) {
        const totalSubs = subscriptions.reduce((sum, s: any) => sum + parseFloat(s.metadata?.amount || s.amount || 0), 0)
        const potentialSavings = Math.round(totalSubs * 0.4)
        
        scenarioList.push({
          id: 'scenario-subs',
          title: 'Audit Subscriptions',
          description: 'Cancel unused streaming services and memberships',
          impact: `Potentially save ~$${potentialSavings}/month`,
          savings: potentialSavings,
          domain: 'financial'
        })
      }
    }

    // Health scenarios
    const healthData = (data.health || []) as any[]
    const workouts = healthData.filter((h: any) => h.metadata?.workout_type || h.metadata?.type === 'workout')
    
    if (workouts.length < 12) {
      scenarioList.push({
        id: 'scenario-exercise',
        title: 'Increase Exercise to 3x/week',
        description: 'Regular exercise improves energy and reduces health costs',
        impact: 'Potential 15% improvement in overall wellbeing',
        domain: 'health'
      })
    }

    // Sleep optimization
    scenarioList.push({
      id: 'scenario-sleep',
      title: 'Optimize Sleep Schedule',
      description: 'Consistent 7-8 hours of sleep improves productivity',
      impact: 'Up to 25% productivity boost',
      domain: 'health'
    })

    setScenarios(scenarioList)
  }, [data])

  useEffect(() => {
    generatePredictions()
    generateScenarios()
  }, [generatePredictions, generateScenarios])

  // Enhance predictions with AI
  const enhanceWithAI = async () => {
    setIsEnhancingWithAI(true)
    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on these predictions and my data, provide AI-enhanced insights for each:
${predictions.map(p => `- ${p.metric}: ${p.predicted_value} (${p.trend})`).join('\n')}

For each prediction, provide:
1. A more detailed reasoning
2. Actionable recommendations
3. Potential risks or opportunities

Keep each insight concise (1-2 sentences).`,
          userData: data,
          conversationHistory: [],
          requestType: 'prediction_enhancement'
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Parse AI insights and add to predictions
        const aiResponse = result.response || ''
        
        setPredictions(prev => prev.map((p, idx) => ({
          ...p,
          aiEnhanced: true,
          aiInsight: extractAIInsight(aiResponse, p.metric)
        })))
      }
    } catch (error) {
      console.error('Failed to enhance with AI:', error)
    } finally {
      setIsEnhancingWithAI(false)
    }
  }

  const extractAIInsight = (response: string, metric: string): string => {
    const lines = response.split('\n')
    const metricLower = metric.toLowerCase()
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(metricLower)) {
        // Return the next non-empty line or the current one
        const insight = lines[i + 1]?.trim() || lines[i].replace(/^[-•*]\s*/, '').trim()
        if (insight.length > 20) return insight.slice(0, 150)
      }
    }
    
    return 'AI analysis suggests monitoring this metric closely for optimal results.'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'financial': return DollarSign
      case 'health': return Heart
      case 'goals': return Target
      default: return Activity
    }
  }

  const filteredPredictions = selectedDomain === 'all' 
    ? predictions 
    : predictions.filter(p => p.domain === selectedDomain)

  // Generate chart data
  const chartData = predictions
    .filter(p => p.domain === 'financial')
    .map(p => ({
      name: p.metric.replace('Monthly ', ''),
      predicted: p.predicted_value,
      historical: p.historical_average
    }))

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingUp className="h-10 w-10 text-indigo-600" />
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered predictions for your finances, health, and life patterns
          </p>
        </div>
        <Button 
          onClick={enhanceWithAI} 
          disabled={isEnhancingWithAI || predictions.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isEnhancingWithAI ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enhancing...</>
          ) : (
            <><Brain className="h-4 w-4 mr-2" />Enhance with AI</>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{predictions.length}</p>
                <p className="text-xs text-muted-foreground">Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{predictions.filter(p => p.trend === 'increasing').length}</p>
                <p className="text-xs text-muted-foreground">Trending Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{predictions.filter(p => p.confidence >= 0.7).length}</p>
                <p className="text-xs text-muted-foreground">High Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scenarios.length}</p>
                <p className="text-xs text-muted-foreground">What-If Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Forecast Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Forecast
            </CardTitle>
            <CardDescription>Predicted vs Historical Comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar dataKey="historical" name="Historical Avg" fill="#94a3b8" />
                <Bar dataKey="predicted" name="Predicted" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Predictions List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedDomain('all')}>
            All Predictions
          </TabsTrigger>
          <TabsTrigger value="financial" onClick={() => setSelectedDomain('financial')}>
            <DollarSign className="h-4 w-4 mr-1" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="health" onClick={() => setSelectedDomain('health')}>
            <Heart className="h-4 w-4 mr-1" />
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredPredictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPredictions.map((prediction) => {
                const DomainIcon = getDomainIcon(prediction.domain)
                return (
                  <Card key={prediction.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            prediction.domain === 'financial' ? 'bg-green-100 dark:bg-green-950' :
                            prediction.domain === 'health' ? 'bg-red-100 dark:bg-red-950' :
                            'bg-blue-100 dark:bg-blue-950'
                          }`}>
                            <DomainIcon className={`h-4 w-4 ${
                              prediction.domain === 'financial' ? 'text-green-600' :
                              prediction.domain === 'health' ? 'text-red-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{prediction.metric}</CardTitle>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Forecast for {format(new Date(prediction.date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(prediction.trend)}
                          {prediction.aiEnhanced && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {prediction.domain === 'financial' ? '$' : ''}
                            {prediction.predicted_value.toLocaleString()}
                            {prediction.metric.includes('Weight') ? ' lbs' : ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Historical avg: {prediction.domain === 'financial' ? '$' : ''}
                            {prediction.historical_average.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Confidence</p>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={prediction.confidence * 100} 
                              className={`w-16 h-2 ${getConfidenceColor(prediction.confidence)}`}
                            />
                            <span className="text-sm">{Math.round(prediction.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                        <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
                      </div>

                      {prediction.aiInsight && (
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200">
                          <div className="flex items-start gap-2">
                            <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                            <p className="text-sm">{prediction.aiInsight}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground mb-4">
                  Add more data to your domains to generate predictions
                </p>
                <Link href="/domains">
                  <Button>Add Data<ArrowRight className="h-4 w-4 ml-2" /></Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial">
          {/* Same content as above but filtered */}
        </TabsContent>

        <TabsContent value="health">
          {/* Same content as above but filtered */}
        </TabsContent>
      </Tabs>

      {/* What-If Scenarios */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            What-If Scenarios
          </CardTitle>
          <CardDescription>
            Explore how changes could impact your predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {scenarios.length > 0 ? (
            scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    scenario.domain === 'financial' ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                  }`}>
                    {scenario.domain === 'financial' ? (
                      <DollarSign className="h-5 w-5 text-green-600" />
                    ) : (
                      <Heart className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{scenario.title}</p>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {scenario.impact}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Zap className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Add more data to unlock personalized what-if scenarios
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to AI Coach */}
      <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Brain className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Want Personalized Coaching?</h3>
                <p className="text-muted-foreground">
                  Get AI-powered recommendations to improve your predictions
                </p>
              </div>
            </div>
            <Link href="/goals-coach">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Open Goals Coach
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

