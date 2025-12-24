'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Calendar, Clock, 
  Sparkles, Database, FolderOpen, Eye, PieChart, ArrowUpRight, 
  ArrowDownRight, Minus, RefreshCw, Download, Zap, Target,
  AlertCircle, CheckCircle2, FileText, Timer, Flame, Star
} from 'lucide-react'
import { format, subDays, differenceInDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { DOMAIN_CONFIGS, type Domain, type DomainData } from '@/types/domains'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { cn } from '@/lib/utils'

interface TimeRange {
  label: string
  days: number
  key: '7d' | '30d' | '90d' | 'all'
}

const TIME_RANGES: TimeRange[] = [
  { label: '7 Days', days: 7, key: '7d' },
  { label: '30 Days', days: 30, key: '30d' },
  { label: '90 Days', days: 90, key: '90d' },
  { label: 'All Time', days: 365 * 10, key: 'all' },
]

interface DomainMetric {
  domain: Domain
  name: string
  color: string
  icon: string
  count: number
  recentCount: number
  growthPercent: number
  lastActivity: Date | null
  completeness: number
}

interface ActivityItem {
  id: string
  domain: Domain
  title: string
  action: 'created' | 'updated'
  timestamp: Date
  color: string
}

interface DailyActivity {
  date: string
  count: number
  domains: Record<string, number>
}

interface UsageAnalyticsDashboardProps {
  className?: string
}

export function UsageAnalyticsDashboard({ className }: UsageAnalyticsDashboardProps) {
  const { data: domainData, tasks, habits, bills } = useData()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const selectedRange = TIME_RANGES.find(r => r.key === timeRange) || TIME_RANGES[1]

  // Flatten all domain entries
  const allEntries = useMemo(() => {
    const entries: (DomainData & { domain: Domain })[] = []
    
    Object.entries(domainData || {}).forEach(([domain, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: DomainData) => {
          entries.push({ ...item, domain: domain as Domain })
        })
      }
    })
    
    return entries
  }, [domainData])

  // Calculate domain metrics
  const domainMetrics = useMemo((): DomainMetric[] => {
    const now = new Date()
    const rangeStart = subDays(now, selectedRange.days)
    const previousRangeStart = subDays(rangeStart, selectedRange.days)

    const metrics: DomainMetric[] = []

    // Process each domain
    const allDomains = Object.keys(DOMAIN_CONFIGS) as Domain[]
    
    allDomains.forEach(domain => {
      const items = (domainData?.[domain] || []) as DomainData[]
      const config = DOMAIN_CONFIGS[domain]
      
      // Count items in current range
      const recentItems = items.filter(item => {
        const created = item.createdAt ? parseISO(item.createdAt) : null
        const updated = item.updatedAt ? parseISO(item.updatedAt) : null
        const relevantDate = updated || created
        return relevantDate && relevantDate >= rangeStart
      })

      // Count items in previous range
      const previousItems = items.filter(item => {
        const created = item.createdAt ? parseISO(item.createdAt) : null
        const updated = item.updatedAt ? parseISO(item.updatedAt) : null
        const relevantDate = updated || created
        return relevantDate && relevantDate >= previousRangeStart && relevantDate < rangeStart
      })

      // Calculate growth
      const previousCount = previousItems.length || 1
      const growthPercent = previousItems.length > 0 
        ? ((recentItems.length - previousItems.length) / previousCount) * 100
        : recentItems.length > 0 ? 100 : 0

      // Find last activity
      let lastActivity: Date | null = null
      items.forEach(item => {
        const itemDate = item.updatedAt ? parseISO(item.updatedAt) : 
                        item.createdAt ? parseISO(item.createdAt) : null
        if (itemDate && (!lastActivity || itemDate > lastActivity)) {
          lastActivity = itemDate
        }
      })

      // Calculate completeness (items with title and at least 2 metadata fields)
      const completeness = items.length > 0 
        ? items.filter(item => 
            item.title && 
            item.metadata && 
            Object.values(item.metadata).filter(v => v !== null && v !== undefined && v !== '').length >= 2
          ).length / items.length * 100
        : 0

      metrics.push({
        domain,
        name: config.name,
        color: config.color,
        icon: config.icon,
        count: items.length,
        recentCount: recentItems.length,
        growthPercent,
        lastActivity,
        completeness,
      })
    })

    // Sort by count (most items first)
    return metrics.sort((a, b) => b.count - a.count)
  }, [domainData, selectedRange.days])

  // Calculate recent activity feed
  const recentActivity = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = []
    const now = new Date()
    const rangeStart = subDays(now, selectedRange.days)

    allEntries.forEach(entry => {
      const created = entry.createdAt ? parseISO(entry.createdAt) : null
      const updated = entry.updatedAt ? parseISO(entry.updatedAt) : null
      const config = DOMAIN_CONFIGS[entry.domain]

      // Check if created within range
      if (created && created >= rangeStart) {
        activities.push({
          id: `${entry.id}-created`,
          domain: entry.domain,
          title: entry.title || 'Untitled',
          action: 'created',
          timestamp: created,
          color: config?.color || 'bg-gray-500',
        })
      }

      // Check if updated within range (and different from created)
      if (updated && updated >= rangeStart && created && !isSameDay(updated, created)) {
        activities.push({
          id: `${entry.id}-updated`,
          domain: entry.domain,
          title: entry.title || 'Untitled',
          action: 'updated',
          timestamp: updated,
          color: config?.color || 'bg-gray-500',
        })
      }
    })

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20)
  }, [allEntries, selectedRange.days])

  // Calculate daily activity for chart
  const dailyActivity = useMemo((): DailyActivity[] => {
    const now = new Date()
    const days: DailyActivity[] = []
    
    // Initialize days
    for (let i = Math.min(selectedRange.days, 30) - 1; i >= 0; i--) {
      const date = subDays(now, i)
      days.push({
        date: format(date, 'yyyy-MM-dd'),
        count: 0,
        domains: {},
      })
    }

    // Count activities per day
    allEntries.forEach(entry => {
      const created = entry.createdAt ? parseISO(entry.createdAt) : null
      const updated = entry.updatedAt ? parseISO(entry.updatedAt) : null
      
      [created, updated].filter(Boolean).forEach(date => {
        if (!date) return
        const dateKey = format(date, 'yyyy-MM-dd')
        const dayRecord = days.find(d => d.date === dateKey)
        if (dayRecord) {
          dayRecord.count++
          dayRecord.domains[entry.domain] = (dayRecord.domains[entry.domain] || 0) + 1
        }
      })
    })

    return days
  }, [allEntries, selectedRange.days])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalItems = allEntries.length
    const activeDomains = domainMetrics.filter(m => m.count > 0).length
    const totalDomains = Object.keys(DOMAIN_CONFIGS).length
    
    const now = new Date()
    const rangeStart = subDays(now, selectedRange.days)
    
    // Items created/updated in range
    const activeItems = allEntries.filter(entry => {
      const created = entry.createdAt ? parseISO(entry.createdAt) : null
      const updated = entry.updatedAt ? parseISO(entry.updatedAt) : null
      const relevantDate = updated || created
      return relevantDate && relevantDate >= rangeStart
    }).length

    // Average completeness across domains with data
    const avgCompleteness = domainMetrics.filter(m => m.count > 0).length > 0
      ? domainMetrics.filter(m => m.count > 0).reduce((sum, m) => sum + m.completeness, 0) / domainMetrics.filter(m => m.count > 0).length
      : 0

    // Most active day
    const maxDayActivity = Math.max(...dailyActivity.map(d => d.count), 0)
    const mostActiveDay = dailyActivity.find(d => d.count === maxDayActivity)

    // Streak calculation (consecutive days with activity)
    let streak = 0
    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].count > 0) {
        streak++
      } else {
        break
      }
    }

    return {
      totalItems,
      activeDomains,
      totalDomains,
      activeItems,
      avgCompleteness,
      mostActiveDay,
      maxDayActivity,
      streak,
      tasksCount: tasks?.length || 0,
      habitsCount: habits?.length || 0,
      billsCount: bills?.length || 0,
    }
  }, [allEntries, domainMetrics, dailyActivity, tasks, habits, bills, selectedRange.days])

  // Get top growing domains
  const topGrowingDomains = useMemo(() => {
    return [...domainMetrics]
      .filter(m => m.recentCount > 0)
      .sort((a, b) => b.growthPercent - a.growthPercent)
      .slice(0, 3)
  }, [domainMetrics])

  // Get domains needing attention (low completeness or no recent activity)
  const domainsNeedingAttention = useMemo(() => {
    return domainMetrics
      .filter(m => m.count > 0 && (m.completeness < 50 || m.recentCount === 0))
      .slice(0, 3)
  }, [domainMetrics])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Trigger data reload by dispatching event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-data-reload'))
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const exportData = () => {
    const exportObj = {
      generatedAt: new Date().toISOString(),
      timeRange: selectedRange.label,
      summary: summaryStats,
      domainMetrics,
      dailyActivity,
      recentActivity: recentActivity.slice(0, 50),
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usage-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
  }

  // Empty state
  if (allEntries.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Database className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Start adding entries to your domains to see comprehensive usage analytics and insights.
          </p>
          <Button asChild>
            <a href="/domains">
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Domains
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          {TIME_RANGES.map(range => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range.key)}
              className={cn(
                "transition-all",
                timeRange === range.key && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              )}
            >
              {range.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{summaryStats.totalItems}</span>
              <span className="text-muted-foreground">items</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summaryStats.activeDomains} of {summaryStats.totalDomains} domains
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{summaryStats.activeItems}</span>
              <span className="text-muted-foreground">changes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last {selectedRange.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{summaryStats.streak}</span>
              <span className="text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consecutive days with activity
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{Math.round(summaryStats.avgCompleteness)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average completeness score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Daily data changes over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48 pt-4">
            {dailyActivity.map(({ date, count }) => {
              const maxCount = Math.max(...dailyActivity.map(d => d.count), 1)
              const height = count > 0 ? Math.max((count / maxCount) * 100, 5) : 2
              const isToday = date === format(new Date(), 'yyyy-MM-dd')
              
              return (
                <div
                  key={date}
                  className="flex-1 group relative"
                >
                  <div
                    className={cn(
                      "rounded-t transition-all duration-300 hover:opacity-80",
                      count > 0 
                        ? "bg-gradient-to-t from-purple-600 to-blue-500" 
                        : "bg-muted/30",
                      isToday && "ring-2 ring-purple-400 ring-offset-2 ring-offset-background"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-sm">
                    <p className="font-medium">{format(parseISO(date), 'MMM d, yyyy')}</p>
                    <p className="text-muted-foreground">{count} {count === 1 ? 'activity' : 'activities'}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-3 px-1">
            <span>{format(parseISO(dailyActivity[0]?.date || new Date().toISOString()), 'MMM d')}</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Domain Breakdown
            </CardTitle>
            <CardDescription>
              Entry distribution across domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {domainMetrics.filter(m => m.count > 0).slice(0, 8).map(metric => {
              const percentage = summaryStats.totalItems > 0 
                ? (metric.count / summaryStats.totalItems) * 100 
                : 0
              
              return (
                <div key={metric.domain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", metric.color)} />
                      <span className="font-medium text-sm">{metric.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{metric.count}</span>
                      {metric.growthPercent !== 0 && (
                        <Badge 
                          variant={metric.growthPercent > 0 ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            metric.growthPercent > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""
                          )}
                        >
                          {metric.growthPercent > 0 ? '+' : ''}{metric.growthPercent.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", metric.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {domainMetrics.filter(m => m.count > 0).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No domain data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest changes across all domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 10).map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", activity.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{activity.title}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {activity.action}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{DOMAIN_CONFIGS[activity.domain]?.name || activity.domain}</span>
                        <span>•</span>
                        <span>{format(activity.timestamp, 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity in the selected period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Growing Domains */}
        <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Fastest Growing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topGrowingDomains.length > 0 ? (
              topGrowingDomains.map(domain => (
                <div key={domain.domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", domain.color)} />
                    <span className="text-sm">{domain.name}</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {domain.growthPercent.toFixed(0)}%
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No growth data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <span className="font-semibold">{summaryStats.tasksCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Habits</span>
              <span className="font-semibold">{summaryStats.habitsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bills</span>
              <span className="font-semibold">{summaryStats.billsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peak Day</span>
              <span className="font-semibold">{summaryStats.maxDayActivity} activities</span>
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {domainsNeedingAttention.length > 0 ? (
              domainsNeedingAttention.map(domain => (
                <div key={domain.domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", domain.color)} />
                    <span className="text-sm">{domain.name}</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {domain.completeness < 50 ? 'Low data' : 'Inactive'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                All domains look good!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Personalized observations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryStats.streak > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <Flame className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Keep it up!</strong> You've been active for {summaryStats.streak} consecutive days. 
                Consistency is key to building a comprehensive life management system.
              </p>
            </div>
          )}
          
          {topGrowingDomains[0] && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>{topGrowingDomains[0].name}</strong> is your fastest growing domain with{' '}
                {topGrowingDomains[0].growthPercent.toFixed(0)}% growth. You've added{' '}
                {topGrowingDomains[0].recentCount} new entries recently.
              </p>
            </div>
          )}

          {summaryStats.activeDomains < 5 && summaryStats.totalItems > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <Target className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Room to grow!</strong> You're using {summaryStats.activeDomains} of {summaryStats.totalDomains} domains.
                Consider exploring other areas like{' '}
                {domainMetrics.filter(m => m.count === 0).slice(0, 2).map(m => m.name).join(', ')}.
              </p>
            </div>
          )}

          {summaryStats.avgCompleteness < 60 && summaryStats.totalItems > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <FileText className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Data enrichment opportunity!</strong> Your average data completeness is{' '}
                {Math.round(summaryStats.avgCompleteness)}%. Adding more details to your entries
                will help generate better insights and recommendations.
              </p>
            </div>
          )}

          {summaryStats.mostActiveDay && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Peak productivity!</strong> Your most active day had{' '}
                {summaryStats.maxDayActivity} data activities on{' '}
                {format(parseISO(summaryStats.mostActiveDay.date), 'MMMM d')}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}





