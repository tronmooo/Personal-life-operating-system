'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, Heart, Weight, TrendingUp, Pill, Calendar,
  Droplet, Moon, Dumbbell, Apple, Target, CheckCircle, AlertCircle
} from 'lucide-react'

interface HealthCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function HealthCard({ size, data }: HealthCardProps) {
  const health = data?.health || []
  const vitals = getLatestVitals(health, data)
  const medications = health.filter((h: any) => h.type === 'medication')
  const appointments = health.filter((h: any) => h.type === 'appointment')
  const bmi = calculateBMI(vitals.weight, vitals.height)
  const bmiCategory = getBMICategory(bmi)
  const dailyGoals = getDailyGoals(data)
  const healthScore = calculateHealthScore(vitals, dailyGoals)

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-2">
            <Heart className="h-5 w-5 text-red-600" />
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              healthScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              healthScore >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {healthScore}%
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">
              {vitals.heartRate}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">BPM</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Health
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              healthScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {healthScore}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-red-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Heart Rate</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {vitals.heartRate}
              </p>
              <p className="text-xs text-gray-500">BPM</p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Weight className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Weight</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {vitals.weight}
              </p>
              <p className="text-xs text-gray-500">lbs</p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">BMI</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {bmi}
              </p>
              <p className="text-xs text-gray-500">{bmiCategory}</p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Workouts</span>
              </div>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {dailyGoals.workouts}/7
              </p>
              <p className="text-xs text-gray-500">This week</p>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            View Trends
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Large size - Full health dashboard
  return (
    <Card className="h-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Health Dashboard
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
              healthScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              healthScore >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {healthScore >= 80 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {healthScore}% Score
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vital Signs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
            <Activity className="h-4 w-4 text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {vitals.heartRate}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Heart Rate</p>
            <p className="text-xs text-gray-500">BPM</p>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <Weight className="h-4 w-4 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {vitals.weight}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
            <p className="text-xs text-gray-500">lbs</p>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
            <Target className="h-4 w-4 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {bmi}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">BMI</p>
            <p className="text-xs text-gray-500">{bmiCategory}</p>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Blood Pressure</p>
            <p className="text-xs text-gray-500">mmHg</p>
          </div>
        </div>

        {/* Daily Goals Progress */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm">Daily Goals</span>
          </div>
          <div className="space-y-3">
            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-orange-600" />
                  <span className="text-sm">Steps</span>
                </div>
                <span className="text-sm font-medium">{dailyGoals.steps.toLocaleString()}/10,000</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${Math.min((dailyGoals.steps / 10000) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Water */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Droplet className="h-3 w-3 text-blue-600" />
                  <span className="text-sm">Water</span>
                </div>
                <span className="text-sm font-medium">{dailyGoals.water}/8 glasses</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(dailyGoals.water / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Sleep */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Moon className="h-3 w-3 text-indigo-600" />
                  <span className="text-sm">Sleep</span>
                </div>
                <span className="text-sm font-medium">{dailyGoals.sleep}/8 hours</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${(dailyGoals.sleep / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Calories */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Apple className="h-3 w-3 text-green-600" />
                  <span className="text-sm">Calories</span>
                </div>
                <span className="text-sm font-medium">{dailyGoals.calories.toLocaleString()}/2000</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((dailyGoals.calories / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medications & Appointments */}
        <div className="grid grid-cols-2 gap-3">
          {medications.length > 0 && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-sm">Medications</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {medications.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Active prescriptions
              </p>
            </div>
          )}

          {appointments.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-sm">Appointments</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {appointments.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Upcoming visits
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Activity className="h-4 w-4 mr-2" />
            Log
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getLatestVitals(health: any[], data: any) {
  const defaultVitals = {
    heartRate: data?.vitals?.heartRate || 72,
    weight: data?.vitals?.weight || 165,
    height: data?.vitals?.height || 70, // inches
    bloodPressure: data?.vitals?.bloodPressure || { systolic: 120, diastolic: 80 },
  }

  if (!Array.isArray(health) || health.length === 0) {
    return defaultVitals
  }

  const vitals = health.filter((h: any) => h.type === 'vital')
  const latest = vitals[vitals.length - 1] || {}

  return {
    heartRate: latest.heartRate || defaultVitals.heartRate,
    weight: latest.weight || defaultVitals.weight,
    height: latest.height || defaultVitals.height,
    bloodPressure: latest.bloodPressure || defaultVitals.bloodPressure,
  }
}

function calculateBMI(weight: number, height: number): number {
  // BMI = (weight in lbs / (height in inches)²) * 703
  if (!weight || !height) return 0
  return Math.round((weight / (height * height)) * 703 * 10) / 10
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function getDailyGoals(data: any) {
  return {
    steps: data?.dailyGoals?.steps || 7500,
    water: data?.dailyGoals?.water || 6,
    sleep: data?.dailyGoals?.sleep || 7,
    calories: data?.dailyGoals?.calories || 1800,
    workouts: data?.weeklyWorkouts || 4,
  }
}

function calculateHealthScore(vitals: any, goals: any): number {
  let score = 0

  // Heart rate (20 points)
  if (vitals.heartRate >= 60 && vitals.heartRate <= 100) score += 20
  else if (vitals.heartRate >= 50 && vitals.heartRate <= 110) score += 15

  // BMI (20 points)
  const bmi = calculateBMI(vitals.weight, vitals.height)
  if (bmi >= 18.5 && bmi < 25) score += 20
  else if (bmi >= 25 && bmi < 30) score += 15

  // Blood pressure (20 points)
  if (vitals.bloodPressure.systolic < 120 && vitals.bloodPressure.diastolic < 80) score += 20
  else if (vitals.bloodPressure.systolic < 140 && vitals.bloodPressure.diastolic < 90) score += 15

  // Daily goals (40 points total)
  score += Math.min((goals.steps / 10000) * 10, 10) // Steps (10 points)
  score += Math.min((goals.water / 8) * 10, 10) // Water (10 points)
  score += Math.min((goals.sleep / 8) * 10, 10) // Sleep (10 points)
  score += Math.min((goals.workouts / 5) * 10, 10) // Workouts (10 points)

  return Math.round(score)
}


























