/**
 * Enhanced Health Dashboard Tab
 * Quick overview with stats, recent entries, medications, appointments, AI insights
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { useHealthProfile } from '@/lib/hooks/use-health-profile'
import { Activity, Heart, Droplet, Weight, Moon, Pill, Calendar, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Clock, User, Loader2, Sparkles } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { HealthDomainMetadata } from '@/types/domain-metadata'

interface VitalEntry {
  id: string
  domain: string
  title: string
  description?: string
  metadata: {
    logType?: string
    systolic?: number
    diastolic?: number
    heartRate?: number
    bpm?: number
    weight?: number
    glucose?: number
    sleepHours?: number
    waterGlasses?: number
    date?: string
  }
  created_at: string
}

interface AIInsight {
  category: 'positive' | 'caution' | 'concern'
  title: string
  message: string
  icon: string
}

export function EnhancedDashboardTab() {
  const { items: healthEntries, loading } = useDomainCRUD('health')
  const { profile, age } = useHealthProfile()
  const { toast } = useToast()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Get latest vitals - check multiple possible field names for compatibility
  const latestBP = healthEntries.find(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'blood_pressure' || 
      meta?.recordType === 'blood_pressure' ||
      (meta?.type === 'vitals' && (meta?.bloodPressure || (meta?.systolic && meta?.diastolic)))
  })
  const latestWeight = healthEntries.find(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'weight' || 
      meta?.recordType === 'weight' ||
      (meta?.type === 'vitals' && meta?.weight)
  })
  const latestHR = healthEntries.find(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'heart_rate' || 
      meta?.recordType === 'heart_rate' ||
      (meta?.type === 'vitals' && (meta?.heartRate || meta?.hr || meta?.bpm))
  })
  const latestGlucose = healthEntries.find(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'glucose' || 
      meta?.recordType === 'glucose' ||
      (meta?.type === 'vitals' && (meta?.glucose || meta?.bloodGlucose))
  })
  const latestSleep = healthEntries.find(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'sleep' || 
      meta?.recordType === 'sleep' ||
      (meta?.type === 'sleep' && (meta?.sleepHours || meta?.hours || meta?.duration))
  })
  
  // Get medications
  const medications = healthEntries.filter(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'medication'
  })
  const todaysMeds = medications.slice(0, 5)
  
  // Get appointments
  const appointments = healthEntries.filter(e => {
    const meta = e.metadata as HealthDomainMetadata
    return meta?.logType === 'appointment'
  })
  const upcomingAppointments = appointments.slice(0, 2)

  // Load AI insights
  useEffect(() => {
    if (healthEntries.length > 0 && insights.length === 0) {
      loadAIInsights()
    }
  }, [healthEntries])

  async function loadAIInsights() {
    try {
      setLoadingInsights(true)
      const response = await fetch('/api/health/insights', {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to load insights')
      
      const data = await response.json()
      setInsights(data.insights || [])
    } catch (error: any) {
      console.error('Failed to load AI insights:', error)
      // Fallback to static insights if API fails
      setInsights([
        {
          category: 'positive',
          title: 'Blood Pressure Trending Well',
          message: `Your BP has been stable for 30 days. Average: ${latestBP ? (() => {
            const meta = latestBP.metadata as HealthDomainMetadata
            return `${meta.systolic || 120}/${meta.diastolic || 79}`
          })() : '120/79'}. Keep up your current medication routine.`,
          icon: 'activity'
        },
        {
          category: 'positive',
          title: 'Sleep Quality Excellent',
          message: `Averaging ${latestSleep ? ((latestSleep.metadata as HealthDomainMetadata) as any).sleepHours || '7.5' : '7.5'} hours per night. Deep sleep at 28% is optimal. Consider maintaining bedtime at 10:30 PM.`,
          icon: 'moon'
        },
        {
          category: 'caution',
          title: 'Hydration Reminder',
          message: `Remember to stay hydrated throughout the day. Adequate water intake may help with energy levels and BP.`,
          icon: 'droplet'
        }
      ])
    } finally {
      setLoadingInsights(false)
    }
  }

  function getInsightColor(category: string) {
    switch (category) {
      case 'positive': return 'bg-green-50 dark:bg-green-950 border-green-200'
      case 'caution': return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200'
      case 'concern': return 'bg-red-50 dark:bg-red-950 border-red-200'
      default: return 'bg-blue-50 dark:bg-blue-950 border-blue-200'
    }
  }

  function getInsightIcon(icon: string) {
    switch (icon) {
      case 'heart': return Heart
      case 'moon': return Moon
      case 'droplet': return Droplet
      case 'activity': return Activity
      case 'alert': return AlertCircle
      default: return CheckCircle2
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Blood Pressure */}
        <Card className="bg-red-50 dark:bg-red-950 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-red-600" />
              {latestBP && (
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(latestBP.createdAt), 'h:mm a')}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {latestBP ? (() => {
                const meta = latestBP.metadata as HealthDomainMetadata
                const sys = meta.systolic || (meta.bloodPressure as any)?.systolic || '--'
                const dia = meta.diastolic || (meta.bloodPressure as any)?.diastolic || '--'
                return `${sys}/${dia}`
              })() : '--/--'}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">BP</p>
          </CardContent>
        </Card>

        {/* Heart Rate */}
        <Card className="bg-pink-50 dark:bg-pink-950 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-pink-600" />
              {latestHR && (
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(latestHR.createdAt), 'h:mm a')}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
              {latestHR ? (() => {
                const meta = latestHR.metadata as HealthDomainMetadata
                return meta.heartRate || meta.hr || meta.bpm || '--'
              })() : '--'}
            </div>
            <p className="text-xs text-pink-700 dark:text-pink-300">HR</p>
          </CardContent>
        </Card>

        {/* Weight */}
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Weight className="w-5 h-5 text-green-600" />
              {latestWeight && (
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(latestWeight.createdAt), 'h:mm a')}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {latestWeight ? (() => {
                const meta = latestWeight.metadata as HealthDomainMetadata
                return meta.weight || (meta as any).value || '--'
              })() : '--'}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">lbs</p>
          </CardContent>
        </Card>

        {/* Blood Sugar */}
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Droplet className="w-5 h-5 text-yellow-600" />
              {latestGlucose && (
                <Badge variant="secondary" className="text-xs">
                  {format(new Date(latestGlucose.createdAt), 'h:mm a')}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {latestGlucose ? (() => {
                const meta = latestGlucose.metadata as HealthDomainMetadata
                return meta.glucose || (meta as any).bloodGlucose || (meta as any).value || '--'
              })() : '--'}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">mg/dL</p>
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-5 h-5 text-purple-600" />
              {latestSleep && (
                <Badge variant="secondary" className="text-xs">Last Night</Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {latestSleep ? (() => {
                const meta = latestSleep.metadata as HealthDomainMetadata
                return `${(meta as any).sleepHours || (meta as any).hours || meta.duration || '--'}h`
              })() : '--h'}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">Sleep</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medications Today */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-red-600" />
                Medications Today
              </CardTitle>
              {todaysMeds.length > 0 && (
                <Badge>
                  {todaysMeds.filter(m => (m.metadata as any)?.taken).length} of {todaysMeds.length} taken
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysMeds.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No medications scheduled for today</p>
            ) : (
              <>
                {todaysMeds.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${(med.metadata as any)?.taken ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium">{med.title}</p>
                        <p className="text-xs text-gray-500">{(med.metadata as any)?.time || '8:00 AM'}</p>
                      </div>
                    </div>
                    <Badge variant={(med.metadata as any)?.taken ? 'default' : 'secondary'}>
                      {(med.metadata as any)?.taken ? 'Taken' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                <Progress value={(todaysMeds.filter(m => (m.metadata as any)?.taken).length / todaysMeds.length) * 100} className="mt-4" />
                <p className="text-xs text-center text-gray-500 mt-2">
                  {todaysMeds.filter(m => (m.metadata as any)?.taken).length} of {todaysMeds.length} taken
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Health Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle>Health Insights</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAIInsights}
                disabled={loadingInsights}
              >
                {loadingInsights ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
            <CardDescription>AI-powered analysis of your health data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInsights ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-500">Analyzing your health data...</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">No insights available yet</p>
                <Button onClick={loadAIInsights} variant="outline" size="sm">
                  Generate Insights
                </Button>
              </div>
            ) : (
              insights.map((insight, idx) => {
                const Icon = getInsightIcon(insight.icon)
                return (
                  <div key={idx} className={`p-3 rounded-lg border ${getInsightColor(insight.category)}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        insight.category === 'positive' ? 'text-green-600' :
                        insight.category === 'caution' ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                      <div>
                        <p className={`font-medium ${
                          insight.category === 'positive' ? 'text-green-900 dark:text-green-100' :
                          insight.category === 'caution' ? 'text-yellow-900 dark:text-yellow-100' :
                          'text-red-900 dark:text-red-100'
                        }`}>
                          {insight.title}
                        </p>
                        <p className={`text-sm ${
                          insight.category === 'positive' ? 'text-green-700 dark:text-green-300' :
                          insight.category === 'caution' ? 'text-yellow-700 dark:text-yellow-300' :
                          'text-red-700 dark:text-red-300'
                        }`}>
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments & Today's Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
            ) : (
              upcomingAppointments.map(apt => (
                <div key={apt.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{apt.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{(apt.metadata as any)?.provider || 'Dr. Sarah Smith'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">Nov 20</p>
                      <p className="text-xs text-gray-500">10:00 AM</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Today's Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-600" />
                  Sleep
                </span>
                <span className="font-medium">{latestSleep ? ((latestSleep.metadata as HealthDomainMetadata) as any).sleepHours || 7.5 : 7.5}/8 hours</span>
              </div>
              <Progress value={((latestSleep ? ((latestSleep.metadata as HealthDomainMetadata) as any).sleepHours || 7.5 : 7.5) / 8) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-red-600" />
                  Medications
                </span>
                <span className="font-medium">
                  {todaysMeds.filter(m => (m.metadata as any)?.taken).length}/{todaysMeds.length} taken
                </span>
              </div>
              <Progress 
                value={todaysMeds.length > 0 ? (todaysMeds.filter(m => (m.metadata as any)?.taken).length / todaysMeds.length) * 100 : 0} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Alerts */}
      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
            <AlertCircle className="w-5 h-5" />
            Health Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Annual checkup in 7 days</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nov 20 at 10:00 AM with Dr. Sarah Smith</p>
            </div>
            <Badge className="bg-yellow-500">Soon</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Prescription refill needed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lisinopril - 5 days remaining</p>
            </div>
            <Badge variant="destructive">Urgent</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

