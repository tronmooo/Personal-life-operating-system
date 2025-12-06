'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Activity,
  Download, AlertCircle, CheckCircle2, Target, Shield
} from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LifeBalanceWheel } from '@/components/analytics/life-balance-wheel'
import { WhatIfScenarios } from '@/components/analytics/what-if-scenarios'
import { ComparativeBenchmarking } from '@/components/analytics/comparative-benchmarking'
import { format } from 'date-fns'

interface AnalyticsData {
  financialHealth: {
    score: number
    incomeVsExpenses: {
      income: number
      expenses: number
      difference: number
      ratio: number
    }
    debtToIncome: {
      totalDebt: number
      monthlyIncome: number
      ratio: number
    }
    emergencyFund: {
      current: number
      target: number
      monthsCovered: number
      status: 'excellent' | 'good' | 'low' | 'critical'
    }
  }
  lifeBalance: any[]
  costAnalysis: {
    totalMonthlyCost: number
    breakdown: {
      insurance: number
      subscriptions: number
      bills: number
      maintenance: number
      other: number
    }
    byDomain: Record<string, number>
  }
  trends: any[]
  predictions: {
    budgetForecast: {
      projectedSpending: number
      currentBudget: number
      overageAmount: number
      confidence: number
    }
    recommendations: string[]
  }
}

export default function ComprehensiveAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics/comprehensive?timeRange=${timeRange}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }
      
      setAnalytics(result.data)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      analytics,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lifehub-comprehensive-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Analyzing your life data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Analytics</h3>
            </div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Button 
              onClick={() => fetchAnalytics()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              Comprehensive Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your financial health, life balance, and predictive analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border bg-background"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last Year</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

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
            {/* Overall Score */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-bold">{analytics.financialHealth.score}</span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge 
                variant={analytics.financialHealth.score >= 80 ? 'default' : 
                        analytics.financialHealth.score >= 60 ? 'secondary' : 'destructive'}
                className="text-lg px-4 py-2"
              >
                {analytics.financialHealth.score >= 80 ? 'Excellent' : 
                 analytics.financialHealth.score >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Income vs Expenses */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Income vs Expenses</span>
                  {analytics.financialHealth.incomeVsExpenses.difference > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-semibold">
                      ${analytics.financialHealth.incomeVsExpenses.income.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-semibold">
                      ${analytics.financialHealth.incomeVsExpenses.expenses.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t">
                    <span className="text-muted-foreground">Difference</span>
                    <span className={`font-bold ${
                      analytics.financialHealth.incomeVsExpenses.difference > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ${Math.abs(analytics.financialHealth.incomeVsExpenses.difference).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Debt-to-Income */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Debt-to-Income Ratio</span>
                  {analytics.financialHealth.debtToIncome.ratio < 0.36 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {(analytics.financialHealth.debtToIncome.ratio * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Debt: ${analytics.financialHealth.debtToIncome.totalDebt.toFixed(0)}
                  </div>
                  <Badge variant={analytics.financialHealth.debtToIncome.ratio < 0.36 ? 'default' : 'destructive'}>
                    {analytics.financialHealth.debtToIncome.ratio < 0.36 ? 'Healthy' : 'High'}
                  </Badge>
                </div>
              </div>

              {/* Emergency Fund */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Emergency Fund</span>
                  <Shield className={`h-4 w-4 ${
                    analytics.financialHealth.emergencyFund.status === 'excellent' ? 'text-green-600' :
                    analytics.financialHealth.emergencyFund.status === 'good' ? 'text-blue-600' :
                    analytics.financialHealth.emergencyFund.status === 'low' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {analytics.financialHealth.emergencyFund.monthsCovered.toFixed(1)} mo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${analytics.financialHealth.emergencyFund.current.toFixed(0)} / 
                    ${analytics.financialHealth.emergencyFund.target.toFixed(0)}
                  </div>
                  <Badge variant={
                    analytics.financialHealth.emergencyFund.status === 'excellent' ? 'default' :
                    analytics.financialHealth.emergencyFund.status === 'good' ? 'secondary' :
                    'destructive'
                  }>
                    {analytics.financialHealth.emergencyFund.status}
                  </Badge>
                </div>
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
                  ${analytics.costAnalysis.totalMonthlyCost.toFixed(0)}
                </span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <CostCard 
                label="Insurance" 
                amount={analytics.costAnalysis.breakdown.insurance}
                icon={Shield}
                color="purple"
              />
              <CostCard 
                label="Subscriptions" 
                amount={analytics.costAnalysis.breakdown.subscriptions}
                icon={Activity}
                color="blue"
              />
              <CostCard 
                label="Bills" 
                amount={analytics.costAnalysis.breakdown.bills}
                icon={DollarSign}
                color="green"
              />
              <CostCard 
                label="Maintenance" 
                amount={analytics.costAnalysis.breakdown.maintenance}
                icon={Target}
                color="orange"
              />
              <CostCard 
                label="Other" 
                amount={analytics.costAnalysis.breakdown.other}
                icon={BarChart3}
                color="gray"
              />
            </div>
          </CardContent>
        </Card>

        {/* Trend Detection */}
        {analytics.trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Trend Detection
              </CardTitle>
              <CardDescription>
                Significant activity changes across domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.trends.map((trend: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg border"
                  >
                    {trend.status === 'increased' ? (
                      <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{trend.domain}</span>
                        <Badge variant={trend.status === 'increased' ? 'default' : 'destructive'}>
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trend.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Predictive Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Predictive Analytics
            </CardTitle>
            <CardDescription>
              Budget forecasts and smart recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Next Month Budget Forecast</span>
                <Badge variant="secondary">
                  {(analytics.predictions.budgetForecast.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Projected Spending</p>
                  <p className="text-2xl font-bold">
                    ${analytics.predictions.budgetForecast.projectedSpending}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Budget</p>
                  <p className="text-2xl font-bold">
                    ${analytics.predictions.budgetForecast.currentBudget}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overage</p>
                  <p className={`text-2xl font-bold ${
                    analytics.predictions.budgetForecast.overageAmount > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {analytics.predictions.budgetForecast.overageAmount > 0 ? '+' : ''}
                    ${analytics.predictions.budgetForecast.overageAmount}
                  </p>
                </div>
              </div>
            </div>

            {analytics.predictions.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendations</h4>
                {analytics.predictions.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary">
                    <Target className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Life Balance Wheel */}
        <LifeBalanceWheel activities={analytics.lifeBalance} />

        {/* What-If Scenarios */}
        <WhatIfScenarios 
          currentData={{
            monthlyIncome: analytics.financialHealth.incomeVsExpenses.income,
            monthlyExpenses: analytics.financialHealth.incomeVsExpenses.expenses,
            savings: analytics.financialHealth.emergencyFund.current,
            debt: analytics.financialHealth.debtToIncome.totalDebt,
            netWorth: analytics.financialHealth.emergencyFund.current - analytics.financialHealth.debtToIncome.totalDebt
          }}
        />

        {/* Comparative Benchmarking */}
        <ComparativeBenchmarking 
          userProfile={{
            age: 35, // TODO: get from user settings
            location: 'USA',
            incomeRange: '50k-100k'
          }}
          userMetrics={{
            autoInsurance: 180,
            healthInsurance: 450,
            subscriptions: analytics.costAnalysis.breakdown.subscriptions,
            savings: analytics.financialHealth.emergencyFund.current,
            fitnessActivity: 3 // TODO: calculate from fitness domain
          }}
        />
      </div>
    </ErrorBoundary>
  )
}

interface CostCardProps {
  label: string
  amount: number
  icon: any
  color: string
}

function CostCard({ label, amount, icon: Icon, color }: CostCardProps) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600',
    green: 'bg-green-50 dark:bg-green-950 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-600',
    gray: 'bg-gray-50 dark:bg-gray-950 text-gray-600',
  }

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        ${amount.toFixed(0)}
      </div>
    </div>
  )
}
























