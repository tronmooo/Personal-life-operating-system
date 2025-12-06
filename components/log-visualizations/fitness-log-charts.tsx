'use client'

import { useMemo } from 'react'
import { LogChartRenderer } from './log-chart-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FitnessLogChartsProps {
  logs: any[]
  selectedLogType?: string
}

export function FitnessLogCharts({ logs, selectedLogType }: FitnessLogChartsProps) {
  // Filter logs by selectedLogType
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const { workoutLogs, stepsLogs, workoutTypes, caloriesBurned } = useMemo(() => {
    const workouts = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'workout' || type === 'exercise'
    })
    const steps = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'steps' || type === 'activity'
    })

    // Workout duration by date
    const workoutLogs = workouts
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          duration: parseFloat(data.duration || data.value || 0),
          type: data.workout_type || data.type,
          calories: parseFloat(data.calories || 0)
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Steps by date
    const stepsLogs = steps
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          steps: parseInt(data.steps || data.value || 0),
          distance: parseFloat(data.distance || 0)
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Workout type distribution
    const typeCounts: Record<string, { count: number, totalDuration: number }> = {}
    workouts.forEach(log => {
      const data = log.data || log.metadata || {}
      const type = data.workout_type || data.type || 'Other'
      if (!typeCounts[type]) {
        typeCounts[type] = { count: 0, totalDuration: 0 }
      }
      typeCounts[type].count++
      typeCounts[type].totalDuration += parseFloat(data.duration || data.value || 0)
    })

    const workoutTypes = Object.entries(typeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      totalDuration: Math.round(data.totalDuration)
    }))

    // Calories burned by date
    const caloriesByDate: Record<string, number> = {}
    workouts.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      caloriesByDate[date] = (caloriesByDate[date] || 0) + parseFloat(data.calories || 0)
    })

    const caloriesBurned = Object.entries(caloriesByDate)
      .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { workoutLogs, stepsLogs, workoutTypes, caloriesBurned }
  }, [filteredLogs])

  // If selectedLogType, show ONLY that chart
  if (selectedLogType) {
    if (selectedLogType === 'workout' || selectedLogType === 'exercise') {
      return (
        <>
          <LogChartRenderer
            data={workoutLogs}
            chartType="bar"
            xKey="date"
            yKey="duration"
            title="Workout Duration"
            description="Track your exercise time"
            valueSuffix=" min"
          />
          <div className="mt-4">
            <LogChartRenderer
              data={workoutTypes}
              chartType="pie"
              xKey="type"
              yKey="count"
              title="Workout Types"
              description="Distribution of workout types"
            />
          </div>
        </>
      )
    }

    if (selectedLogType === 'steps' || selectedLogType === 'activity') {
      return (
        <LogChartRenderer
          data={stepsLogs}
          chartType="bar"
          xKey="date"
          yKey="steps"
          title="Daily Steps"
          description="Track your daily step count"
          valueSuffix=" steps"
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
      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-4 mt-4">
          <LogChartRenderer
            data={workoutLogs}
            chartType="bar"
            xKey="date"
            yKey="duration"
            title="Workout Duration"
            description="Track your exercise time over time"
            valueSuffix=" min"
          />
          {caloriesBurned.length > 0 && (
            <LogChartRenderer
              data={caloriesBurned}
              chartType="line"
              xKey="date"
              yKey="calories"
              title="Calories Burned"
              valueSuffix=" cal"
            />
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-4 mt-4">
          <LogChartRenderer
            data={stepsLogs}
            chartType="bar"
            xKey="date"
            yKey="steps"
            title="Daily Steps"
            description="Your daily step count"
            valueSuffix=" steps"
          />
          {stepsLogs.some(log => log.distance > 0) && (
            <LogChartRenderer
              data={stepsLogs}
              chartType="line"
              xKey="date"
              yKey="distance"
              title="Distance Covered"
              description="Track your distance over time"
              valueSuffix=" mi"
            />
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4 mt-4">
          <LogChartRenderer
            data={workoutTypes}
            chartType="pie"
            xKey="type"
            yKey="count"
            title="Workout Type Distribution"
            description="Frequency of different workout types"
          />
          <LogChartRenderer
            data={workoutTypes}
            chartType="bar"
            xKey="type"
            yKey="totalDuration"
            title="Total Duration by Type"
            valueSuffix=" min"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

