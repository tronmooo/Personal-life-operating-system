/**
 * Vitals & Labs Tab
 * Comprehensive vital signs tracking with trend charts
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Activity, Heart, Droplet, Weight, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

type TimeRange = '7d' | '30d' | '90d' | '1y'
type MetricType = 'blood_pressure' | 'weight' | 'heart_rate' | 'glucose'

export function VitalsLabsTab() {
  const { items: healthEntries, remove } = useDomainCRUD('health')
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('blood_pressure')

  // Filter and process data FOR CHART (filtered by selected metric)
  const filteredData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const cutoffDate = subDays(new Date(), days)
    
    return healthEntries
      .filter(e => e.metadata?.logType === selectedMetric || e.metadata?.recordType === selectedMetric)
      .filter(e => isAfter(new Date(e.createdAt), cutoffDate))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [healthEntries, timeRange, selectedMetric])

  // Get latest readings for each metric (support logType, type, AND recordType)
  const latestBP = healthEntries.find(e => 
    e.metadata?.logType === 'blood_pressure' || 
    e.metadata?.recordType === 'blood_pressure' ||
    (e.metadata?.type === 'vitals' && e.metadata?.bloodPressure)
  )
  const latestWeight = healthEntries.find(e => 
    e.metadata?.logType === 'weight' || 
    e.metadata?.recordType === 'weight' ||
    (e.metadata?.type === 'vitals' && e.metadata?.weight)
  )
  const latestHR = healthEntries.find(e => 
    e.metadata?.logType === 'heart_rate' || 
    e.metadata?.recordType === 'heart_rate' ||
    (e.metadata?.type === 'vitals' && e.metadata?.heartRate)
  )
  const latestGlucose = healthEntries.find(e => 
    e.metadata?.logType === 'glucose' || 
    e.metadata?.recordType === 'glucose' ||
    (e.metadata?.type === 'vitals' && e.metadata?.glucose)
  )

  // Prepare chart data (handle both old and new formats)
  const chartData = filteredData.map(entry => {
    const date = new Date(entry.createdAt)
    const bp = entry.metadata?.bloodPressure as any
    return {
      date: format(date, 'MMM d'),
      fullDate: format(date, 'PPp'),
      systolic: entry.metadata?.systolic || bp?.systolic,
      diastolic: entry.metadata?.diastolic || bp?.diastolic,
      weight: entry.metadata?.weight,
      heartRate: entry.metadata?.heartRate || entry.metadata?.bpm,
      glucose: entry.metadata?.glucose,
    }
  })

  // Recent entries list - show ALL vital types, not just selected metric
  const recentEntries = useMemo(() => {
    return healthEntries
      .filter(e => {
        // Include entries with specific logType, recordType, OR old 'vitals' type
        return e.metadata?.logType === 'blood_pressure' ||
               e.metadata?.logType === 'weight' ||
               e.metadata?.logType === 'heart_rate' ||
               e.metadata?.logType === 'glucose' ||
               e.metadata?.recordType === 'blood_pressure' ||
               e.metadata?.recordType === 'weight' ||
               e.metadata?.recordType === 'heart_rate' ||
               e.metadata?.recordType === 'glucose' ||
               e.metadata?.type === 'vitals'
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [healthEntries])

  // Check if there's any vital data at all
  const hasAnyVitals = latestBP || latestWeight || latestHR || latestGlucose

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">Vital Signs & Lab Results</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your health trends over time</p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show empty state if no vitals exist */}
      {!hasAnyVitals ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Activity className="w-16 h-16 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Vital Signs Recorded</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Start tracking your health by adding your first vital sign measurement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`cursor-pointer transition-all ${selectedMetric === 'blood_pressure' ? 'ring-2 ring-red-500' : ''}`}
                  onClick={() => setSelectedMetric('blood_pressure')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-6 h-6 text-red-600" />
                  {/* Only show trend icon if data exists */}
                </div>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {latestBP ? `${latestBP.metadata.systolic || (latestBP.metadata.bloodPressure as any)?.systolic}/${latestBP.metadata.diastolic || (latestBP.metadata.bloodPressure as any)?.diastolic}` : '--/--'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Blood Pressure</p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${selectedMetric === 'weight' ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => setSelectedMetric('weight')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Weight className="w-6 h-6 text-green-600" />
                  {/* Only show trend icon if data exists */}
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {latestWeight ? `${latestWeight.metadata.weight}` : '--'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Weight (lbs)</p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${selectedMetric === 'heart_rate' ? 'ring-2 ring-pink-500' : ''}`}
                  onClick={() => setSelectedMetric('heart_rate')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-6 h-6 text-pink-600" />
                  {/* Only show trend icon if data exists */}
                </div>
                <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                  {latestHR ? `${latestHR.metadata.heartRate || latestHR.metadata.bpm}` : '--'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Heart Rate (bpm)</p>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${selectedMetric === 'glucose' ? 'ring-2 ring-yellow-500' : ''}`}
                  onClick={() => setSelectedMetric('glucose')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Droplet className="w-6 h-6 text-yellow-600" />
                  {/* Only show trend icon if data exists */}
                </div>
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {latestGlucose ? `${latestGlucose.metadata.glucose}` : '--'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Blood Sugar (mg/dL)</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Trend Chart - Only show if vitals exist */}
      {hasAnyVitals && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedMetric === 'blood_pressure' && <Activity className="w-5 h-5 text-red-600" />}
                {selectedMetric === 'weight' && <Weight className="w-5 h-5 text-green-600" />}
                {selectedMetric === 'heart_rate' && <Heart className="w-5 h-5 text-pink-600" />}
                {selectedMetric === 'glucose' && <Droplet className="w-5 h-5 text-yellow-600" />}
                <CardTitle>
                  {selectedMetric === 'blood_pressure' && 'Blood Pressure Trend'}
                  {selectedMetric === 'weight' && 'Weight Trend'}
                  {selectedMetric === 'heart_rate' && 'Heart Rate Trend'}
                  {selectedMetric === 'glucose' && 'Blood Sugar Trend'}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={selectedMetric === 'blood_pressure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('blood_pressure')}
                >
                  Blood Pressure
                </Button>
                <Button 
                  variant={selectedMetric === 'weight' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('weight')}
                >
                  Weight
                </Button>
                <Button 
                  variant={selectedMetric === 'heart_rate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('heart_rate')}
                >
                  Heart Rate
                </Button>
                <Button 
                  variant={selectedMetric === 'glucose' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('glucose')}
                >
                  Blood Sugar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for selected time range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                {selectedMetric === 'blood_pressure' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis domain={[35, 140]} stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #ccc', 
                        borderRadius: '8px' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#dc2626" 
                      strokeWidth={2} 
                      dot={{ fill: '#dc2626', r: 4 }}
                      name="Systolic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#ea580c" 
                      strokeWidth={2} 
                      dot={{ fill: '#ea580c', r: 4 }}
                      name="Diastolic"
                    />
                  </LineChart>
                ) : selectedMetric === 'weight' ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis domain={[164, 167]} stroke="#666" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#16a34a" 
                      fill="#bbf7d0" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : selectedMetric === 'heart_rate' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis domain={[65, 80]} stroke="#666" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#ec4899" 
                      strokeWidth={2} 
                      dot={{ fill: '#ec4899', r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis domain={[85, 105]} stroke="#666" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="glucose" 
                      stroke="#eab308" 
                      strokeWidth={2} 
                      dot={{ fill: '#eab308', r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Vital Entries - Only show if vitals exist */}
      {hasAnyVitals && (
        <Card className="bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <Activity className="w-5 h-5" />
              Recent Vital Entries
            </CardTitle>
            <CardDescription>Quick access to delete recent entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEntries.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No entries found</p>
            ) : (
              <>
                {recentEntries.map(entry => {
                  const entryType = entry.metadata?.logType || entry.metadata?.recordType
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        {entryType === 'blood_pressure' && <Activity className="w-5 h-5 text-red-600" />}
                        {entryType === 'weight' && <Weight className="w-5 h-5 text-green-600" />}
                        {entryType === 'heart_rate' && <Heart className="w-5 h-5 text-pink-600" />}
                        {entryType === 'glucose' && <Droplet className="w-5 h-5 text-yellow-600" />}
                        <div>
                          <p className="font-medium">
                            {entryType === 'blood_pressure' && `Blood Pressure: ${entry.metadata.systolic || (entry.metadata.bloodPressure as any)?.systolic}/${entry.metadata.diastolic || (entry.metadata.bloodPressure as any)?.diastolic}`}
                            {entryType === 'weight' && `Weight: ${entry.metadata.weight} lbs`}
                            {entryType === 'heart_rate' && `Heart Rate: ${entry.metadata.heartRate || entry.metadata.bpm} bpm`}
                            {entryType === 'glucose' && `Blood Sugar: ${entry.metadata.glucose} mg/dL`}
                            {entry.metadata?.type === 'vitals' && !entryType && entry.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(entry.createdAt), 'MMM d, yyyy - h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => remove(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


