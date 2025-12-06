/**
 * Sleep Tracking Tab
 * Comprehensive sleep tracking with quality metrics and trends
 */

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Moon, Sun, TrendingUp, Trash2, CloudMoon } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

interface SleepTrackingTabProps {
  onLogSleep: () => void
}

export function SleepTrackingTab({ onLogSleep }: SleepTrackingTabProps) {
  const { items: healthEntries, remove } = useDomainCRUD('health')

  // Filter sleep entries
  const sleepEntries = useMemo(() => {
    return healthEntries
      .filter(e => e.metadata?.logType === 'sleep')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [healthEntries])

  // Get recent week data
  const weekData = useMemo(() => {
    const last7Days = subDays(new Date(), 7)
    return sleepEntries
      .filter(e => isAfter(new Date(e.createdAt), last7Days))
      .reverse()
      .map(e => ({
        date: format(new Date(e.createdAt), 'EEE'),
        fullDate: format(new Date(e.createdAt), 'MMM d'),
        hours: Number(e.metadata?.sleepHours) || 0,
        deep: Number(e.metadata?.deepSleep) || 0,
        rem: Number(e.metadata?.remSleep) || 0,
        light: Number(e.metadata?.lightSleep) || 0,
        quality: String(e.metadata?.sleepQuality) || 'Good',
      }))
  }, [sleepEntries])

  // Calculate average
  const avgSleep = weekData.length > 0 
    ? (weekData.reduce((sum, d) => sum + Number(d.hours), 0) / weekData.length).toFixed(1)
    : '0'

  const avgDeep = weekData.length > 0 
    ? (weekData.reduce((sum, d) => sum + Number(d.deep), 0) / weekData.length).toFixed(1)
    : '0'

  const avgRem = weekData.length > 0 
    ? (weekData.reduce((sum, d) => sum + Number(d.rem), 0) / weekData.length).toFixed(1)
    : '0'

  // Latest sleep score
  const latestSleep = sleepEntries[0]
  const sleepScore = Number(latestSleep?.metadata?.sleepScore) || 78

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Sleep Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your sleep patterns and quality</p>
        </div>
        <Button onClick={onLogSleep} className="bg-purple-600 hover:bg-purple-700">
          + Log Sleep
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {avgSleep}h
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">Avg Sleep</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CloudMoon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {avgDeep}h
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Deep Sleep</p>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 dark:bg-cyan-950 border-cyan-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">
              {avgRem}h
            </div>
            <p className="text-sm text-cyan-700 dark:text-cyan-300">REM Sleep</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {sleepScore}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Sleep Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Sleep Duration Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Weekly Sleep Duration
          </CardTitle>
          <CardDescription>Hours of sleep per night</CardDescription>
        </CardHeader>
        <CardContent>
          {weekData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No sleep data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis domain={[0, 10]} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc', 
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="hours" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sleep Stages Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudMoon className="w-5 h-5 text-blue-600" />
            Sleep Stages Breakdown
          </CardTitle>
          <CardDescription>Deep, REM, and Light sleep</CardDescription>
        </CardHeader>
        <CardContent>
          {weekData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No sleep stage data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="deep" 
                  stackId="1"
                  stroke="#1e40af" 
                  fill="#3b82f6" 
                  name="Deep Sleep"
                />
                <Area 
                  type="monotone" 
                  dataKey="rem" 
                  stackId="1"
                  stroke="#0891b2" 
                  fill="#06b6d4" 
                  name="REM Sleep"
                />
                <Area 
                  type="monotone" 
                  dataKey="light" 
                  stackId="1"
                  stroke="#6366f1" 
                  fill="#a5b4fc" 
                  name="Light Sleep"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Sleep Sessions */}
      <Card className="bg-purple-50 dark:bg-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Moon className="w-5 h-5" />
            Recent Sleep Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sleepEntries.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No sleep sessions logged</p>
          ) : (
              sleepEntries.slice(0, 5).map(entry => {
                const metadata = entry.metadata || {}
                return (
                  <div key={entry.id} className="p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {format(new Date(entry.createdAt), 'MM/dd/yyyy')}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 ${
                              metadata?.sleepQuality === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              metadata?.sleepQuality === 'Excellent' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {String(metadata?.sleepQuality || 'Good')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {metadata?.sleepHours || 7.5}h
                          </p>
                          <p className="text-xs text-gray-500">total sleep</p>
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
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-purple-700">Bedtime</p>
                        <p className="text-purple-900 dark:text-purple-100">
                          {String(metadata?.bedtime || '10:30 PM')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-purple-700">Wake</p>
                        <p className="text-purple-900 dark:text-purple-100">
                          {String(metadata?.wakeTime || '6:00 AM')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">Deep</p>
                        <p className="text-blue-900 dark:text-blue-100">
                          {metadata?.deepSleep || 2.1}h
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-cyan-700">REM</p>
                        <p className="text-cyan-900 dark:text-cyan-100">
                          {metadata?.remSleep || 1.8}h
                        </p>
                      </div>
                    </div>

                    {metadata?.notes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                        {String(metadata.notes)}
                      </p>
                    )}
                  </div>
                )
              })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

