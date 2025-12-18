'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  ComposedChart, ReferenceLine
} from 'recharts'
import {
  ChevronLeft, ChevronRight, Flame, Droplets, Beef, Wheat,
  Apple, Target, TrendingUp, TrendingDown, Minus, Award,
  Calendar, BarChart3, Activity, Zap, Trophy, Medal, Star
} from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

type TimePeriod = '7d' | '30d' | '90d'

interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  water: number
}

interface DayData {
  date: string
  day: string
  shortDate: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  water: number
  calorieGoal: number
  proteinGoal: number
  carbsGoal: number
  waterGoal: number
  hasData: boolean
}

interface MacroData {
  name: string
  value: number
  grams: number
  color: string
  goal: number
}

interface GoalProgressData {
  name: string
  value: number
  fill: string
  current: number
  goal: number
}

interface WeekData {
  week: string
  avgCalories: number
  avgProtein: number
  avgWater: number
  daysTracked?: number
}

export function DashboardView() {
  const { getData } = useData()
  const [period, setPeriod] = useState<TimePeriod>('7d')
  const [activeTab, setActiveTab] = useState('overview')

  // Get all nutrition data
  const nutritionData = useMemo(() => getData('nutrition') || [], [getData])

  // Get nutrition goals
  const goals = useMemo((): NutritionGoals => {
    const goalsItem = nutritionData.find((item: any) => {
      const meta = item.metadata || {}
      return String(meta.itemType ?? meta.type ?? '').toLowerCase() === 'nutrition-goals'
    })

    if (goalsItem?.metadata) {
      return {
        calories: Number(goalsItem.metadata.caloriesGoal) || 2000,
        protein: Number(goalsItem.metadata.proteinGoal) || 150,
        carbs: Number(goalsItem.metadata.carbsGoal) || 250,
        fats: Number(goalsItem.metadata.fatsGoal) || 65,
        fiber: Number(goalsItem.metadata.fiberGoal) || 30,
        water: Number(goalsItem.metadata.waterGoal) || 64,
      }
    }
    return { calories: 2000, protein: 150, carbs: 250, fats: 65, fiber: 30, water: 64 }
  }, [nutritionData])

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    // Get today's date in LOCAL timezone (not UTC)
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    const todayData = nutritionData.filter((item: any) => {
      // Handle multiple possible date fields (createdAt vs created_at)
      const rawDate = item.metadata?.date || item.createdAt || item.created_at || ''
      if (!rawDate) return false
      
      // Parse and compare in LOCAL timezone
      const itemDate = new Date(rawDate)
      const itemLocalDate = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`
      
      return itemLocalDate === today &&
        item.metadata?.itemType !== 'nutrition-goals' &&
        item.metadata?.itemType !== 'nutrition-history'
    })

    return todayData.reduce((totals: any, item: any) => {
      const metadata = item.metadata?.metadata || item.metadata || {}
      
      // 🔧 FIX: Check for water entry using BOTH type AND itemType field names
      const isWaterEntry = metadata.type === 'water' || 
                           metadata.itemType === 'water' || 
                           metadata.logType === 'water'
      
      let waterAmount = 0
      if (isWaterEntry) {
        waterAmount = Number(metadata.value || metadata.amount || metadata.water || 0)
      } else {
        waterAmount = Number(metadata.water || metadata.waterOz || 0)
      }

      // 🔧 FIX: Count meals using both type and itemType
      const isMealEntry = metadata.mealType || 
                          metadata.type === 'meal' || 
                          metadata.itemType === 'meal' ||
                          metadata.logType === 'meal'

      return {
        calories: totals.calories + (Number(metadata.calories) || 0),
        protein: totals.protein + (Number(metadata.protein) || 0),
        carbs: totals.carbs + (Number(metadata.carbs) || 0),
        fats: totals.fats + (Number(metadata.fats) || 0),
        fiber: totals.fiber + (Number(metadata.fiber) || 0),
        water: totals.water + waterAmount,
        meals: totals.meals + (isMealEntry ? 1 : 0)
      }
    }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 0, meals: 0 })
  }, [nutritionData])

  // Generate historical data for charts based on period
  const periodData = useMemo((): DayData[] => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data: DayData[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      // Use LOCAL timezone for date string
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      const dayData = nutritionData.filter((item: any) => {
        // Handle multiple possible date fields
        const rawDate = item.metadata?.date || item.createdAt || item.created_at || ''
        if (!rawDate) return false
        
        // Parse and compare in LOCAL timezone
        const itemDate = new Date(rawDate)
        const itemLocalDate = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`
        
        return itemLocalDate === dateStr &&
          item.metadata?.itemType !== 'nutrition-goals' &&
          item.metadata?.itemType !== 'nutrition-history'
      })

      const dayTotals = dayData.reduce((totals: any, item: any) => {
        const metadata = item.metadata?.metadata || item.metadata || {}
        
        // 🔧 FIX: Check for water entry using BOTH type AND itemType field names
        const isWaterEntry = metadata.type === 'water' || 
                             metadata.itemType === 'water' || 
                             metadata.logType === 'water'
        
        let waterAmount = 0
        if (isWaterEntry) {
          waterAmount = Number(metadata.value || metadata.amount || metadata.water || 0)
        } else {
          waterAmount = Number(metadata.water || metadata.waterOz || 0)
        }

        return {
          calories: totals.calories + (Number(metadata.calories) || 0),
          protein: totals.protein + (Number(metadata.protein) || 0),
          carbs: totals.carbs + (Number(metadata.carbs) || 0),
          fats: totals.fats + (Number(metadata.fats) || 0),
          fiber: totals.fiber + (Number(metadata.fiber) || 0),
          water: totals.water + waterAmount,
        }
      }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 0 })

      data.push({
        date: dateStr,
        day: days <= 7 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] :
             days <= 30 ? `${date.getMonth() + 1}/${date.getDate()}` :
             `W${Math.ceil((i + 1) / 7)}`,
        shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
        ...dayTotals,
        calorieGoal: goals.calories,
        proteinGoal: goals.protein,
        carbsGoal: goals.carbs,
        waterGoal: goals.water,
        hasData: dayTotals.calories > 0 || dayTotals.water > 0,
      })
    }

    return data
  }, [nutritionData, period, goals])

  // Calculate period statistics
  const periodStats = useMemo(() => {
    const daysWithData = periodData.filter(d => d.hasData)
    const count = daysWithData.length || 1

    const totals = daysWithData.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
      fiber: acc.fiber + day.fiber,
      water: acc.water + day.water,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, water: 0 })

    // Calculate streak
    let streak = 0
    for (let i = periodData.length - 1; i >= 0; i--) {
      if (periodData[i].hasData) streak++
      else break
    }

    // Count goal achievements
    const calorieGoalDays = daysWithData.filter(d => d.calories >= goals.calories * 0.8 && d.calories <= goals.calories * 1.2).length
    const proteinGoalDays = daysWithData.filter(d => d.protein >= goals.protein * 0.9).length
    const waterGoalDays = daysWithData.filter(d => d.water >= goals.water * 0.9).length

    return {
      avgCalories: Math.round(totals.calories / count),
      avgProtein: Math.round(totals.protein / count),
      avgCarbs: Math.round(totals.carbs / count),
      avgFats: Math.round(totals.fats / count),
      avgFiber: Math.round(totals.fiber / count),
      avgWater: Math.round(totals.water / count),
      totalCalories: totals.calories,
      totalWater: totals.water,
      daysTracked: daysWithData.length,
      totalDays: periodData.length,
      streak,
      calorieGoalDays,
      proteinGoalDays,
      waterGoalDays,
      bestDay: daysWithData.reduce((best, day) =>
        day.protein > (best?.protein || 0) ? day : best, daysWithData[0]),
      worstDay: daysWithData.reduce((worst, day) =>
        day.calories > goals.calories * 1.5 || day.calories < goals.calories * 0.5
          ? (worst ? (Math.abs(day.calories - goals.calories) > Math.abs(worst.calories - goals.calories) ? day : worst) : day)
          : worst, null as any),
    }
  }, [periodData, goals])

  // Calculate trends (compare first half to second half)
  const trends = useMemo(() => {
    const halfIdx = Math.floor(periodData.length / 2)
    const firstHalf = periodData.slice(0, halfIdx).filter(d => d.hasData)
    const secondHalf = periodData.slice(halfIdx).filter(d => d.hasData)

    const calcAvg = (arr: any[], key: string) => arr.length ? arr.reduce((sum, d) => sum + d[key], 0) / arr.length : 0

    return {
      calories: calcAvg(secondHalf, 'calories') - calcAvg(firstHalf, 'calories'),
      protein: calcAvg(secondHalf, 'protein') - calcAvg(firstHalf, 'protein'),
      carbs: calcAvg(secondHalf, 'carbs') - calcAvg(firstHalf, 'carbs'),
      water: calcAvg(secondHalf, 'water') - calcAvg(firstHalf, 'water'),
    }
  }, [periodData])

  // Macro distribution for pie chart
  const macroDistribution = useMemo((): MacroData[] => {
    const total = todayTotals.protein * 4 + todayTotals.carbs * 4 + todayTotals.fats * 9
    if (total === 0) return []

    return [
      { name: 'Protein', value: Math.round((todayTotals.protein * 4 / total) * 100), grams: todayTotals.protein, color: '#3b82f6', goal: goals.protein },
      { name: 'Carbs', value: Math.round((todayTotals.carbs * 4 / total) * 100), grams: todayTotals.carbs, color: '#10b981', goal: goals.carbs },
      { name: 'Fats', value: Math.round((todayTotals.fats * 9 / total) * 100), grams: todayTotals.fats, color: '#f59e0b', goal: goals.fats },
    ]
  }, [todayTotals, goals])

  // Goal progress for radial chart
  const goalProgress = useMemo((): GoalProgressData[] => [
    { name: 'Calories', value: Math.min(Math.round((todayTotals.calories / goals.calories) * 100), 100), fill: '#10b981', current: todayTotals.calories, goal: goals.calories },
    { name: 'Protein', value: Math.min(Math.round((todayTotals.protein / goals.protein) * 100), 100), fill: '#3b82f6', current: todayTotals.protein, goal: goals.protein },
    { name: 'Water', value: Math.min(Math.round((todayTotals.water / goals.water) * 100), 100), fill: '#06b6d4', current: todayTotals.water, goal: goals.water },
    { name: 'Fiber', value: Math.min(Math.round((todayTotals.fiber / goals.fiber) * 100), 100), fill: '#8b5cf6', current: todayTotals.fiber, goal: goals.fiber },
  ], [todayTotals, goals])

  // Nutrition score calculation
  const nutritionScore = useMemo(() => {
    let score = 0
    const calPercent = todayTotals.calories / goals.calories
    const proteinPercent = todayTotals.protein / goals.protein
    const waterPercent = todayTotals.water / goals.water
    const fiberPercent = todayTotals.fiber / goals.fiber

    // Calories (30 points) - penalize both under and over eating
    if (calPercent >= 0.9 && calPercent <= 1.1) score += 30
    else if (calPercent >= 0.8 && calPercent <= 1.2) score += 22
    else if (calPercent >= 0.6 && calPercent <= 1.4) score += 15

    // Protein (25 points)
    score += Math.min(proteinPercent, 1) * 25

    // Water (25 points)
    score += Math.min(waterPercent, 1) * 25

    // Fiber (10 points)
    score += Math.min(fiberPercent, 1) * 10

    // Macro balance (10 points)
    if (macroDistribution.length > 0) {
      const proteinPct = macroDistribution.find(m => m.name === 'Protein')?.value || 0
      if (proteinPct >= 20 && proteinPct <= 35) score += 10
      else if (proteinPct >= 15 && proteinPct <= 40) score += 5
    }

    return Math.round(score)
  }, [todayTotals, goals, macroDistribution])

  // Weekly comparison data (for 30d and 90d views)
  const weeklyData = useMemo((): WeekData[] => {
    if (period === '7d') return []

    const weeks: WeekData[] = []
    const weeksCount = period === '30d' ? 4 : 13

    for (let w = 0; w < weeksCount; w++) {
      const weekDays = periodData.slice(w * 7, (w + 1) * 7)
      const daysWithData = weekDays.filter(d => d.hasData)

      if (daysWithData.length === 0) {
        weeks.push({ week: `W${w + 1}`, avgCalories: 0, avgProtein: 0, avgWater: 0 })
        continue
      }

      weeks.push({
        week: `W${w + 1}`,
        avgCalories: Math.round(daysWithData.reduce((sum, d) => sum + d.calories, 0) / daysWithData.length),
        avgProtein: Math.round(daysWithData.reduce((sum, d) => sum + d.protein, 0) / daysWithData.length),
        avgWater: Math.round(daysWithData.reduce((sum, d) => sum + d.water, 0) / daysWithData.length),
        daysTracked: daysWithData.length,
      })
    }

    return weeks
  }, [periodData, period])

  const TrendIndicator = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
    if (Math.abs(value) < 1) return <Minus className="h-3 w-3 text-gray-400" />
    return value > 0 ? (
      <span className="flex items-center gap-1 text-green-600 text-xs">
        <TrendingUp className="h-3 w-3" />+{Math.round(value)}{suffix}
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-600 text-xs">
        <TrendingDown className="h-3 w-3" />{Math.round(value)}{suffix}
      </span>
    )
  }

  const periodLabels = {
    '7d': '7 Day',
    '30d': '30 Day',
    '90d': '90 Day'
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector and Score */}
      <Card className="p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2">Nutrition Dashboard</h2>
            <p className="text-green-100">Track your nutrition journey and achieve your goals</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Period Selector */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
              <TabsList className="bg-white/20">
                <TabsTrigger value="7d" className="data-[state=active]:bg-white data-[state=active]:text-green-600">7 Days</TabsTrigger>
                <TabsTrigger value="30d" className="data-[state=active]:bg-white data-[state=active]:text-green-600">30 Days</TabsTrigger>
                <TabsTrigger value="90d" className="data-[state=active]:bg-white data-[state=active]:text-green-600">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Score Badge */}
            <div className="flex flex-col items-center bg-white/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Today's Score</span>
              </div>
              <span className={`text-4xl font-bold ${
                nutritionScore >= 80 ? 'text-yellow-300' :
                nutritionScore >= 60 ? 'text-white' :
                'text-orange-200'
              }`}>
                {nutritionScore}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Progress */}
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Today's Progress
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Calories */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-sm">Calories</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                {todayTotals.calories.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">/ {goals.calories}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  todayTotals.calories > goals.calories * 1.2 ? 'bg-red-500' :
                  todayTotals.calories > goals.calories ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((todayTotals.calories / goals.calories) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round((todayTotals.calories / goals.calories) * 100)}% of goal</p>
          </div>

          {/* Protein */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Beef className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-sm">Protein</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {todayTotals.protein}g
              </span>
              <span className="text-sm text-gray-500">/ {goals.protein}g</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all rounded-full"
                style={{ width: `${Math.min((todayTotals.protein / goals.protein) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round((todayTotals.protein / goals.protein) * 100)}% of goal</p>
          </div>

          {/* Water */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-5 w-5 text-cyan-500" />
              <span className="font-medium text-sm">Water</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                {todayTotals.water} oz
              </span>
              <span className="text-sm text-gray-500">/ {goals.water} oz</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all rounded-full"
                style={{ width: `${Math.min((todayTotals.water / goals.water) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round((todayTotals.water / goals.water) * 100)}% of goal</p>
          </div>

          {/* Fiber */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="h-5 w-5 text-purple-500" />
              <span className="font-medium text-sm">Fiber</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {todayTotals.fiber}g
              </span>
              <span className="text-sm text-gray-500">/ {goals.fiber}g</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all rounded-full"
                style={{ width: `${Math.min((todayTotals.fiber / goals.fiber) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round((todayTotals.fiber / goals.fiber) * 100)}% of goal</p>
          </div>
        </div>

        {/* Goal Progress Radial Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Goal Progress
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="25%"
                  outerRadius="90%"
                  barSize={12}
                  data={goalProgress}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar background dataKey="value" cornerRadius={6} />
                  <Tooltip
                    formatter={(value: number, name: string, props: { payload?: GoalProgressData }) => [
                      `${props.payload?.current ?? 0} / ${props.payload?.goal ?? 0} (${value}%)`,
                      name
                    ]}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Macro Distribution */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Macro Distribution
            </h4>
            {macroDistribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {macroDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {macroDistribution.map((macro) => (
                    <div key={macro.name} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                        <span className="text-sm font-medium">{macro.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{macro.grams}g</span>
                        <span className="text-xs text-gray-500 ml-1">({macro.value}%)</span>
                        <div className="text-xs text-gray-400">Goal: {macro.goal}g</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Apple className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No meals logged today</p>
                  <p className="text-sm">Log your first meal to see macros</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Period Analytics */}
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            {periodLabels[period]} Analytics
          </h3>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Star className="h-3 w-3 mr-1" />
              {periodStats.daysTracked}/{periodStats.totalDays} days tracked
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <Zap className="h-3 w-3 mr-1" />
              {periodStats.streak} day streak
            </Badge>
          </div>
        </div>

        {/* Calorie Trend Chart */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Calorie Trend
            </h4>
            <TrendIndicator value={trends.calories} suffix=" cal" />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={periodData}>
                <defs>
                  <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={period === '7d' ? 'day' : 'shortDate'}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  interval={period === '7d' ? 0 : period === '30d' ? 3 : 10}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} ${name === 'calorieGoal' ? '(goal)' : ''}`,
                    name === 'calories' ? 'Calories' : 'Goal'
                  ]}
                  labelFormatter={(label, payload) => (payload?.[0]?.payload as DayData)?.date || String(label)}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#calorieGrad)"
                  name="Calories"
                />
                <ReferenceLine y={goals.calories} stroke="#f59e0b" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="calorieGoal"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Goal"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protein & Water Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Protein Trend */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Beef className="h-4 w-4 text-blue-500" />
                Protein Trend
              </h4>
              <TrendIndicator value={trends.protein} suffix="g" />
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={periodData}>
                  <defs>
                    <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey={period === '7d' ? 'day' : 'shortDate'}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={period === '7d' ? 0 : period === '30d' ? 4 : 13}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v}g`, 'Protein']} />
                  <Area type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} fill="url(#proteinGrad)" />
                  <ReferenceLine y={goals.protein} stroke="#f59e0b" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Intake */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />
                Water Intake
              </h4>
              <TrendIndicator value={trends.water} suffix=" oz" />
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey={period === '7d' ? 'day' : 'shortDate'}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={period === '7d' ? 0 : period === '30d' ? 4 : 13}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} oz`, 'Water']} />
                  <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={goals.water} stroke="#f59e0b" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Macros Over Time (for 30d/90d) */}
        {period !== '7d' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Macros Over Time
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={period === '30d' ? 4 : 10}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} dot={false} name="Protein (g)" />
                  <Line type="monotone" dataKey="carbs" stroke="#10b981" strokeWidth={2} dot={false} name="Carbs (g)" />
                  <Line type="monotone" dataKey="fats" stroke="#f59e0b" strokeWidth={2} dot={false} name="Fats (g)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly Comparison (for 30d/90d) */}
        {period !== '7d' && weeklyData.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Weekly Comparison
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgCalories" fill="#10b981" name="Avg Calories" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgProtein" fill="#3b82f6" name="Avg Protein (g)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-600" />
          {periodLabels[period]} Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <Flame className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{periodStats.avgCalories.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Avg Calories/Day</p>
          </div>

          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Beef className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{periodStats.avgProtein}g</p>
            <p className="text-xs text-gray-500">Avg Protein/Day</p>
          </div>

          <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
            <Droplets className="h-6 w-6 text-cyan-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{periodStats.avgWater} oz</p>
            <p className="text-xs text-gray-500">Avg Water/Day</p>
          </div>

          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <Trophy className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{periodStats.calorieGoalDays}</p>
            <p className="text-xs text-gray-500">Calorie Goals Hit</p>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{periodStats.proteinGoalDays}</p>
            <p className="text-xs text-gray-500">Protein Goals Hit</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-500">Total Calories</p>
            <p className="text-xl font-bold">{periodStats.totalCalories.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-500">Total Water</p>
            <p className="text-xl font-bold">{periodStats.totalWater.toLocaleString()} oz</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-500">Avg Carbs/Day</p>
            <p className="text-xl font-bold">{periodStats.avgCarbs}g</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-500">Avg Fats/Day</p>
            <p className="text-xl font-bold">{periodStats.avgFats}g</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
