'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns'
import { useState } from 'react'

interface DomainActivity {
  date: string
  domain: string
  count: number
}

interface DomainHeatmapProps {
  activities: DomainActivity[]
  selectedDomain?: string
  onDomainSelect?: (domain: string) => void
}

export function DomainHeatmap({ activities, selectedDomain, onDomainSelect }: DomainHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Get all unique domains
  const domains = Array.from(new Set(activities.map(a => a.domain)))
  const activeDomain = selectedDomain || domains[0]

  // Filter activities for selected domain
  const domainActivities = activities.filter(a => a.domain === activeDomain)

  // Get activity count by date
  const activityMap = new Map<string, number>()
  domainActivities.forEach(activity => {
    const dateKey = activity.date.split('T')[0]
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + activity.count)
  })

  // Get max activity for color scaling
  const maxActivity = Math.max(...Array.from(activityMap.values()), 1)

  // Generate days for the selected month
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Calculate stats
  const totalActivity = domainActivities.reduce((sum, a) => sum + a.count, 0)
  const activeDays = new Set(domainActivities.map(a => a.date.split('T')[0])).size
  const avgPerActiveDay = activeDays > 0 ? totalActivity / activeDays : 0

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    const intensity = Math.min((count / maxActivity) * 100, 100)
    
    if (intensity > 75) return 'bg-purple-600 dark:bg-purple-500'
    if (intensity > 50) return 'bg-purple-500 dark:bg-purple-400'
    if (intensity > 25) return 'bg-purple-400 dark:bg-purple-300'
    return 'bg-purple-300 dark:bg-purple-200'
  }

  const getActivityLabel = (count: number) => {
    if (count === 0) return 'No activity'
    if (count === 1) return '1 entry'
    return `${count} entries`
  }

  // Get day of week headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              Domain Activity Heatmap
            </CardTitle>
            <CardDescription>Daily activity patterns across domains</CardDescription>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
              className="px-3 py-1 rounded hover:bg-secondary transition-colors"
            >
              ←
            </button>
            <span className="font-semibold min-w-[120px] text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setSelectedMonth(prev => subMonths(prev, -1))}
              className="px-3 py-1 rounded hover:bg-secondary transition-colors"
              disabled={selectedMonth >= new Date()}
            >
              →
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selector */}
        <div className="flex flex-wrap gap-2">
          {domains.map(domain => (
            <Badge
              key={domain}
              variant={activeDomain === domain ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onDomainSelect?.(domain)}
            >
              {domain}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total Activity</p>
            <p className="text-2xl font-bold">{totalActivity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Days</p>
            <p className="text-2xl font-bold">{activeDays}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
            <p className="text-2xl font-bold">{avgPerActiveDay.toFixed(1)}</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-xs text-center text-muted-foreground font-medium mb-2">
            {dayHeaders.map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Days */}
            {days.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const count = activityMap.get(dateKey) || 0
              const isHovered = hoveredDay === dateKey
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={dateKey}
                  className={`
                    relative aspect-square rounded-md transition-all cursor-pointer
                    ${getActivityColor(count)}
                    ${isHovered ? 'ring-2 ring-purple-600 scale-110 z-10' : ''}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    hover:scale-110 hover:z-10
                  `}
                  onMouseEnter={() => setHoveredDay(dateKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day Number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                      <div className="font-semibold">{format(day, 'MMM d, yyyy')}</div>
                      <div>{getActivityLabel(count)}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Less activity</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="w-4 h-4 rounded bg-purple-300 dark:bg-purple-200" />
            <div className="w-4 h-4 rounded bg-purple-400 dark:bg-purple-300" />
            <div className="w-4 h-4 rounded bg-purple-500 dark:bg-purple-400" />
            <div className="w-4 h-4 rounded bg-purple-600 dark:bg-purple-500" />
          </div>
          <span>More activity</span>
        </div>

        {/* Insights */}
        <div className="p-3 rounded-lg bg-secondary/50 text-sm">
          {activeDays === 0 ? (
            <p>No activity recorded this month for {activeDomain}</p>
          ) : (
            <div className="space-y-1">
              <p>
                📊 You logged <strong>{totalActivity} entries</strong> across{' '}
                <strong>{activeDays} days</strong> this month
              </p>
              {avgPerActiveDay > 1 && (
                <p>
                  🔥 Average of <strong>{avgPerActiveDay.toFixed(1)} entries per active day</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}






