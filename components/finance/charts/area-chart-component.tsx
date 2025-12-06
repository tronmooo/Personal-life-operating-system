'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AreaChartComponentProps {
  data: any[]
  xKey: string
  areas: {
    key: string
    name: string
    color: string
  }[]
  height?: number
  yAxisLabel?: string
  stacked?: boolean
}

export function AreaChartComponent({ 
  data, 
  xKey, 
  areas, 
  height = 300,
  yAxisLabel,
  stacked = false
}: AreaChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          {areas.map((area, index) => (
            <linearGradient key={area.key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={area.color} stopOpacity={0.1}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey={xKey} 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: any) => {
            if (typeof value === 'number') {
              return `$${value.toLocaleString()}`
            }
            return value
          }}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.name}
            stroke={area.color}
            fill={`url(#gradient-${index})`}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

