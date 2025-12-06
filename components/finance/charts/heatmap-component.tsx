'use client'

import { cn } from '@/lib/utils'

interface HeatmapData {
  date: string
  amount: number
  day: string
}

interface HeatmapComponentProps {
  data: HeatmapData[]
  maxAmount?: number
}

export function HeatmapComponent({ data, maxAmount }: HeatmapComponentProps) {
  const max = maxAmount || Math.max(...data.map(d => d.amount))
  
  const getIntensityClass = (amount: number) => {
    if (amount === 0) return 'bg-muted'
    const intensity = (amount / max) * 100
    if (intensity < 20) return 'bg-blue-200 dark:bg-blue-900'
    if (intensity < 40) return 'bg-blue-300 dark:bg-blue-800'
    if (intensity < 60) return 'bg-blue-400 dark:bg-blue-700'
    if (intensity < 80) return 'bg-blue-500 dark:bg-blue-600'
    return 'bg-blue-600 dark:bg-blue-500'
  }
  
  // Group by week
  const weeks: HeatmapData[][] = []
  let currentWeek: HeatmapData[] = []
  
  data.forEach((item, index) => {
    currentWeek.push(item)
    if (item.day === 'Sat' || index === data.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-1 min-w-full">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const date = new Date(day.date)
                const dayNum = date.getDate()
                
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'w-12 h-12 rounded flex items-center justify-center text-xs font-medium transition-colors',
                      getIntensityClass(day.amount),
                      'hover:ring-2 hover:ring-primary cursor-pointer'
                    )}
                    title={`${day.date}: $${day.amount.toLocaleString()}`}
                  >
                    {dayNum}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />
          <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-800" />
          <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-700" />
          <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600" />
          <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

