'use client'

import { useMemo } from 'react'
import { LogChartRenderer } from './log-chart-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PetLogChartsProps {
  logs: any[]
  selectedPet?: string
  selectedLogType?: string
}

export function PetLogCharts({ logs, selectedPet, selectedLogType }: PetLogChartsProps) {
  // First filter by pet, then by log type
  const filteredLogs = useMemo(() => {
    let filtered = logs

    // Filter by selected pet
    if (selectedPet) {
      filtered = filtered.filter(log => {
        const data = log.data || log.metadata || {}
        return data.pet_name === selectedPet || data.petName === selectedPet
      })
    }

    // Filter by log type
    if (selectedLogType) {
      filtered = filtered.filter(log => {
        const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
        return logType === selectedLogType
      })
    }

    return filtered
  }, [logs, selectedPet, selectedLogType])

  const { weightLogs, feedingPattern, vetCosts, feedingTimes } = useMemo(() => {
    const weightLogs = filteredLogs
      .filter(log => {
        const type = log.type || log.metadata?.logType
        return type === 'weight_check' || type === 'weight'
      })
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          weight: parseFloat(data.weight || data.value || 0)
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Feeding pattern by food type
    const feedingCounts: Record<string, number> = {}
    filteredLogs
      .filter(log => {
        const type = log.type || log.metadata?.logType
        return type === 'feeding' || type === 'meal'
      })
      .forEach(log => {
        const data = log.data || log.metadata || {}
        const type = data.food_type || data.type || 'Unknown'
        feedingCounts[type] = (feedingCounts[type] || 0) + 1
      })

    const feedingPattern = Object.entries(feedingCounts).map(([type, count]) => ({
      type,
      count
    }))

    // Vet costs over time
    const vetCosts = filteredLogs
      .filter(log => {
        const type = log.type || log.metadata?.logType
        return type === 'vet_visit' || type === 'vet'
      })
      .filter(log => {
        const data = log.data || log.metadata || {}
        return data.cost || data.amount
      })
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          cost: parseFloat(data.cost || data.amount || 0),
          reason: data.reason || data.service
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Feeding times distribution
    const timeCounts: Record<string, number> = {}
    filteredLogs
      .filter(log => {
        const type = log.type || log.metadata?.logType
        return type === 'feeding' || type === 'meal'
      })
      .forEach(log => {
        const data = log.data || log.metadata || {}
        const time = data.time || 'Unknown'
        timeCounts[time] = (timeCounts[time] || 0) + 1
      })

    const feedingTimes = Object.entries(timeCounts).map(([time, count]) => ({
      time,
      count
    }))

    return { weightLogs, feedingPattern, vetCosts, feedingTimes }
  }, [filteredLogs])

  // If selectedLogType, show ONLY that chart
  if (selectedLogType) {
    if (selectedLogType === 'weight_check' || selectedLogType === 'weight') {
      return (
        <LogChartRenderer
          data={weightLogs}
          chartType="line"
          xKey="date"
          yKey="weight"
          title="Pet Weight Trend"
          description="Track your pet's weight over time"
          valueSuffix=" lbs"
        />
      )
    }

    if (selectedLogType === 'feeding' || selectedLogType === 'meal') {
      return (
        <>
          <LogChartRenderer
            data={feedingPattern}
            chartType="pie"
            xKey="type"
            yKey="count"
            title="Food Type Distribution"
            description="What your pet eats most often"
          />
          {feedingTimes.length > 0 && (
            <div className="mt-4">
              <LogChartRenderer
                data={feedingTimes}
                chartType="bar"
                xKey="time"
                yKey="count"
                title="Feeding Times"
                description="When you typically feed your pet"
              />
            </div>
          )}
        </>
      )
    }

    if (selectedLogType === 'vet_visit' || selectedLogType === 'vet') {
      return (
        <LogChartRenderer
          data={vetCosts}
          chartType="bar"
          xKey="date"
          yKey="cost"
          title="Vet Visit Costs"
          description="Track veterinary expenses over time"
          valuePrefix="$"
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
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
          <TabsTrigger value="vet">Vet Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="space-y-4 mt-4">
          {weightLogs.length > 0 ? (
            <LogChartRenderer
              data={weightLogs}
              chartType="line"
              xKey="date"
              yKey="weight"
              title="Pet Weight Trend"
              description="Monitor your pet's weight over time"
              valueSuffix=" lbs"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No weight data logged yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feeding" className="space-y-4 mt-4">
          {feedingPattern.length > 0 ? (
            <>
              <LogChartRenderer
                data={feedingPattern}
                chartType="pie"
                xKey="type"
                yKey="count"
                title="Food Type Distribution"
                description="What your pet eats most often"
              />
              {feedingTimes.length > 0 && (
                <LogChartRenderer
                  data={feedingTimes}
                  chartType="bar"
                  xKey="time"
                  yKey="count"
                  title="Feeding Times"
                  description="When you typically feed your pet"
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No feeding data logged yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vet" className="space-y-4 mt-4">
          {vetCosts.length > 0 ? (
            <LogChartRenderer
              data={vetCosts}
              chartType="bar"
              xKey="date"
              yKey="cost"
              title="Vet Visit Costs"
              description="Track veterinary expenses over time"
              valuePrefix="$"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No vet visit data logged yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

























