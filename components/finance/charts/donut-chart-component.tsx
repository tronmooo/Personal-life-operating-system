'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface DonutChartComponentProps {
  data: {
    name: string
    value: number
    color: string
  }[]
  height?: number
  innerRadius?: number
  outerRadius?: number
}

export function DonutChartComponent({ 
  data, 
  height = 300,
  innerRadius = 60,
  outerRadius = 100
}: DonutChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
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
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry: any) => {
            const item = data.find(d => d.name === value)
            if (item) {
              const total = data.reduce((sum, d) => sum + d.value, 0)
              const percent = ((item.value / total) * 100).toFixed(1)
              return `${value} (${percent}%)`
            }
            return value
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

