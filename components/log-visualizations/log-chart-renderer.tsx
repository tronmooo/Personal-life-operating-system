'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLORS = [
  '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
  '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

interface LogChartRendererProps {
  data: any[]
  chartType: 'line' | 'bar' | 'pie' | 'area'
  xKey: string
  yKey: string | string[]
  title: string
  description?: string
  valuePrefix?: string
  valueSuffix?: string
  colors?: string[]
}

export function LogChartRenderer({
  data,
  chartType,
  xKey,
  yKey,
  title,
  description,
  valuePrefix = '',
  valueSuffix = '',
  colors = COLORS
}: LogChartRendererProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Ensure data is properly formatted
    return data.map(item => ({
      ...item,
      [xKey]: item[xKey]?.toString() || ''
    }))
  }, [data, xKey])

  const exportChart = () => {
    // Simple export functionality - could be enhanced with canvas export
    const dataStr = JSON.stringify(processedData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!processedData || processedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No data available yet</p>
          <p className="text-xs text-muted-foreground mt-2">Start logging to see visualizations</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Button variant="outline" size="sm" onClick={exportChart}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `${valuePrefix}${value}${valueSuffix}`}
              />
              <Legend />
              {Array.isArray(yKey) ? (
                yKey.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `${valuePrefix}${value}${valueSuffix}`}
              />
              <Legend />
              {Array.isArray(yKey) ? (
                yKey.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                  />
                ))
              ) : (
                <Bar dataKey={yKey} fill={colors[0]} />
              )}
            </BarChart>
          ) : chartType === 'area' ? (
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `${valuePrefix}${value}${valueSuffix}`}
              />
              <Legend />
              {Array.isArray(yKey) ? (
                yKey.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    stroke={colors[index % colors.length]}
                    fillOpacity={0.6}
                  />
                ))
              ) : (
                <Area
                  type="monotone"
                  dataKey={yKey}
                  fill={colors[0]}
                  stroke={colors[0]}
                  fillOpacity={0.6}
                />
              )}
            </AreaChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={processedData}
                dataKey={Array.isArray(yKey) ? yKey[0] : yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry[xKey]}: ${valuePrefix}${entry[Array.isArray(yKey) ? yKey[0] : yKey]}${valueSuffix}`}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${valuePrefix}${value}${valueSuffix}`}
              />
            </PieChart>
          ) : <></>}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}







