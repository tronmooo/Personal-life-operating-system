'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { Card } from '@/components/ui/card'
import { TrendingUp, AlertCircle, CheckCircle2, Clock, Pause, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCategoryColor } from '@/lib/utils/subscription-colors'
import { format } from 'date-fns'

export function DigitalLifeAnalytics() {
  const { analytics, analyticsLoading } = useSubscriptions()

  if (analyticsLoading) {
    return <AnalyticsSkeleton />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Unable to load analytics data</p>
      </div>
    )
  }

  const { summary, monthly_trend, old_subscriptions } = analytics

  return (
    <div className="space-y-6">
      {/* Monthly Spending Trend */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Monthly Spending Trend</h2>
        </div>

        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {monthly_trend.map((item, index) => {
            const maxAmount = Math.max(...monthly_trend.map(t => t.amount))
            const heightPercent = (item.amount / maxAmount) * 100

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex items-end justify-center h-48">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(item.amount, false)}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-400">{item.month}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Cost Perspective */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Cost Perspective</h2>

        <div className="space-y-6">
          {/* Per Day */}
          <div>
            <p className="text-slate-400 text-sm mb-2">Per Day</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(summary.daily_total)}
            </p>
          </div>

          {/* Per Week */}
          <div>
            <p className="text-slate-400 text-sm mb-2">Per Week</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(summary.weekly_total)}
            </p>
          </div>

          {/* Per Year */}
          <div>
            <p className="text-slate-400 text-sm mb-2">Per Year</p>
            <p className="text-4xl font-bold text-white">
              {formatCurrency(summary.yearly_total)}
            </p>
          </div>
        </div>
      </Card>

      {/* Subscription Health */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Subscription Health</h2>

        <div className="space-y-3">
          {/* Active */}
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-medium">Active</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {summary.active_count}
            </span>
          </div>

          {/* In Trial */}
          <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">In Trial</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {summary.trial_count}
            </span>
          </div>

          {/* Paused */}
          <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Pause className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-medium">Paused</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {summary.paused_count}
            </span>
          </div>

          {/* Cancelled */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300 font-medium">Cancelled</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {summary.cancelled_count}
            </span>
          </div>
        </div>
      </Card>

      {/* Review These Subscriptions */}
      {old_subscriptions.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Review These Subscriptions</h2>
          </div>

          <p className="text-slate-400 mb-6">
            Consider reviewing these for potential savings:
          </p>

          <div className="space-y-3">
            {old_subscriptions.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{
                      backgroundColor: sub.icon_color || getCategoryColor(sub.category)
                    }}
                  >
                    {sub.icon_letter || sub.service_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{sub.service_name}</h3>
                    <p className="text-sm text-slate-400">
                      Since {sub.start_date ? format(new Date(sub.start_date), 'MMM yyyy') : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-lg">
                    {formatCurrency(sub.monthly_cost)}/mo
                  </p>
                  <p className="text-sm text-slate-400">
                    {sub.age_in_years} year{sub.age_in_years !== 1 ? 's' : ''} old
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    </div>
  )
}


