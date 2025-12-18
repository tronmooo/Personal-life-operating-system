'use client'

import { useState, useMemo } from 'react'
import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { getCategoryColor } from '@/lib/utils/subscription-colors'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns'

export function DigitalLifeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { subscriptions, loading } = useSubscriptions()

  // Calculate monthly cost from subscription
  const calculateMonthlyCost = (cost: number, frequency: string) => {
    switch (frequency) {
      case 'monthly': return cost
      case 'yearly': return cost / 12
      case 'quarterly': return cost / 3
      case 'weekly': return cost * 4.33
      case 'daily': return cost * 30
      default: return cost
    }
  }

  // Group subscriptions by date
  const subscriptionsByDate = useMemo(() => {
    const grouped: Record<string, Array<typeof subscriptions[0] & { displayCost: number }>> = {}
    
    subscriptions.forEach(sub => {
      const dateKey = format(parseISO(sub.next_due_date), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push({
        ...sub,
        displayCost: calculateMonthlyCost(sub.cost, sub.frequency)
      })
    })
    
    return grouped
  }, [subscriptions])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [currentDate])

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-700/50 rounded" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700/50 rounded" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={handlePrevMonth}
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <h2 className="text-2xl font-bold text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <Button
          onClick={handleNextMonth}
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const daySubs = subscriptionsByDate[dateKey] || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())
          const totalForDay = daySubs.reduce((sum, sub) => sum + sub.cost, 0)

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-2 rounded-lg border transition-colors
                ${isCurrentMonth 
                  ? 'bg-slate-900/30 border-slate-700/30' 
                  : 'bg-slate-900/10 border-slate-800/20'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-white' : 'text-slate-600'
              }`}>
                {format(day, 'd')}
              </div>

              {daySubs.length > 0 && (
                <div className="space-y-1">
                  {daySubs.slice(0, 2).map((sub) => (
                    <div
                      key={sub.id}
                      className="px-2 py-1 rounded text-xs font-medium text-white truncate"
                      style={{
                        backgroundColor: getCategoryColor(sub.category)
                      }}
                      title={`${sub.service_name} - ${formatCurrency(sub.cost)}`}
                    >
                      {formatCurrency(sub.cost)}
                    </div>
                  ))}
                  {daySubs.length > 2 && (
                    <div className="text-xs text-slate-400 px-2">
                      +{daySubs.length - 2} more
                    </div>
                  )}
                  {daySubs.length > 1 && (
                    <div className="text-xs font-semibold text-green-400 px-2 pt-1">
                      {formatCurrency(totalForDay)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}










