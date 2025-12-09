'use client'

import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface RadarDataPoint {
  subject: string
  value: number
  fullMark?: number
  description?: string
}

interface LifeBalanceRadarProps {
  data: RadarDataPoint[]
  title: string
  description?: string
  color?: string
  showLegend?: boolean
  compareData?: RadarDataPoint[]
  compareColor?: string
  compareName?: string
}

export function LifeBalanceRadar({
  data,
  title,
  description,
  color = '#8b5cf6',
  showLegend = true,
  compareData,
  compareColor = '#10b981',
  compareName = 'Previous'
}: LifeBalanceRadarProps) {
  
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      subject: item.subject,
      current: item.value,
      fullMark: item.fullMark || 100,
      ...(compareData ? { previous: compareData[index]?.value || 0 } : {})
    }))
  }, [data, compareData])

  const maxValue = Math.max(
    ...data.map(d => d.fullMark || 100),
    ...(compareData?.map(d => d.fullMark || 100) || [])
  )

  // Calculate overall score
  const overallScore = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const maxTotal = data.reduce((sum, item) => sum + (item.fullMark || 100), 0)
    return Math.round((total / maxTotal) * 100)
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{data.subject}</p>
          <p className="text-muted-foreground">
            Current: <span className="font-medium text-foreground">{data.current}</span>/{data.fullMark}
          </p>
          {compareData && (
            <p className="text-muted-foreground">
              {compareName}: <span className="font-medium text-foreground">{data.previous}</span>/{data.fullMark}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color }}>
              {overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid 
              gridType="polygon"
              stroke="hsl(var(--border))"
            />
            <PolarAngleAxis 
              dataKey="subject"
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 11,
                fontWeight: 500
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90}
              domain={[0, maxValue]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {compareData && (
              <Radar
                name={compareName}
                dataKey="previous"
                stroke={compareColor}
                fill={compareColor}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ r: 3, fill: compareColor }}
              />
            )}
            
            <Radar
              name="Current"
              dataKey="current"
              stroke={color}
              fill={color}
              fillOpacity={0.4}
              strokeWidth={2}
              dot={{ r: 4, fill: color }}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
            
            {showLegend && <Legend />}
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          {data.slice(0, 3).map((item, index) => {
            const percentage = Math.round((item.value / (item.fullMark || 100)) * 100)
            const isGood = percentage >= 70
            const isMedium = percentage >= 40 && percentage < 70
            
            return (
              <div key={index} className="text-center">
                <div className={`text-sm font-medium ${
                  isGood ? 'text-green-600' : isMedium ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {percentage}%
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.subject}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Life balance preset categories
export const LIFE_BALANCE_CATEGORIES = [
  { subject: 'Health', key: 'health' },
  { subject: 'Fitness', key: 'fitness' },
  { subject: 'Finance', key: 'financial' },
  { subject: 'Career', key: 'career' },
  { subject: 'Relationships', key: 'relationships' },
  { subject: 'Education', key: 'education' },
  { subject: 'Mindfulness', key: 'mindfulness' },
  { subject: 'Recreation', key: 'hobbies' }
]




































