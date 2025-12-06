'use client'

import { useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, Heart, Car, Home, Shield, Utensils, Dumbbell,
  Brain, Package, FileText, Zap, Users, TrendingUp, TrendingDown,
  Calendar, BarChart3
} from 'lucide-react'
import { subDays, format, differenceInDays, startOfDay } from 'date-fns'

export function DomainDataCharts() {
  const { data } = useData()

  // Calculate domain activity over last 30 days
  const domainActivity = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      return {
        date: format(date, 'yyyy-MM-dd'),
        dateObj: date,
        domains: {} as Record<string, number>
      }
    })

    // Count items created each day for each domain
    Object.entries(data).forEach(([domain, items]) => {
      if (!Array.isArray(items)) return

      items.forEach((item: any) => {
        const createdAt = new Date(item.createdAt || item.created_at)
        const dayKey = format(createdAt, 'yyyy-MM-dd')
        const dayIndex = last30Days.findIndex(d => d.date === dayKey)

        if (dayIndex !== -1) {
          last30Days[dayIndex].domains[domain] = (last30Days[dayIndex].domains[domain] || 0) + 1
        }
      })
    })

    return last30Days
  }, [data])

  // Calculate growth trends
  const growthTrends = useMemo(() => {
    const trends: Record<string, { current: number; previous: number; change: number; percentChange: number }> = {}

    const now = new Date()
    const last7Days = subDays(now, 7)
    const previous7Days = subDays(now, 14)

    Object.entries(data).forEach(([domain, items]) => {
      if (!Array.isArray(items)) return

      const currentPeriod = items.filter((item: any) => {
        const date = new Date(item.createdAt || item.created_at)
        return date >= last7Days
      }).length

      const previousPeriod = items.filter((item: any) => {
        const date = new Date(item.createdAt || item.created_at)
        return date >= previous7Days && date < last7Days
      }).length

      const change = currentPeriod - previousPeriod
      const percentChange = previousPeriod > 0 ? (change / previousPeriod) * 100 : (currentPeriod > 0 ? 100 : 0)

      trends[domain] = {
        current: currentPeriod,
        previous: previousPeriod,
        change,
        percentChange: Math.round(percentChange)
      }
    })

    return trends
  }, [data])

  // Domain metadata
  const domainMeta: Record<string, { icon: any; color: string; label: string }> = {
    financial: { icon: DollarSign, color: 'bg-green-500', label: 'Financial' },
    health: { icon: Heart, color: 'bg-red-500', label: 'Health' },
    vehicles: { icon: Car, color: 'bg-blue-500', label: 'Vehicles' },
    home: { icon: Home, color: 'bg-orange-500', label: 'Home' },
    insurance: { icon: Shield, color: 'bg-indigo-500', label: 'Insurance' },
    nutrition: { icon: Utensils, color: 'bg-yellow-500', label: 'Nutrition' },
    fitness: { icon: Dumbbell, color: 'bg-pink-500', label: 'Fitness' },
    mindfulness: { icon: Brain, color: 'bg-teal-500', label: 'Mindfulness' },
    collectibles: { icon: Package, color: 'bg-amber-500', label: 'Collectibles' },
    legal: { icon: FileText, color: 'bg-gray-500', label: 'Legal' },
    digital: { icon: Zap, color: 'bg-cyan-500', label: 'Digital' },
    pets: { icon: Users, color: 'bg-purple-500', label: 'Pets' },
  }

  // Get domains with activity
  const activeDomains = Object.entries(data)
    .filter(([_, items]) => Array.isArray(items) && items.length > 0)
    .map(([domain]) => domain)

  // Calculate max value for chart scaling
  const maxDailyActivity = Math.max(
    ...domainActivity.map(day =>
      Object.values(day.domains).reduce((sum, count) => sum + count, 0)
    ),
    1
  )

  return (
    <div className="space-y-6">
      {/* 30-Day Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            30-Day Data Activity
          </CardTitle>
          <CardDescription>
            Items added to domains over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart */}
            <div className="flex items-end gap-1 h-48 border-b border-l pb-4 pl-2">
              {domainActivity.map(({ date, domains }) => {
                const totalCount = Object.values(domains).reduce((sum, count) => sum + count, 0)
                const height = maxDailyActivity > 0 ? (totalCount / maxDailyActivity) * 100 : 0

                return (
                  <div
                    key={date}
                    className="flex-1 relative group"
                  >
                    {totalCount > 0 && (
                      <>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t hover:opacity-80 transition-all cursor-pointer"
                          style={{ height: `${height}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          <div className="font-semibold">{format(new Date(date), 'MMM d')}</div>
                          <div className="text-gray-300">{totalCount} items added</div>
                          {Object.entries(domains).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {Object.entries(domains).map(([domain, count]) => (
                                <div key={domain} className="text-xs">
                                  {domainMeta[domain]?.label || domain}: {count}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{format(subDays(new Date(), 29), 'MMM d')}</span>
              <span className="font-semibold">Total: {domainActivity.reduce((sum, day) =>
                sum + Object.values(day.domains).reduce((s, c) => s + c, 0), 0
              )} items</span>
              <span>{format(new Date(), 'MMM d')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            7-Day Growth Trends
          </CardTitle>
          <CardDescription>
            Compare last 7 days vs previous 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDomains
              .filter(domain => growthTrends[domain])
              .sort((a, b) => Math.abs(growthTrends[b].change) - Math.abs(growthTrends[a].change))
              .slice(0, 6)
              .map(domain => {
                const trend = growthTrends[domain]
                const meta = domainMeta[domain] || { icon: Package, color: 'bg-gray-500', label: domain }
                const Icon = meta.icon
                const isGrowing = trend.change > 0
                const isDecreasing = trend.change < 0

                return (
                  <Card key={domain} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${meta.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm">{meta.label}</span>
                        </div>
                        {isGrowing ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : isDecreasing ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last 7 days:</span>
                          <span className="font-semibold">{trend.current} items</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Previous:</span>
                          <span className="font-semibold">{trend.previous} items</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Change:</span>
                            <Badge
                              variant={isGrowing ? 'default' : isDecreasing ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {trend.change > 0 ? '+' : ''}{trend.change} ({trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%)
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>

          {activeDomains.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No activity data available yet</p>
              <p className="text-sm">Start adding items to see growth trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
