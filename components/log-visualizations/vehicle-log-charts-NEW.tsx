'use client'

import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogChartRenderer } from './log-chart-renderer'

interface VehicleLogChartsProps {
  logs: any[]
  selectedLogType?: string
}

export function VehicleLogCharts({ logs, selectedLogType }: VehicleLogChartsProps) {
  // Filter logs by selectedLogType
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const { fuelLogs, maintenanceCosts, fuelEfficiency, maintenanceByType } = useMemo(() => {
    const fuel = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'fuel' || type === 'gas'
    })
    const maintenance = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'maintenance' || type === 'service'
    })

    // Fuel trend over time
    const fuelLogs = fuel.map(log => {
      const data = log.data || log.metadata || {}
      return {
        date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
        cost: parseFloat(data.cost || data.amount || data.value || 0),
        gallons: parseFloat(data.gallons || data.amount_gallons || 0),
        mileage: parseFloat(data.mileage || data.odometer || 0)
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate fuel efficiency (MPG)
    const fuelEfficiency = fuelLogs.map((log, idx) => {
      if (idx === 0) return null
      const prevLog = fuelLogs[idx - 1]
      const milesDriven = log.mileage - prevLog.mileage
      const mpg = milesDriven / log.gallons
      return {
        date: log.date,
        mpg: mpg > 0 && mpg < 100 ? Math.round(mpg * 10) / 10 : 0
      }
    }).filter(item => item && item.mpg > 0) as Array<{ date: string; mpg: number }>

    // Maintenance costs
    const maintenanceCosts = maintenance.map(log => {
      const data = log.data || log.metadata || {}
      return {
        date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
        cost: parseFloat(data.cost || data.amount || data.value || 0),
        type: data.service || data.type || 'Other'
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    // Maintenance by type
    const maintenanceByTypeMap: Record<string, number> = {}
    maintenance.forEach(log => {
      const data = log.data || log.metadata || {}
      const type = data.service || data.type || 'Other'
      maintenanceByTypeMap[type] = (maintenanceByTypeMap[type] || 0) + parseFloat(data.cost || data.amount || data.value || 0)
    })
    const maintenanceByType = Object.entries(maintenanceByTypeMap).map(([type, cost]) => ({
      type,
      cost: Math.round(cost * 100) / 100
    }))

    return { fuelLogs, maintenanceCosts, fuelEfficiency, maintenanceByType }
  }, [filteredLogs])

  // If selectedLogType, show ONLY that chart
  if (selectedLogType) {
    if (selectedLogType === 'fuel' || selectedLogType === 'gas') {
      return (
        <>
          <LogChartRenderer
            data={fuelLogs}
            chartType="line"
            xKey="date"
            yKey="cost"
            title="Fuel Costs"
            description="Track your fuel expenses over time"
            valuePrefix="$"
          />
          {fuelEfficiency.length > 0 && (
            <div className="mt-4">
              <LogChartRenderer
                data={fuelEfficiency}
                chartType="line"
                xKey="date"
                yKey="mpg"
                title="Fuel Efficiency (MPG)"
                description="Miles per gallon over time"
                valueSuffix=" mpg"
              />
            </div>
          )}
        </>
      )
    }

    if (selectedLogType === 'maintenance' || selectedLogType === 'service') {
      return (
        <>
          <LogChartRenderer
            data={maintenanceCosts}
            chartType="bar"
            xKey="date"
            yKey="cost"
            title="Maintenance Costs"
            description="Track your vehicle maintenance expenses"
            valuePrefix="$"
          />
          <div className="mt-4">
            <LogChartRenderer
              data={maintenanceByType}
              chartType="pie"
              xKey="type"
              yKey="cost"
              title="Maintenance by Type"
              description="Cost breakdown by service type"
              valuePrefix="$"
            />
          </div>
        </>
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
      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-4 mt-4">
          <LogChartRenderer
            data={fuelLogs}
            chartType="line"
            xKey="date"
            yKey="cost"
            title="Fuel Cost Trend"
            description="Track your fuel expenses over time"
            valuePrefix="$"
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <LogChartRenderer
            data={maintenanceCosts}
            chartType="bar"
            xKey="date"
            yKey="cost"
            title="Maintenance Costs"
            description="Vehicle service and repair expenses"
            valuePrefix="$"
          />
          <LogChartRenderer
            data={maintenanceByType}
            chartType="pie"
            xKey="type"
            yKey="cost"
            title="Maintenance by Type"
            description="Cost breakdown by service type"
            valuePrefix="$"
          />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4 mt-4">
          {fuelEfficiency.length > 0 ? (
            <LogChartRenderer
              data={fuelEfficiency}
              chartType="line"
              xKey="date"
              yKey="mpg"
              title="Fuel Efficiency (MPG)"
              description="Track your miles per gallon over time"
              valueSuffix=" mpg"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Log at least 2 fuel entries to calculate efficiency.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

























