'use client'

import { useMemo } from 'react'
import { LogChartRenderer } from './log-chart-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NutritionLogChartsProps {
  logs: any[]
  selectedLogType?: string
}

export function NutritionLogCharts({ logs, selectedLogType }: NutritionLogChartsProps) {
  // Filter logs by selectedLogType
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const { dailyCalories, macroDistribution, mealTypes, waterIntake } = useMemo(() => {
    const meals = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'meal' || type === 'food'
    })
    const water = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'water' || type === 'hydration'
    })

    // Daily calories
    const caloriesByDate: Record<string, number> = {}
    meals.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      caloriesByDate[date] = (caloriesByDate[date] || 0) + parseFloat(data.calories || data.value || 0)
    })

    const dailyCalories = Object.entries(caloriesByDate)
      .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Macro distribution
    let totalProtein = 0, totalCarbs = 0, totalFat = 0
    meals.forEach(log => {
      const data = log.data || log.metadata || {}
      totalProtein += parseFloat(data.protein || 0)
      totalCarbs += parseFloat(data.carbs || 0)
      totalFat += parseFloat(data.fat || 0)
    })

    const macroDistribution = [
      { name: 'Protein', value: Math.round(totalProtein) },
      { name: 'Carbs', value: Math.round(totalCarbs) },
      { name: 'Fat', value: Math.round(totalFat) }
    ].filter(m => m.value > 0)

    // Meal types
    const mealCounts: Record<string, number> = {}
    meals.forEach(log => {
      const data = log.data || log.metadata || {}
      const type = data.meal_type || 'Other'
      mealCounts[type] = (mealCounts[type] || 0) + 1
    })

    const mealTypes = Object.entries(mealCounts).map(([type, count]) => ({
      type,
      count
    }))

    // Water intake
    const waterByDate: Record<string, number> = {}
    water.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      waterByDate[date] = (waterByDate[date] || 0) + parseFloat(data.amount || data.value || 0)
    })

    const waterIntake = Object.entries(waterByDate)
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { dailyCalories, macroDistribution, mealTypes, waterIntake }
  }, [filteredLogs])

  // If selectedLogType, show ONLY that chart
  if (selectedLogType) {
    if (selectedLogType === 'meal' || selectedLogType === 'food') {
      return (
        <>
          <LogChartRenderer
            data={dailyCalories}
            chartType="bar"
            xKey="date"
            yKey="calories"
            title="Daily Calorie Intake"
            description="Track your calories over time"
            valueSuffix=" cal"
          />
          <div className="mt-4">
            <LogChartRenderer
              data={macroDistribution}
              chartType="pie"
              xKey="name"
              yKey="value"
              title="Macro Distribution"
              description="Protein, Carbs, and Fat breakdown"
              valueSuffix="g"
            />
          </div>
        </>
      )
    }

    if (selectedLogType === 'water' || selectedLogType === 'hydration') {
      return (
        <LogChartRenderer
          data={waterIntake}
          chartType="bar"
          xKey="date"
          yKey="amount"
          title="Water Intake"
          description="Daily hydration tracking"
          valueSuffix=" oz"
        />
      )
    }

    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No visualization available for this log type yet.</p>
        <p className="text-sm mt-2">Keep logging to see your progress!</p>
      </div>
    )
  }

  // Show all charts with tabs
  return (
    <div className="space-y-6">
      <Tabs defaultValue="calories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calories">Calories</TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
        </TabsList>

        <TabsContent value="calories" className="space-y-4 mt-4">
          <LogChartRenderer
            data={dailyCalories}
            chartType="bar"
            xKey="date"
            yKey="calories"
            title="Daily Calorie Intake"
            description="Track your calorie consumption over time"
            valueSuffix=" cal"
          />
        </TabsContent>

        <TabsContent value="macros" className="space-y-4 mt-4">
          <LogChartRenderer
            data={macroDistribution}
            chartType="pie"
            xKey="name"
            yKey="value"
            title="Macronutrient Distribution"
            description="Breakdown of protein, carbs, and fat"
            valueSuffix="g"
          />
        </TabsContent>

        <TabsContent value="meals" className="space-y-4 mt-4">
          <LogChartRenderer
            data={mealTypes}
            chartType="bar"
            xKey="type"
            yKey="count"
            title="Meal Type Distribution"
            description="Frequency of breakfast, lunch, dinner, and snacks"
          />
          <LogChartRenderer
            data={waterIntake}
            chartType="line"
            xKey="date"
            yKey="amount"
            title="Water Intake Trend"
            valueSuffix=" oz"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

