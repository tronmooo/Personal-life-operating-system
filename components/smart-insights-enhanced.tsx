'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Lightbulb, Target, DollarSign, Heart, Briefcase,
  Calendar, ArrowRight, Sparkles, Clock, Trophy,
  AlertTriangle, Info
} from 'lucide-react'
import { differenceInDays, parseISO, addDays } from 'date-fns'

export function SmartInsightsEnhanced() {
  const { data } = useData()

  const insights = useMemo(() => {
    const allInsights: Insight[] = []
    const now = new Date()

    // ====================
    // FINANCIAL INSIGHTS
    // ====================
    const financialItems = (data.financial || []) as any[]
    
    if (financialItems.length > 0) {
      // Calculate total balance
      const totalBalance = financialItems.reduce((sum, item) => {
        return sum + (parseFloat(item.metadata?.balance) || 0)
      }, 0)

      // Check account types
      const accountTypes = financialItems.reduce((acc, item) => {
        const type = item.metadata?.accountType
        if (type) acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const hasChecking = accountTypes['Checking'] > 0
      const hasSavings = accountTypes['Savings'] > 0
      const hasInvestment = accountTypes['Investment'] > 0

      // Financial Health Score Insight
      let financialScore = 0
      const factors: string[] = []
      
      if (hasChecking) { financialScore += 20; factors.push('checking account') }
      if (hasSavings) { financialScore += 20; factors.push('savings account') }
      if (hasInvestment) { financialScore += 30; factors.push('investments') }
      if (totalBalance > 0) { financialScore += 15; factors.push('positive balance') }
      if (financialItems.length >= 3) { financialScore += 15; factors.push('diversified accounts') }

      allInsights.push({
        id: 'financial-health-score',
        category: 'financial',
        type: financialScore >= 70 ? 'success' : financialScore >= 40 ? 'info' : 'warning',
        priority: 'high',
        title: `Financial Health Score: ${financialScore}/100`,
        description: `Based on ${factors.join(', ')}`,
        recommendation: financialScore >= 70 
          ? 'Excellent financial organization! Keep tracking all your accounts.'
          : financialScore >= 40
          ? 'Good start! Consider adding investment accounts for better diversification.'
          : 'Start by tracking checking and savings accounts, then add investments.',
        impact: 'high',
        actionable: true,
        action: { label: 'View Finances', link: '/domains/financial' },
        metric: financialScore
      })

      // Low balance warnings
      const lowBalanceAccounts = financialItems.filter(item => 
        item.metadata?.accountType === 'Checking' && parseFloat(item.metadata?.balance) < 500
      )
      
      if (lowBalanceAccounts.length > 0) {
        allInsights.push({
          id: 'low-balance-critical',
          category: 'financial',
          type: 'error',
          priority: 'high',
          title: 'Critical: Low Checking Balance',
          description: `${lowBalanceAccounts.length} checking account(s) below $500`,
          recommendation: 'Transfer funds immediately or set up emergency fund to avoid overdrafts',
          impact: 'high',
          actionable: true,
          action: { label: 'Review Accounts', link: '/domains/financial' }
        })
      }

      // No emergency fund warning
      if (!hasSavings && hasChecking) {
        allInsights.push({
          id: 'no-emergency-fund',
          category: 'financial',
          type: 'warning',
          priority: 'high',
          title: 'Missing Emergency Fund',
          description: 'No savings account detected',
          recommendation: 'Open a savings account and aim for 3-6 months of expenses',
          impact: 'high',
          actionable: true,
          action: { label: 'Emergency Fund Calculator', link: '/tools/emergency-fund-calculator' }
        })
      }

      // Investment opportunity
      if (hasChecking && hasSavings && !hasInvestment && totalBalance > 10000) {
        allInsights.push({
          id: 'investment-opportunity',
          category: 'financial',
          type: 'info',
          priority: 'medium',
          title: 'Investment Opportunity',
          description: `With $${totalBalance.toLocaleString()} across accounts, consider investing`,
          recommendation: 'Start a retirement or investment account to grow your wealth',
          impact: 'high',
          actionable: true,
          action: { label: 'ROI Calculator', link: '/tools/roi-calculator' }
        })
      }
    } else {
      // No financial data
      allInsights.push({
        id: 'start-financial-tracking',
        category: 'financial',
        type: 'info',
        priority: 'high',
        title: 'Start Financial Tracking',
        description: 'No financial accounts tracked yet',
        recommendation: 'Add your checking, savings, and investment accounts to get financial insights',
        impact: 'high',
        actionable: true,
        action: { label: 'Add Account', link: '/domains/financial' }
      })
    }

    // ====================
    // HEALTH INSIGHTS
    // ====================
    const healthItems = (data.health || []) as any[]
    
    if (healthItems.length > 0) {
      // Check for upcoming appointments
      const appointments = healthItems.filter(item => item.metadata?.date)
      const upcomingAppointments = appointments.filter(item => {
        const appointmentDate = parseISO(item.metadata.date)
        const daysUntil = differenceInDays(appointmentDate, now)
        return daysUntil > 0 && daysUntil <= 14
      })

      if (upcomingAppointments.length > 0) {
        const nextAppt = upcomingAppointments[0]
        const daysUntil = differenceInDays(parseISO(nextAppt.metadata.date), now)
        
        allInsights.push({
          id: 'upcoming-health-appointment',
          category: 'health',
          type: daysUntil <= 3 ? 'warning' : 'info',
          priority: daysUntil <= 3 ? 'high' : 'medium',
          title: `Health Appointment in ${daysUntil} Days`,
          description: nextAppt.title || 'Upcoming medical appointment',
          recommendation: daysUntil <= 3 
            ? 'Appointment coming up soon! Prepare questions and documents.'
            : 'Mark your calendar and prepare any necessary paperwork.',
          impact: 'medium',
          actionable: true,
          action: { label: 'View Health Records', link: '/domains/health' }
        })
      }

      // Check for medication tracking
      const medications = healthItems.filter(item => 
        item.metadata?.recordType === 'Medication'
      )

      if (medications.length === 0 && healthItems.length > 3) {
        allInsights.push({
          id: 'track-medications',
          category: 'health',
          type: 'info',
          priority: 'medium',
          title: 'Track Your Medications',
          description: 'No medications recorded',
          recommendation: 'Add any medications, vitamins, or supplements you take regularly',
          impact: 'medium',
          actionable: true,
          action: { label: 'Add Medication', link: '/domains/health' }
        })
      }

      // Health tracking consistency
      allInsights.push({
        id: 'health-tracking-active',
        category: 'health',
        type: 'success',
        priority: 'low',
        title: 'Active Health Tracking',
        description: `${healthItems.length} health records maintained`,
        recommendation: 'Keep updating your health records for better long-term insights',
        impact: 'medium',
        actionable: false
      })
    } else {
      allInsights.push({
        id: 'start-health-tracking',
        category: 'health',
        type: 'info',
        priority: 'medium',
        title: 'Start Health Tracking',
        description: 'No health records yet',
        recommendation: 'Add medical appointments, medications, and vital signs for comprehensive health management',
        impact: 'high',
        actionable: true,
        action: { label: 'Add Health Record', link: '/domains/health' }
      })
    }

    // ====================
    // GENERAL LIFE INSIGHTS
    // ====================
    
    // Domain coverage analysis
    const activeDomains = Object.entries(data).filter(([_, items]) => 
      Array.isArray(items) && items.length > 0
    ).length
    
    const totalDomains = 21
    const coveragePercent = Math.round((activeDomains / totalDomains) * 100)

    allInsights.push({
      id: 'life-balance-score',
      category: 'general',
      type: coveragePercent >= 50 ? 'success' : coveragePercent >= 25 ? 'info' : 'warning',
      priority: 'high',
      title: 'Life Balance Score',
      description: `${activeDomains} of ${totalDomains} life domains active`,
      recommendation: coveragePercent >= 50
        ? `Excellent! You're tracking ${coveragePercent}% of your life domains.`
        : `Consider expanding to more domains. Current coverage: ${coveragePercent}%`,
      impact: 'high',
      actionable: true,
      action: { label: 'Explore Domains', link: '/domains' },
      metric: coveragePercent
    })

    // Activity consistency
    const totalItems = Object.values(data).reduce((sum, items) => 
      sum + (Array.isArray(items) ? items.length : 0), 0
    )

    if (totalItems >= 50) {
      allInsights.push({
        id: 'milestone-50-items',
        category: 'general',
        type: 'success',
        priority: 'low',
        title: '🎉 Milestone: 50+ Items Tracked!',
        description: `You've tracked ${totalItems} items across all domains`,
        recommendation: 'Amazing dedication! Your organized life is taking shape.',
        impact: 'low',
        actionable: false
      })
    }

    // Data export recommendation
    if (totalItems >= 20) {
      const hasExportedRecently = false // Could check localStorage for last export date
      
      if (!hasExportedRecently) {
        allInsights.push({
          id: 'backup-recommendation',
          category: 'general',
          type: 'info',
          priority: 'medium',
          title: 'Backup Your Data',
          description: `${totalItems} items should be backed up`,
          recommendation: 'Export your data regularly to prevent loss',
          impact: 'medium',
          actionable: true,
          action: { label: 'Export Data', link: '/export' }
        })
      }
    }

    // Suggest goal setting
    const hasGoals = totalItems > 10 && activeDomains >= 3
    
    if (hasGoals) {
      allInsights.push({
        id: 'set-goals',
        category: 'general',
        type: 'info',
        priority: 'medium',
        title: 'Set Life Goals',
        description: 'You have a solid foundation - time to set goals!',
        recommendation: 'Create specific, measurable goals for your top life domains',
        impact: 'high',
        actionable: true,
        action: { label: 'Goal Tracker', link: '/goals' }
      })
    }

    // ====================
    // VEHICLES INSIGHTS
    // ====================
    const vehicleItems = (data.vehicles || []) as any[]
    
    if (vehicleItems.length > 0) {
      vehicleItems.forEach(vehicle => {
        const mileage = parseInt(vehicle.metadata?.mileage) || 0
        const lastService = vehicle.metadata?.lastServiceDate
        
        // High mileage warning
        if (mileage > 100000) {
          allInsights.push({
            id: `vehicle-high-mileage-${vehicle.id}`,
            category: 'general',
            type: 'info',
            priority: 'low',
            title: 'High Mileage Vehicle',
            description: `${vehicle.metadata?.make} ${vehicle.metadata?.model} has ${mileage.toLocaleString()} miles`,
            recommendation: 'Consider increased maintenance frequency for high-mileage vehicles',
            impact: 'medium',
            actionable: true,
            action: { label: 'View Vehicle', link: '/domains/vehicles' }
          })
        }
      })
    }

    // ====================
    // HOME INSIGHTS
    // ====================
    const homeItems = (data.home || []) as any[]
    
    if (homeItems.length > 0) {
      const maintenanceItems = homeItems.filter(item => 
        item.metadata?.itemType === 'Maintenance'
      )
      
      if (maintenanceItems.length > 0) {
        allInsights.push({
          id: 'home-maintenance-tracking',
          category: 'general',
          type: 'success',
          priority: 'low',
          title: 'Home Maintenance Active',
          description: `Tracking ${maintenanceItems.length} maintenance tasks`,
          recommendation: 'Keep logging maintenance to maximize home value',
          impact: 'medium',
          actionable: false
        })
      }
    }

    // Sort by priority
    return allInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [data])

  // Categorize insights
  const criticalInsights = insights.filter(i => i.type === 'error' || (i.type === 'warning' && i.priority === 'high'))
  const actionableInsights = insights.filter(i => i.actionable && i.type !== 'error')
  const achievements = insights.filter(i => i.type === 'success')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Smart Insights
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered recommendations based on your actual data
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          {insights.length} Insights
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalInsights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">critical items</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{actionableInsights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">recommendations</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{achievements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">milestones</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {insights.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start tracking your life domains to receive personalized insights!</p>
            <Button className="mt-4" asChild>
              <a href="/domains">Explore Domains</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface Insight {
  id: string
  category: 'financial' | 'health' | 'general'
  type: 'success' | 'warning' | 'info' | 'error'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  recommendation: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: {
    label: string
    link: string
  }
  metric?: number
}

function InsightCard({ insight }: { insight: Insight }) {
  const getCategoryIcon = (category: string) => {
    const icons = {
      financial: DollarSign,
      health: Heart,
      general: Lightbulb
    }
    const Icon = icons[category as keyof typeof icons] || Lightbulb
    return <Icon className="h-5 w-5" />
  }

  const getTypeColor = (type: string) => {
    const colors = {
      success: 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950',
      warning: 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950',
      info: 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950',
      error: 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950'
    }
    return colors[type as keyof typeof colors] || 'border-gray-200'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      warning: AlertCircle,
      info: Info,
      error: AlertTriangle
    }
    const Icon = icons[type as keyof typeof icons] || Info
    const colors = {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      error: 'text-red-600'
    }
    return <Icon className={`h-5 w-5 ${colors[type as keyof typeof colors]}`} />
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getImpactIcon = (impact: string) => {
    if (impact === 'high') return <TrendingUp className="h-4 w-4 text-red-500" />
    if (impact === 'medium') return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-gray-500" />
  }

  return (
    <Card className={getTypeColor(insight.type)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              {getTypeIcon(insight.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                {getPriorityBadge(insight.priority)}
                <Badge variant="outline" className="capitalize">
                  {getCategoryIcon(insight.category)}
                  <span className="ml-1">{insight.category}</span>
                </Badge>
              </div>
              <CardDescription>{insight.description}</CardDescription>
            </div>
          </div>
          {insight.metric !== undefined && (
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{insight.metric}%</div>
              <Progress value={insight.metric} className="w-24 mt-2" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50">
          <Lightbulb className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-sm mb-1">Recommendation</div>
            <div className="text-sm text-muted-foreground">{insight.recommendation}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {getImpactIcon(insight.impact)}
              <span className="capitalize">{insight.impact} Impact</span>
            </span>
          </div>

          {insight.actionable && insight.action && (
            <Button size="sm" asChild>
              <a href={insight.action.link}>
                {insight.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
