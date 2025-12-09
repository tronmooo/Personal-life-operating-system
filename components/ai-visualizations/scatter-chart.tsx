'use client'

import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScatterDataPoint {
  x: number
  y: number
  label?: string
  date?: string
  size?: number
}

interface CorrelationScatterProps {
  data: ScatterDataPoint[]
  title: string
  description?: string
  xLabel: string
  yLabel: string
  correlation?: number
  color?: string
  showTrendLine?: boolean
  insight?: string
}

export function CorrelationScatter({
  data,
  title,
  description,
  xLabel,
  yLabel,
  correlation,
  color = '#8b5cf6',
  showTrendLine = true,
  insight
}: CorrelationScatterProps) {
  
  // Calculate linear regression for trend line
  const trendLine = useMemo(() => {
    if (!showTrendLine || data.length < 2) return null
    
    const n = data.length
    const sumX = data.reduce((sum, d) => sum + d.x, 0)
    const sumY = data.reduce((sum, d) => sum + d.y, 0)
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0)
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const minX = Math.min(...data.map(d => d.x))
    const maxX = Math.max(...data.map(d => d.x))
    
    return {
      slope,
      intercept,
      startPoint: { x: minX, y: slope * minX + intercept },
      endPoint: { x: maxX, y: slope * maxX + intercept }
    }
  }, [data, showTrendLine])

  const correlationStrength = useMemo(() => {
    if (correlation === undefined) return null
    const abs = Math.abs(correlation)
    if (abs >= 0.7) return { label: 'Strong', color: 'bg-green-500' }
    if (abs >= 0.4) return { label: 'Moderate', color: 'bg-amber-500' }
    if (abs >= 0.2) return { label: 'Weak', color: 'bg-orange-500' }
    return { label: 'None', color: 'bg-gray-500' }
  }, [correlation])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          {point.label && <p className="font-medium mb-1">{point.label}</p>}
          {point.date && <p className="text-muted-foreground text-xs mb-1">{point.date}</p>}
          <p><span className="text-muted-foreground">{xLabel}:</span> {point.x}</p>
          <p><span className="text-muted-foreground">{yLabel}:</span> {point.y}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {correlation !== undefined && correlationStrength && (
            <div className="text-right">
              <Badge className={correlationStrength.color}>
                {correlationStrength.label} {correlation > 0 ? '↗' : '↘'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                r = {correlation.toFixed(3)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={xLabel}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              label={{ 
                value: xLabel, 
                position: 'insideBottom', 
                offset: -10,
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12
              }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={yLabel}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              label={{ 
                value: yLabel, 
                angle: -90, 
                position: 'insideLeft',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12
              }}
            />
            <ZAxis type="number" dataKey="size" range={[50, 200]} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Trend line */}
            {trendLine && (
              <ReferenceLine
                segment={[
                  { x: trendLine.startPoint.x, y: trendLine.startPoint.y },
                  { x: trendLine.endPoint.x, y: trendLine.endPoint.y }
                ]}
                stroke={color}
                strokeDasharray="5 5"
                strokeOpacity={0.6}
              />
            )}
            
            <Scatter 
              name={`${xLabel} vs ${yLabel}`}
              data={data} 
              fill={color}
              fillOpacity={0.7}
              stroke={color}
              strokeWidth={1}
            />
            
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Insight */}
        {insight && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 Insight:</span> {insight}
            </p>
          </div>
        )}
        
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
          <div>
            <div className="text-lg font-semibold">{data.length}</div>
            <div className="text-xs text-muted-foreground">Data Points</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {correlation !== undefined ? (correlation > 0 ? 'Positive' : 'Negative') : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Direction</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {correlation !== undefined ? `${Math.round(Math.abs(correlation) * 100)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Strength</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

































