'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import { format, parseISO } from 'date-fns'

interface TrendChartProps {
  data: Array<{ date: string; value: number }>
  metric: string
  targetValue?: number
  color?: string
  showArea?: boolean
  description?: string
}

export function TrendChart({ 
  data, 
  metric, 
  targetValue, 
  color = '#8b5cf6',
  showArea = true,
  description 
}: TrendChartProps) {
  const trendAnalysis = useMemo(() => {
    if (data.length < 2) return null

    const firstValue = data[0].value
    const lastValue = data[data.length - 1].value
    const change = lastValue - firstValue
    const changePercent = ((change / firstValue) * 100).toFixed(1)
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

    // Calculate average
    const average = data.reduce((sum, d) => sum + d.value, 0) / data.length

    // Find peak and low
    const peak = Math.max(...data.map(d => d.value))
    const low = Math.min(...data.map(d => d.value))

    return {
      change,
      changePercent,
      trend,
      average: average.toFixed(1),
      peak,
      low,
      current: lastValue,
    }
  }, [data])

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      displayDate: format(parseISO(d.date), 'MMM d'),
      target: targetValue,
    }))
  }, [data, targetValue])

  const getTrendIcon = () => {
    if (!trendAnalysis) return null
    switch (trendAnalysis.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    if (!trendAnalysis) return 'secondary'
    return trendAnalysis.trend === 'up' ? 'default' : 
           trendAnalysis.trend === 'down' ? 'destructive' : 'secondary'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{metric}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {trendAnalysis && (
            <Badge variant={getTrendColor()} className="flex items-center gap-1">
              {getTrendIcon()}
              {trendAnalysis.changePercent}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No historical data available</p>
          </div>
        ) : (
          <>
            {/* Key Stats */}
            {trendAnalysis && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-2xl font-bold">{trendAnalysis.current}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{trendAnalysis.average}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peak</p>
                  <p className="text-2xl font-bold">{trendAnalysis.peak}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-2xl font-bold">{trendAnalysis.low}</p>
                </div>
              </div>
            )}

            {/* Chart */}
            <ResponsiveContainer width="100%" height={200}>
              {showArea ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`colorValue-${metric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#colorValue-${metric})`}
                  />
                  {targetValue && (
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  )}
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 4 }}
                  />
                  {targetValue && (
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>

            {/* Insights */}
            {trendAnalysis && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                <p className="text-sm">
                  {trendAnalysis.trend === 'up' && (
                    <>
                      📈 <strong>Great progress!</strong> Your {metric.toLowerCase()} improved by{' '}
                      <strong>{Math.abs(parseFloat(trendAnalysis.changePercent))}%</strong> over this period.
                    </>
                  )}
                  {trendAnalysis.trend === 'down' && (
                    <>
                      📉 Your {metric.toLowerCase()} decreased by{' '}
                      <strong>{Math.abs(parseFloat(trendAnalysis.changePercent))}%</strong>. Consider reviewing your activity.
                    </>
                  )}
                  {trendAnalysis.trend === 'stable' && (
                    <>
                      ➡️ Your {metric.toLowerCase()} has remained stable at around{' '}
                      <strong>{trendAnalysis.average}</strong>.
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}





