'use client'

import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogChartRenderer } from './log-chart-renderer'

interface GenericLogChartsProps {
  logs: any[]
  domainId: string
  selectedLogType?: string
}

export function GenericLogCharts({ logs, domainId, selectedLogType }: GenericLogChartsProps) {
  // Filter logs by selectedLogType
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const chartData = useMemo(() => {
    // Count logs by type
    const logsByType: Record<string, number> = {}
    filteredLogs.forEach(log => {
      const type = log.typeName || log.type || log.metadata?.logType || 'Unknown'
      logsByType[type] = (logsByType[type] || 0) + 1
    })

    const typeDistribution = Object.entries(logsByType).map(([type, count]) => ({
      type,
      count
    }))

    // Count logs by date
    const logsByDate: Record<string, number> = {}
    filteredLogs.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      logsByDate[date] = (logsByDate[date] || 0) + 1
    })

    const activityOverTime = Object.entries(logsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Extract numeric values if available
    const numericData: any[] = []
    filteredLogs.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
          const numValue = typeof value === 'number' ? value : parseFloat(value)
          if (!isNaN(numValue) && key !== 'date' && key !== 'time') {
            numericData.push({
              date,
              [key]: numValue,
              label: key
            })
          }
        }
      })
    })

    // Group numeric data by date and key
    const numericByDateKey: Record<string, Record<string, number>> = {}
    numericData.forEach(item => {
      const date = item.date
      const key = item.label
      const value = item[key]
      if (!numericByDateKey[key]) {
        numericByDateKey[key] = {}
      }
      numericByDateKey[key][date] = (numericByDateKey[key][date] || 0) + value
    })

    const numericCharts = Object.entries(numericByDateKey).map(([key, dateValues]) => ({
      key,
      data: Object.entries(dateValues)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }))

    return { typeDistribution, activityOverTime, numericCharts }
  }, [filteredLogs])

  // If selectedLogType, show focused visualization
  if (selectedLogType) {
    const hasNumericData = chartData.numericCharts.length > 0

    if (hasNumericData) {
      return (
        <div className="space-y-4">
          {chartData.numericCharts.map((chart) => (
            <LogChartRenderer
              key={chart.key}
              data={chart.data}
              chartType="line"
              xKey="date"
              yKey="value"
              title={`${chart.key} Over Time`}
              description={`Track your ${chart.key} progress`}
            />
          ))}
        </div>
      )
    }

    if (chartData.activityOverTime.length > 0) {
      return (
        <LogChartRenderer
          data={chartData.activityOverTime}
          chartType="bar"
          xKey="date"
          yKey="count"
          title="Activity Over Time"
          description={`${selectedLogType} logs by date`}
          valueSuffix=" logs"
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
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4 mt-4">
          {chartData.activityOverTime.length > 0 ? (
            <>
              <LogChartRenderer
                data={chartData.activityOverTime}
                chartType="bar"
                xKey="date"
                yKey="count"
                title="Activity Over Time"
                description={`Your ${domainId} logging activity`}
                valueSuffix=" logs"
              />
              {chartData.numericCharts.map((chart) => (
                <LogChartRenderer
                  key={chart.key}
                  data={chart.data}
                  chartType="line"
                  xKey="date"
                  yKey="value"
                  title={`${chart.key} Trend`}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No activity data yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4 mt-4">
          {chartData.typeDistribution.length > 0 ? (
            <LogChartRenderer
              data={chartData.typeDistribution}
              chartType="pie"
              xKey="type"
              yKey="count"
              title="Log Type Distribution"
              description={`Breakdown of ${domainId} log types`}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No log type data yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

























