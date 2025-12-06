'use client'

import { useMemo } from 'react'
import { LogChartRenderer } from './log-chart-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HealthLogChartsProps {
  logs: any[]
  selectedLogType?: string // e.g., 'weight', 'heart-rate', 'sleep', etc.
}

export function HealthLogCharts({ logs, selectedLogType }: HealthLogChartsProps) {
  // ✅ Filter logs by selectedLogType if provided
  const filteredLogs = useMemo(() => {
    if (!selectedLogType) return logs
    
    return logs.filter(log => {
      const logType = log.type || log.metadata?.logType || log.typeName?.toLowerCase().replace(/\s+/g, '-')
      return logType === selectedLogType
    })
  }, [logs, selectedLogType])

  const { weightLogs, bpLogs, waterLogs, symptomFrequency, heartRateLogs, sleepLogs, moodLogs } = useMemo(() => {
    const weight = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'weight'
    })
    const bp = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'blood_pressure' || type === 'blood-pressure'
    })
    const water = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'water' || type === 'hydration'
    })
    const symptoms = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'symptom'
    })
    const heartRate = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'heart-rate' || type === 'heart_rate'
    })
    const sleep = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'sleep'
    })
    const mood = filteredLogs.filter(log => {
      const type = log.type || log.metadata?.logType
      return type === 'mood' || type === 'mood-check'
    })

    const weightLogs = weight
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          weight: parseFloat(data.weight || data.value || 0)
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    const bpLogs = bp
      .map(log => {
        const data = log.data || log.metadata || {}
        return {
          date: data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          systolic: parseFloat(data.systolic || 0),
          diastolic: parseFloat(data.diastolic || 0),
          pulse: parseFloat(data.pulse || 0)
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Group water by date
    const waterByDate: Record<string, number> = {}
    water.forEach(log => {
      const data = log.data || log.metadata || {}
      const date = data.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0]
      waterByDate[date] = (waterByDate[date] || 0) + parseFloat(data.amount || data.value || 0)
    })

    const waterLogs = Object.entries(waterByDate)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Symptom frequency
    const symptomCounts: Record<string, number> = {}
    symptoms.forEach(log => {
      const data = log.data || log.metadata || {}
      const symptom = data.symptom || 'Unknown'
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
    })

    const symptomFrequency = Object.entries(symptomCounts).map(([symptom, count]) => ({
      symptom,
      count
    }))

    // Heart Rate logs
    const heartRateLogs = heartRate
      .map(log => ({
        date: (log.data || log.metadata)?.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
        heartRate: parseFloat((log.data || log.metadata)?.value || (log.data || log.metadata)?.heartRate || 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Sleep logs
    const sleepLogs = sleep
      .map(log => ({
        date: (log.data || log.metadata)?.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
        hours: parseFloat((log.data || log.metadata)?.value || (log.data || log.metadata)?.hours || 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Mood logs
    const moodLogs = mood
      .map(log => {
        const moodValue = (log.data || log.metadata)?.mood || (log.data || log.metadata)?.value || ''
        // Convert mood to numeric scale (1-10)
        const moodScale: Record<string, number> = {
          'amazing': 10, '😄': 10,
          'great': 9, '😊': 9,
          'good': 8, '🙂': 8,
          'okay': 7, '😐': 7,
          'meh': 6, '😕': 6,
          'bad': 5, '☹️': 5,
          'awful': 4, '😢': 4,
          'terrible': 3, '😭': 3,
          'anxious': 5, '😰': 5,
          'stressed': 4, '😫': 4
        }
        return {
          date: (log.data || log.metadata)?.date || new Date(log.timestamp || log.createdAt).toISOString().split('T')[0],
          mood: moodScale[moodValue.toLowerCase()] || 5,
          moodLabel: moodValue
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return { weightLogs, bpLogs, waterLogs, symptomFrequency, heartRateLogs, sleepLogs, moodLogs }
  }, [filteredLogs])

  // ✅ If selectedLogType is provided, show ONLY that chart
  if (selectedLogType) {
    // Weight chart
    if (selectedLogType === 'weight') {
      return (
        <LogChartRenderer
          data={weightLogs}
          chartType="line"
          xKey="date"
          yKey="weight"
          title="Weight Trend"
          description="Track your weight over time"
          valueSuffix=" lbs"
        />
      )
    }

    // Heart Rate chart
    if (selectedLogType === 'heart-rate' || selectedLogType === 'heart_rate') {
      return (
        <LogChartRenderer
          data={heartRateLogs}
          chartType="line"
          xKey="date"
          yKey="heartRate"
          title="Heart Rate Trend"
          description="Monitor your heart rate over time"
          valueSuffix=" bpm"
        />
      )
    }

    // Blood Pressure chart
    if (selectedLogType === 'blood-pressure' || selectedLogType === 'blood_pressure') {
      return (
        <LogChartRenderer
          data={bpLogs}
          chartType="line"
          xKey="date"
          yKey={['systolic', 'diastolic']}
          title="Blood Pressure Trend"
          description="Monitor your blood pressure readings"
          valueSuffix=" mmHg"
        />
      )
    }

    // Sleep chart
    if (selectedLogType === 'sleep') {
      return (
        <LogChartRenderer
          data={sleepLogs}
          chartType="bar"
          xKey="date"
          yKey="hours"
          title="Sleep Duration"
          description="Track your sleep hours"
          valueSuffix=" hours"
        />
      )
    }

    // Mood chart (special visualization with emoji scale)
    if (selectedLogType === 'mood' || selectedLogType === 'mood-check') {
      return (
        <LogChartRenderer
          data={moodLogs}
          chartType="line"
          xKey="date"
          yKey="mood"
          title="Mood Tracking"
          description="Monitor your emotional well-being (scale 1-10)"
          valueSuffix=""
        />
      )
    }

    // Hydration chart
    if (selectedLogType === 'water' || selectedLogType === 'hydration') {
      return (
        <LogChartRenderer
          data={waterLogs}
          chartType="bar"
          xKey="date"
          yKey="amount"
          title="Daily Water Intake"
          description="Stay hydrated and track your water consumption"
          valueSuffix=" oz"
        />
      )
    }

    // If no matching chart, show message
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No visualization available for this log type yet.</p>
        <p className="text-sm mt-2">Keep logging to see your progress!</p>
      </div>
    )
  }

  // ✅ If NO selectedLogType, show all charts with tabs (original behavior)
  return (
    <div className="space-y-6">
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="bp">Blood Pressure</TabsTrigger>
          <TabsTrigger value="water">Hydration</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="mt-4">
          <LogChartRenderer
            data={weightLogs}
            chartType="line"
            xKey="date"
            yKey="weight"
            title="Weight Trend"
            description="Track your weight over time"
            valueSuffix=" lbs"
          />
        </TabsContent>

        <TabsContent value="bp" className="mt-4">
          <LogChartRenderer
            data={bpLogs}
            chartType="line"
            xKey="date"
            yKey={['systolic', 'diastolic']}
            title="Blood Pressure Trend"
            description="Monitor your blood pressure readings"
            valueSuffix=" mmHg"
          />
        </TabsContent>

        <TabsContent value="water" className="mt-4">
          <LogChartRenderer
            data={waterLogs}
            chartType="bar"
            xKey="date"
            yKey="amount"
            title="Daily Water Intake"
            description="Stay hydrated! Goal: 64 oz/day"
            valueSuffix=" oz"
          />
        </TabsContent>

        <TabsContent value="symptoms" className="mt-4">
          {symptomFrequency.length > 0 ? (
            <LogChartRenderer
              data={symptomFrequency}
              chartType="pie"
              xKey="symptom"
              yKey="count"
              title="Symptom Frequency"
              description="Most common symptoms logged"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No symptoms logged yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}







