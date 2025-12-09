'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface MetricComparisonCardProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  currentValue: number
  previousValue: number
  format?: 'number' | 'currency' | 'percentage'
  period?: string
  color?: string
}

export function MetricComparisonCard({
  title,
  icon: Icon,
  currentValue,
  previousValue,
  format = 'number',
  period = 'vs last month',
  color = 'purple',
}: MetricComparisonCardProps) {
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100) : 0
  const isPositive = change > 0
  const isNegative = change < 0

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString()
    }
  }

  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600',
    green: 'bg-green-50 dark:bg-green-950 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-600',
    red: 'bg-red-50 dark:bg-red-950 text-red-600',
  }

  return (
    <Card className="card-hover-effect">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Current Value */}
          <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
            <p className="text-xs opacity-80 mb-1">Current</p>
            <p className="text-3xl font-bold">{formatValue(currentValue)}</p>
          </div>

          {/* Comparison */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{formatValue(previousValue)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{formatValue(currentValue)}</span>
            </div>
            <Badge
              variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isPositive && '+'}
              {changePercent.toFixed(1)}%
            </Badge>
          </div>

          {/* Change Amount */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">{period}</p>
            <p className={`text-lg font-semibold ${
              isPositive ? 'text-green-600' : 
              isNegative ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {isPositive && '+'}
              {formatValue(Math.abs(change))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}




