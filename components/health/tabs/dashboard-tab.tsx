'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Pill, Activity, Calendar, AlertCircle, TrendingUp, 
  Clock, CheckCircle, Heart, Droplet, Footprints
} from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, differenceInDays, parseISO } from 'date-fns'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

export function DashboardTab() {
  const { healthData, dashboardSummary } = useHealth()
  const [quickLogType, setQuickLogType] = useState<string | null>(null)

  // Get recent weight data for chart
  const recentWeightData = healthData.metrics
    .filter(m => m.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map(m => ({
      date: format(parseISO(m.date), 'MMM dd'),
      weight: m.weight
    }))

  // Get recent BP data for chart
  const recentBPData = healthData.metrics
    .filter(m => m.bloodPressureSystolic && m.bloodPressureDiastolic)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(m => ({
      date: format(parseISO(m.date), 'MMM dd'),
      systolic: m.bloodPressureSystolic,
      diastolic: m.bloodPressureDiastolic
    }))

  return (
    <div className="space-y-6">
      {/* Daily Goals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Goals</CardTitle>
          <CardDescription>Track your progress today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Medications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Medications</span>
              </div>
              <Badge variant={dashboardSummary.todaysMedicationsTaken === dashboardSummary.todaysMedicationsTotal ? 'default' : 'secondary'}>
                {dashboardSummary.todaysMedicationsTaken} of {dashboardSummary.todaysMedicationsTotal} taken
              </Badge>
            </div>
            <Progress 
              value={(dashboardSummary.todaysMedicationsTaken / dashboardSummary.todaysMedicationsTotal) * 100 || 0}
              className="h-2"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-green-500" />
                <span className="font-medium">Steps</span>
              </div>
              <Badge variant={dashboardSummary.todaysSteps >= dashboardSummary.stepsGoal ? 'default' : 'secondary'}>
                {dashboardSummary.todaysSteps.toLocaleString()} / {dashboardSummary.stepsGoal.toLocaleString()}
              </Badge>
            </div>
            <Progress 
              value={(dashboardSummary.todaysSteps / dashboardSummary.stepsGoal) * 100}
              className="h-2"
            />
          </div>

          {/* Water Intake */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Water Intake</span>
              </div>
              <Badge variant={dashboardSummary.waterIntake >= dashboardSummary.waterGoal ? 'default' : 'destructive'}>
                {dashboardSummary.waterIntake} oz / {dashboardSummary.waterGoal} oz
              </Badge>
            </div>
            <Progress 
              value={(dashboardSummary.waterIntake / dashboardSummary.waterGoal) * 100}
              className="h-2"
            />
          </div>

          {/* Active Minutes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Active Minutes</span>
              </div>
              <Badge variant={dashboardSummary.activeMinutes >= dashboardSummary.activeMinutesGoal ? 'default' : 'secondary'}>
                {dashboardSummary.activeMinutes} / {dashboardSummary.activeMinutesGoal} min
              </Badge>
            </div>
            <Progress 
              value={(dashboardSummary.activeMinutes / dashboardSummary.activeMinutesGoal) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#appointments">View All →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardSummary.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            ) : (
              dashboardSummary.upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{apt.providerName} - {apt.providerSpecialty}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(apt.dateTime), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <p className="text-sm">{apt.reasonForVisit}</p>
                    {apt.location && (
                      <p className="text-xs text-muted-foreground">📍 {apt.location}</p>
                    )}
                    {apt.remindersSet && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Reminder set
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Active Symptoms
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#symptoms">View All →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardSummary.activeSymptoms.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No active symptoms
              </p>
            ) : (
              dashboardSummary.activeSymptoms.map((symptom) => (
                <div key={symptom.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${
                    symptom.severity === 'severe' ? 'text-red-500' :
                    symptom.severity === 'moderate' ? 'text-orange-500' : 'text-yellow-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{symptom.name}</p>
                      <Badge variant={
                        symptom.severity === 'severe' ? 'destructive' :
                        symptom.severity === 'moderate' ? 'default' : 'secondary'
                      }>
                        {symptom.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started: {format(parseISO(symptom.dateRecorded), 'MMM dd')} 
                      ({differenceInDays(new Date(), parseISO(symptom.dateRecorded))} days ago)
                    </p>
                    {symptom.location && (
                      <p className="text-xs text-muted-foreground">Location: {symptom.location}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weight Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWeightData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={recentWeightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="text-xl font-bold">{recentWeightData[recentWeightData.length - 1]?.weight} lbs</p>
                  </div>
                  {recentWeightData.length > 1 && (
                    <div>
                      <p className="text-muted-foreground">Change</p>
                      <p className="text-xl font-bold">
                        {((recentWeightData[recentWeightData.length - 1]?.weight || 0) - (recentWeightData[0]?.weight || 0)).toFixed(1)} lbs
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No weight data recorded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Blood Pressure Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Blood Pressure (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBPData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={recentBPData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[60, 160]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                    <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Latest</p>
                    <p className="text-xl font-bold">
                      {recentBPData[recentBPData.length - 1]?.systolic}/{recentBPData[recentBPData.length - 1]?.diastolic}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="default">Normal</Badge>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No blood pressure data recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Log Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Log</CardTitle>
          <CardDescription>Quickly log health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Pill className="h-5 w-5" />
              <span className="text-sm">Medication</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm">Metrics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              💪
              <span className="text-sm">Workout</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              🍽️
              <span className="text-sm">Meal</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Health Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboardSummary.todaysSteps >= dashboardSummary.stepsGoal && (
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Great job!</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You've hit your step goal today!
                </p>
              </div>
            </div>
          )}
          
          {dashboardSummary.medicationReminders.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">Refills Needed</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {dashboardSummary.medicationReminders.length} medication{dashboardSummary.medicationReminders.length > 1 ? 's' : ''} need refills
                </p>
              </div>
            </div>
          )}

          {dashboardSummary.sleepQuality > 0 && dashboardSummary.sleepQuality >= 8 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Great Sleep!</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your sleep quality was {dashboardSummary.sleepQuality}/10 last night
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

















