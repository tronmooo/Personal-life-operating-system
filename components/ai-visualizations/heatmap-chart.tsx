'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HeatmapData {
  day: string | number
  hour: number
  value: number
  label?: string
}

interface HeatmapChartProps {
  data: HeatmapData[]
  title: string
  description?: string
  colorScale?: string[]
  showLegend?: boolean
  valueLabel?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function HeatmapChart({ 
  data, 
  title, 
  description,
  colorScale = ['#f0fdf4', '#86efac', '#22c55e', '#15803d'],
  showLegend = true,
  valueLabel = 'activities'
}: HeatmapChartProps) {
  
  const { maxValue, normalizedData } = useMemo(() => {
    const max = Math.max(...data.map(d => d.value), 1)
    const normalized = new Map<string, HeatmapData>()
    
    data.forEach(d => {
      const dayIndex = typeof d.day === 'string' 
        ? DAYS.findIndex(day => day.toLowerCase().startsWith(d.day.toString().toLowerCase()))
        : d.day
      const key = `${dayIndex}-${d.hour}`
      normalized.set(key, { ...d, day: dayIndex })
    })
    
    return { maxValue: max, normalizedData: normalized }
  }, [data])

  const getColor = (value: number): string => {
    if (value === 0) return colorScale[0]
    const intensity = value / maxValue
    const index = Math.min(Math.floor(intensity * (colorScale.length - 1)) + 1, colorScale.length - 1)
    return colorScale[index]
  }

  const getOpacity = (value: number): number => {
    if (value === 0) return 0.3
    return 0.4 + (value / maxValue) * 0.6
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hours header */}
              <div className="flex mb-1">
                <div className="w-12" /> {/* Spacer for day labels */}
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {hour % 4 === 0 ? `${hour}:00` : ''}
                  </div>
                ))}
              </div>
              
              {/* Grid */}
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-0.5">
                  <div className="w-12 text-xs text-muted-foreground font-medium pr-2 text-right">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-0.5">
                    {HOURS.map(hour => {
                      const cell = normalizedData.get(`${dayIndex}-${hour}`)
                      const value = cell?.value || 0
                      
                      return (
                        <Tooltip key={`${day}-${hour}`}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex-1 aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110 hover:z-10 min-w-[12px]"
                              style={{ 
                                backgroundColor: getColor(value),
                                opacity: getOpacity(value)
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{day} {hour}:00 - {hour + 1}:00</p>
                            <p className="text-muted-foreground">
                              {value} {valueLabel}
                            </p>
                            {cell?.label && <p className="text-muted-foreground">{cell.label}</p>}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {/* Legend */}
              {showLegend && (
                <div className="flex items-center justify-end mt-4 gap-2">
                  <span className="text-xs text-muted-foreground">Less</span>
                  <div className="flex gap-0.5">
                    {colorScale.map((color, i) => (
                      <div 
                        key={i}
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: color, opacity: 0.3 + (i / colorScale.length) * 0.7 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">More</span>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

// Preset color schemes
export const HEATMAP_COLORS = {
  green: ['#f0fdf4', '#86efac', '#22c55e', '#15803d'],
  blue: ['#eff6ff', '#93c5fd', '#3b82f6', '#1d4ed8'],
  purple: ['#faf5ff', '#c4b5fd', '#8b5cf6', '#6d28d9'],
  orange: ['#fff7ed', '#fdba74', '#f97316', '#c2410c'],
  red: ['#fef2f2', '#fca5a5', '#ef4444', '#b91c1c'],
  multi: ['#f0fdf4', '#86efac', '#fbbf24', '#ef4444'],
}































