'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { Card } from '@/components/ui/card'
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  Bell,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCategoryColor } from '@/lib/utils/subscription-colors'

export function DigitalLifeDashboard() {
  const { analytics, analyticsLoading } = useSubscriptions()

  if (analyticsLoading) {
    return <DashboardSkeleton />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Unable to load dashboard data</p>
      </div>
    )
  }

  const { summary, upcoming_renewals, category_breakdown, due_this_week } = analytics

  return (
    <div className="space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Spend */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Monthly Spend</h3>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">
              {formatCurrency(summary.monthly_total)}
            </p>
            <p className="text-sm text-slate-400">
              {formatCurrency(summary.daily_total)}/day
            </p>
          </div>
        </Card>

        {/* Annual Projection */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Annual Projection</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">
              {formatCurrency(summary.yearly_total)}
            </p>
            <p className="text-sm text-slate-400">
              Based on current active
            </p>
          </div>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Active Subscriptions</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">
              {summary.active_count + summary.trial_count}
            </p>
            <p className="text-sm text-slate-400">
              {summary.trial_count > 0 ? `${summary.trial_count} in trial` : 'All active'}
            </p>
          </div>
        </Card>

        {/* Due This Week */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Due This Week</h3>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">
              {due_this_week.length}
            </p>
            <p className="text-sm text-slate-400">
              Renewals coming up
            </p>
          </div>
        </Card>
      </div>

      {/* Upcoming Renewals Section */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Upcoming Renewals</h2>
        </div>

        {upcoming_renewals.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No upcoming renewals in the next 30 days
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming_renewals.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
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
                    <p className="text-sm text-slate-400 capitalize">
                      {sub.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-lg">
                    {formatCurrency(sub.cost)}
                  </p>
                  <p className={`text-sm font-medium ${
                    sub.days_until_due <= 3 ? 'text-orange-400' :
                    sub.days_until_due <= 7 ? 'text-yellow-400' :
                    'text-slate-400'
                  }`}>
                    In {sub.days_until_due} day{sub.days_until_due !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* By Category Section */}
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">By Category</h2>
        </div>

        <div className="space-y-4">
          {/* Category bars */}
          {category_breakdown.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 capitalize">
                  {cat.category.replace('_', ' ')}
                </span>
                <span className="font-semibold text-white">
                  {formatCurrency(cat.amount)}/mo
                </span>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: getCategoryColor(cat.category)
                  }}
                />
              </div>
            </div>
          ))}

          {/* Donut Chart Summary */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {category_breakdown.reduce((acc, cat, index) => {
                    const startAngle = acc.angle
                    const angle = (cat.percentage / 100) * 360
                    const endAngle = startAngle + angle
                    
                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
                    
                    const largeArc = angle > 180 ? 1 : 0
                    
                    acc.paths.push(
                      <path
                        key={cat.category}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={getCategoryColor(cat.category)}
                        className="transition-opacity hover:opacity-80"
                      />
                    )
                    
                    acc.angle = endAngle
                    return acc
                  }, { angle: 0, paths: [] as JSX.Element[] }).paths}
                  <circle cx="50" cy="50" r="25" fill="#0f172a" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-white">
                    {category_breakdown.length}
                  </p>
                  <p className="text-sm text-slate-400">categories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}





