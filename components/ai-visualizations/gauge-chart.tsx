'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface GaugeChartProps {
  value: number
  maxValue?: number
  minValue?: number
  title: string
  description?: string
  unit?: string
  thresholds?: {
    low: number
    medium: number
    high: number
  }
  colors?: {
    low: string
    medium: string
    high: string
    background: string
  }
  size?: 'sm' | 'md' | 'lg'
  showTarget?: boolean
  targetValue?: number
}

export function GaugeChart({
  value,
  maxValue = 100,
  minValue = 0,
  title,
  description,
  unit = '',
  thresholds = { low: 33, medium: 66, high: 100 },
  colors = {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#22c55e',
    background: 'hsl(var(--muted))'
  },
  size = 'md',
  showTarget = false,
  targetValue
}: GaugeChartProps) {
  
  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm': return { width: 150, height: 100, strokeWidth: 12, fontSize: 20 }
      case 'lg': return { width: 300, height: 180, strokeWidth: 20, fontSize: 36 }
      default: return { width: 220, height: 130, strokeWidth: 16, fontSize: 28 }
    }
  }, [size])

  const { percentage, displayValue, color, status } = useMemo(() => {
    const range = maxValue - minValue
    const normalizedValue = Math.max(minValue, Math.min(maxValue, value))
    const pct = ((normalizedValue - minValue) / range) * 100
    
    let col: string
    let stat: string
    
    if (pct <= thresholds.low) {
      col = colors.low
      stat = 'Low'
    } else if (pct <= thresholds.medium) {
      col = colors.medium
      stat = 'Medium'
    } else {
      col = colors.high
      stat = 'High'
    }
    
    return {
      percentage: pct,
      displayValue: normalizedValue,
      color: col,
      status: stat
    }
  }, [value, maxValue, minValue, thresholds, colors])

  // SVG arc calculations
  const { width, height, strokeWidth, fontSize } = dimensions
  const centerX = width / 2
  const centerY = height - 10
  const radius = height - strokeWidth - 10
  
  // Arc goes from -180 to 0 degrees (bottom half of circle)
  const startAngle = -180
  const endAngle = 0
  const angleRange = endAngle - startAngle
  
  const polarToCartesian = (angle: number) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian)
    }
  }
  
  const createArc = (startDeg: number, endDeg: number) => {
    const start = polarToCartesian(startDeg)
    const end = polarToCartesian(endDeg)
    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
  }
  
  // Calculate the angle for current value
  const valueAngle = startAngle + (percentage / 100) * angleRange
  
  // Target indicator angle
  const targetAngle = targetValue !== undefined
    ? startAngle + (((targetValue - minValue) / (maxValue - minValue)) * 100 / 100) * angleRange
    : null

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={createArc(startAngle, endAngle)}
            fill="none"
            stroke={colors.background}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Value arc */}
          <path
            d={createArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-out'
            }}
          />
          
          {/* Target indicator */}
          {showTarget && targetAngle !== null && (
            <>
              <circle
                cx={polarToCartesian(targetAngle).x}
                cy={polarToCartesian(targetAngle).y}
                r={strokeWidth / 2 + 2}
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth={2}
              />
              <text
                x={polarToCartesian(targetAngle).x}
                y={polarToCartesian(targetAngle).y - strokeWidth - 10}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                Target
              </text>
            </>
          )}
          
          {/* Value text */}
          <text
            x={centerX}
            y={centerY - 15}
            textAnchor="middle"
            className="font-bold"
            style={{ fontSize, fill: color }}
          >
            {displayValue.toLocaleString()}{unit}
          </text>
          
          {/* Status text */}
          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {status}
          </text>
          
          {/* Min/Max labels */}
          <text
            x={polarToCartesian(startAngle).x + 5}
            y={centerY + 5}
            textAnchor="start"
            className="text-[10px] fill-muted-foreground"
          >
            {minValue}
          </text>
          <text
            x={polarToCartesian(endAngle).x - 5}
            y={centerY + 5}
            textAnchor="end"
            className="text-[10px] fill-muted-foreground"
          >
            {maxValue}
          </text>
        </svg>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" style={{ width: width - 40 }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: color
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
        
        {/* Target comparison */}
        {showTarget && targetValue !== undefined && (
          <div className="text-xs text-muted-foreground mt-2">
            {value >= targetValue ? (
              <span className="text-green-600">✓ Target reached!</span>
            ) : (
              <span>{(targetValue - value).toLocaleString()}{unit} to go</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Progress gauge for goal tracking
interface GoalProgressGaugeProps {
  current: number
  target: number
  title: string
  unit?: string
}

export function GoalProgressGauge({ current, target, title, unit = '' }: GoalProgressGaugeProps) {
  const percentage = Math.min((current / target) * 100, 100)
  
  return (
    <GaugeChart
      value={percentage}
      maxValue={100}
      title={title}
      description={`${current.toLocaleString()}${unit} of ${target.toLocaleString()}${unit}`}
      unit="%"
      thresholds={{ low: 25, medium: 75, high: 100 }}
      colors={{
        low: '#ef4444',
        medium: '#f59e0b',
        high: '#22c55e',
        background: 'hsl(var(--muted))'
      }}
      showTarget={true}
      targetValue={100}
    />
  )
}































