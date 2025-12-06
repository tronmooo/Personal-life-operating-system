'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { DomainData } from '@/types/domains'

interface DomainVisualizationsProps {
  items: DomainData[]
  domainName: string
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140']

export function DomainVisualizations({ items, domainName }: DomainVisualizationsProps) {
  if (items.length === 0) {
    return null
  }

  // Activity over time (last 30 days)
  const getLast30Days = () => {
    const days = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return days
  }

  const last30Days = getLast30Days()
  const activityData = last30Days.map(day => ({
    date: day.label,
    count: items.filter(item => item.createdAt.split('T')[0] === day.date).length,
  }))

  // Category distribution (from metadata if available)
  const categoryData = items.reduce((acc: Record<string, number>, item) => {
    const category = String(item.metadata?.category || item.metadata?.type || 'Other')
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }))

  // Recent trend (last 7 days vs previous 7 days)
  const getWeekData = (offset: number) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (7 + offset))
    const endDate = new Date(today)
    endDate.setDate(today.getDate() - offset)
    
    return items.filter(item => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= startDate && itemDate < endDate
    }).length
  }

  const thisWeek = getWeekData(0)
  const lastWeek = getWeekData(7)
  const percentChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : 0
  const isIncreasing = Number(percentChange) > 0

  // Monthly totals
  const monthlyData = items.reduce((acc: Record<string, number>, item) => {
    const month = new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  const monthlyChartData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    count,
  }))

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{items.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {thisWeek}
              {isIncreasing ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </CardTitle>
            <p className={`text-xs ${isIncreasing ? 'text-green-600' : 'text-red-600'}`}>
              {isIncreasing ? '+' : ''}{percentChange}% from last week
            </p>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Updated</CardDescription>
            <CardTitle className="text-lg">
              {new Date(items[items.length - 1]?.updatedAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Last 30 Days
            </CardTitle>
            <CardDescription>Number of items added over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  dot={{ fill: '#667eea', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Distribution</CardTitle>
            <CardDescription>Items added per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        {pieData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}








