'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { getCategoryColor } from '@/lib/utils/subscription-colors'
import Link from 'next/link'

interface SubscriptionSummary {
  monthly_total: number
  yearly_total: number
  active_count: number
  due_this_week: number
}

interface UpcomingRenewal {
  id: string
  service_name: string
  category: string
  cost: number
  days_until_due: number
  icon_letter?: string
  icon_color?: string
}

export function DigitalLifeCard() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null)
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/subscriptions/analytics')
      if (response.ok) {
        const data = await response.json()
        setSummary({
          monthly_total: data.summary.monthly_total,
          yearly_total: data.summary.yearly_total,
          active_count: data.summary.active_count + data.summary.trial_count,
          due_this_week: data.due_this_week.length,
        })
        setUpcomingRenewals(data.upcoming_renewals.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 p-6">
        <div className="text-center text-white">
          <p>Unable to load subscription data</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 hover:shadow-xl transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Digital Life</h3>
              <p className="text-white/70 text-sm">Subscriptions</p>
            </div>
          </div>
          <Link href="/domains/digital">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/70 text-xs mb-1">Monthly</p>
            <p className="text-white font-bold text-xl">
              {formatCurrency(summary.monthly_total)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/70 text-xs mb-1">Yearly</p>
            <p className="text-white font-bold text-xl">
              {formatCurrency(summary.yearly_total)}
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Active Subscriptions</span>
            <span className="text-white font-bold text-lg">{summary.active_count}</span>
          </div>
        </div>

        {/* Due This Week */}
        {summary.due_this_week > 0 && (
          <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-orange-300" />
              <span className="text-orange-100 font-semibold text-sm">
                Due This Week
              </span>
            </div>
            <p className="text-orange-100 font-bold text-lg">
              {summary.due_this_week} renewal{summary.due_this_week !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <div className="space-y-2">
            <p className="text-white/70 text-xs font-semibold">Upcoming Renewals</p>
            {upcomingRenewals.map((renewal) => (
              <div
                key={renewal.id}
                className="bg-white/10 rounded-lg p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: renewal.icon_color || getCategoryColor(renewal.category)
                    }}
                  >
                    {renewal.icon_letter || renewal.service_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {renewal.service_name}
                    </p>
                    <p className="text-white/60 text-xs">
                      In {renewal.days_until_due} day{renewal.days_until_due !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-white font-semibold">
                  {formatCurrency(renewal.cost)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <Link href="/domains/digital">
          <Button
            className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
            variant="outline"
          >
            View All Subscriptions
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}


