'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Activity as ActivityIcon, Flame, Clock, Plus, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { estimateStepsFromActivity, estimateCaloriesBurned } from '@/lib/utils/fitness-calculations'

type TimePeriod = '7days' | '30days' | '90days'

interface FitnessActivity {
  id: string
  activityType: string
  duration: number
  calories: number
  steps?: number
  distance?: number
  exercises?: string
  notes?: string
  date: string
}

interface DashboardTabProps {
  onAddActivity?: () => void
}

interface PeriodStats {
  totalSteps: number
  totalCalories: number
  totalMinutes: number
  totalDistance: number
  totalWorkouts: number
  avgCaloriesPerWorkout: number
  avgStepsPerDay: number
  avgMinutesPerDay: number
}

export function DashboardTab({ onAddActivity }: DashboardTabProps = {}) {
  const { getData, isLoading, isLoaded } = useData()
  const [activities, setActivities] = useState<FitnessActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days')

  // Load activities from DataProvider
  const loadActivities = () => {
    console.log('💪 FITNESS DASHBOARD: Loading activities...')
    setLoading(true)
    const fitnessData = getData('fitness') as any[]
    console.log('💪 FITNESS DASHBOARD: Raw fitness data count:', fitnessData.length)
    
    const acts = fitnessData
      // Accept multiple shapes: metadata.itemType==='activity', metadata.logType, or type fields
      .filter(item => {
        // FIX: Handle double-nesting bug (some old entries have metadata.metadata)
        let m = item?.metadata || item
        if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
          m = m.metadata
        }
        const t = m?.itemType || m?.type || m?.logType
        const isActivity = t === 'activity' || t === 'workout' || t === 'exercise'
        if (!isActivity && fitnessData.length < 20) {
          console.log('💪 FITNESS DASHBOARD: Filtering out non-activity item:', item.id, 'type:', t)
        }
        return isActivity
      })
      .map(item => {
        let m = item?.metadata || item.data || {}
        // Handle double-nesting
        if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
          m = m.metadata
        }
        const ts = m.date || item.timestamp || item.createdAt
        return {
          id: item.id,
          activityType: m.activityType || m.workout_type || m.type || 'Other',
          duration: Number(m.duration || m.value || 0),
          calories: Number(m.calories || m.caloriesBurned || item.value || 0),
          steps: m.steps ? Number(m.steps) : undefined,
          distance: m.distance ? Number(m.distance) : undefined,
          exercises: m.exercises || item.description,
          notes: m.notes,
          date: typeof ts === 'string' ? ts : new Date(ts).toISOString(),
        } as FitnessActivity
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('✅ FITNESS DASHBOARD: Loaded', acts.length, 'activities')
    setActivities(acts)
    setLoading(false)
  }

  useEffect(() => {
    if (isLoaded) {
      loadActivities()
    }
  }, [isLoaded])

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => loadActivities()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('fitness-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('fitness-data-updated', handleUpdate)
    }
  }, [])

  // Get number of days based on selected period
  const getPeriodDays = () => {
    switch (timePeriod) {
      case '7days': return 7
      case '30days': return 30
      case '90days': return 90
      default: return 7
    }
  }

  // Filter activities by selected time period
  const getActivitiesForPeriod = (days: number) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    cutoffDate.setHours(0, 0, 0, 0)
    
    return activities.filter(a => {
      const activityDate = new Date(a.date)
      return activityDate >= cutoffDate
    })
  }

  // Normalize activities with estimated values
  const normalizeActivity = (a: FitnessActivity) => ({
    ...a,
    steps: a.steps ?? estimateStepsFromActivity(a.activityType, a.duration),
    calories: (a.calories && a.calories > 0) ? a.calories : estimateCaloriesBurned(a.activityType, a.duration),
  })

  const periodDays = getPeriodDays()
  const periodActivities = getActivitiesForPeriod(periodDays)
  const normalized = periodActivities.map(normalizeActivity)

  // Calculate stats for current period
  const calculatePeriodStats = (acts: FitnessActivity[]): PeriodStats => {
    const norm = acts.map(normalizeActivity)
    const totalSteps = norm.reduce((sum, a) => sum + (a.steps || 0), 0)
    const totalCalories = norm.reduce((sum, a) => sum + (a.calories || 0), 0)
    const totalMinutes = acts.reduce((sum, a) => sum + a.duration, 0)
    const totalDistance = acts.reduce((sum, a) => sum + (a.distance || 0), 0)
    const totalWorkouts = acts.length
    
    return {
      totalSteps,
      totalCalories,
      totalMinutes,
      totalDistance,
      totalWorkouts,
      avgCaloriesPerWorkout: totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0,
      avgStepsPerDay: Math.round(totalSteps / periodDays),
      avgMinutesPerDay: Math.round(totalMinutes / periodDays)
    }
  }

  const currentStats = calculatePeriodStats(periodActivities)
  
  // Calculate previous period stats for comparison
  const getPreviousPeriodActivities = () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)
    cutoffDate.setHours(0, 0, 0, 0)
    
    const previousCutoffDate = new Date()
    previousCutoffDate.setDate(previousCutoffDate.getDate() - (periodDays * 2))
    previousCutoffDate.setHours(0, 0, 0, 0)
    
    return activities.filter(a => {
      const activityDate = new Date(a.date)
      return activityDate >= previousCutoffDate && activityDate < cutoffDate
    })
  }

  const previousStats = calculatePeriodStats(getPreviousPeriodActivities())

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): { percent: number; isIncrease: boolean } => {
    if (previous === 0) return { percent: 0, isIncrease: true }
    const percent = ((current - previous) / previous) * 100
    return {
      percent: Math.abs(Math.round(percent)),
      isIncrease: percent >= 0
    }
  }

  // Get chart data for selected period
  const getChartDataForPeriod = () => {
    const chartDays = []
    const today = new Date()
    
    // Determine number of data points based on period
    const dataPoints = periodDays <= 7 ? periodDays : periodDays <= 30 ? 10 : 15
    const daysPerPoint = Math.ceil(periodDays / dataPoints)
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - (i * daysPerPoint))
      const dateStr = date.toISOString().split('T')[0]
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`
      
      // Get activities for this data point window
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + daysPerPoint)
      
      const windowActivities = normalized.filter(a => {
        const actDate = new Date(a.date)
        return actDate >= startDate && actDate < endDate
      })
      
      const calories = windowActivities.reduce((sum, a) => sum + (a.calories || 0), 0)
      const steps = windowActivities.reduce((sum, a) => sum + (a.steps || 0), 0)
      const minutes = windowActivities.reduce((sum, a) => sum + a.duration, 0)
      const distance = windowActivities.reduce((sum, a) => sum + (a.distance || 0), 0)
      
      chartDays.push({
        date: monthDay,
        calories,
        steps,
        minutes,
        distance
      })
    }
    
    return chartDays
  }

  const chartData = getChartDataForPeriod()

  // Activity distribution
  const activityDistribution = activities.reduce((acc, activity) => {
    const type = activity.activityType || 'Other'
    if (!acc[type]) {
      acc[type] = 0
    }
    acc[type]++
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(activityDistribution).map(([name, value]) => ({
    name,
    value
  }))

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#a855f7', '#ec4899']

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading fitness data...</p>
        </div>
      </div>
    )
  }

  // Show empty state with CTA
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Flame className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-bold mb-2">No Workouts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your fitness activities to see your progress and stats here.
            </p>
            <Button onClick={onAddActivity}>
              <Plus className="mr-2 h-4 w-4" /> Log Your First Workout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper component for comparison indicator
  const ComparisonIndicator = ({ current, previous }: { current: number; previous: number }) => {
    const change = calculateChange(current, previous)
    return (
      <div className={`flex items-center gap-1 text-sm ${change.isIncrease ? 'text-green-200' : 'text-red-200'}`}>
        {change.isIncrease ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        <span>{change.percent}% vs last period</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Time Period</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timePeriod === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('7days')}
            >
              7 Days
            </Button>
            <Button
              variant={timePeriod === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('30days')}
            >
              30 Days
            </Button>
            <Button
              variant={timePeriod === '90days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('90days')}
            >
              90 Days
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Steps */}
        <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 mb-1">Total Steps</p>
              <p className="text-5xl font-bold">{currentStats.totalSteps.toLocaleString()}</p>
              <p className="text-indigo-100 mt-2">{currentStats.totalWorkouts} workouts</p>
              <ComparisonIndicator current={currentStats.totalSteps} previous={previousStats.totalSteps} />
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* Total Calories */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-green-100 mb-1">Total Calories</p>
              <p className="text-5xl font-bold">{currentStats.totalCalories.toLocaleString()}</p>
              <p className="text-green-100 mt-2">Avg: {currentStats.avgCaloriesPerWorkout}/workout</p>
              <ComparisonIndicator current={currentStats.totalCalories} previous={previousStats.totalCalories} />
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Flame className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* Total Minutes */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-purple-100 mb-1">Total Minutes</p>
              <p className="text-5xl font-bold">{currentStats.totalMinutes}</p>
              <p className="text-purple-100 mt-2">{Math.floor(currentStats.totalMinutes / 60)}h {currentStats.totalMinutes % 60}m total</p>
              <ComparisonIndicator current={currentStats.totalMinutes} previous={previousStats.totalMinutes} />
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* Total Distance */}
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-orange-100 mb-1">Total Distance</p>
              <p className="text-5xl font-bold">{currentStats.totalDistance.toFixed(1)}</p>
              <p className="text-orange-100 mt-2">miles traveled</p>
              <ComparisonIndicator current={currentStats.totalDistance} previous={previousStats.totalDistance} />
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calories Burned Over Time */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold">Calories Burned Over Time</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calories" fill="#10b981" name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Steps Progress */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Steps Progress</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="steps" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                  name="Steps"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-bold">Activity Distribution</h3>
          </div>
          {pieData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <p>No activities logged yet</p>
            </div>
          )}
        </Card>

        {/* Workout Duration */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl font-bold">Workout Duration</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="#a855f7" name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

