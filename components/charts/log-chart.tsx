'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface LogChartProps {
  logs: any[]
  title: string
  valueKey: string
  unit?: string
  color?: string
}

export function LogChart({ logs, title, valueKey, unit = '', color = 'blue' }: LogChartProps) {
  const chartData = useMemo(() => {
    return logs
      .filter(log => log.metadata?.[valueKey] || log.metadata?.value)
      .map(log => ({
        date: log.metadata?.date || log.metadata?.timestamp || log.createdAt,
        value: parseFloat(log.metadata?.[valueKey] || log.metadata?.value || 0),
        label: log.metadata?.displayValue || `${log.metadata?.value}${unit}`
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10) // Last 10 entries
  }, [logs, valueKey, unit])

  const stats = useMemo(() => {
    if (chartData.length === 0) return null
    
    const values = chartData.map(d => d.value)
    const latest = values[values.length - 1]
    const previous = values[values.length - 2]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const change = previous ? ((latest - previous) / previous) * 100 : 0
    
    return { latest, previous, min, max, avg, change }
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet. Start logging to see your progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.value))
  const minValue = Math.min(...chartData.map(d => d.value))
  const range = maxValue - minValue || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{title}</span>
          {stats && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold">{stats.latest.toFixed(1)}{unit}</span>
              {stats.change !== 0 && (
                <span className={stats.change > 0 ? 'text-green-600 flex items-center' : 'text-red-600 flex items-center'}>
                  {stats.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(stats.change).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Line Chart */}
        <div className="relative h-32 mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="400" y2="0" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
            
            {/* Line path */}
            <polyline
              fill="none"
              stroke={`var(--${color}-500, currentColor)`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartData.map((point, index) => {
                const x = (index / (chartData.length - 1 || 1)) * 400
                const y = 100 - ((point.value - minValue) / range) * 100
                return `${x},${y}`
              }).join(' ')}
            />
            
            {/* Area fill */}
            <polygon
              fill={`var(--${color}-500, currentColor)`}
              fillOpacity="0.1"
              points={`
                ${chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1 || 1)) * 400
                  const y = 100 - ((point.value - minValue) / range) * 100
                  return `${x},${y}`
                }).join(' ')}
                400,100 0,100
              `}
            />
            
            {/* Data points */}
            {chartData.map((point, index) => {
              const x = (index / (chartData.length - 1 || 1)) * 400
              const y = 100 - ((point.value - minValue) / range) * 100
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={`var(--${color}-500, currentColor)`}
                  className="cursor-pointer hover:r-4 transition-all"
                >
                  <title>{point.label} - {format(parseISO(point.date), 'MMM d, yyyy')}</title>
                </circle>
              )
            })}
          </svg>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Latest</div>
              <div className="font-bold">{stats.latest.toFixed(1)}{unit}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg</div>
              <div className="font-bold">{stats.avg.toFixed(1)}{unit}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Min</div>
              <div className="font-bold">{stats.min.toFixed(1)}{unit}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max</div>
              <div className="font-bold">{stats.max.toFixed(1)}{unit}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

























