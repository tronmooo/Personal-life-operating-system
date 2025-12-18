'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Utensils, Droplets, Flame, TrendingUp, TrendingDown,
  Target, Apple, Beef, Wheat, CircleDot, Minus,
  ChevronRight, Award, Zap, Calendar
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, RadialBarChart, RadialBar, Legend, ComposedChart
} from 'recharts'

type TimePeriod = '7d' | '30d' | '90d'

interface NutritionCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function NutritionCard({ size, data }: NutritionCardProps) {
  const [period, setPeriod] = useState<TimePeriod>('7d')

  const nutritionData = data?.nutrition || []

  // Get nutrition goals
  const goals = useMemo(() => {
    const goalsItem = nutritionData.find((item: any) => {
      const meta = item.metadata || {}
      return String(meta.itemType ?? meta.type ?? '').toLowerCase() === 'nutrition-goals'
    })

    if (goalsItem?.metadata) {
      return {
        calories: goalsItem.metadata.caloriesGoal || 2000,
        protein: goalsItem.metadata.proteinGoal || 150,
        carbs: goalsItem.metadata.carbsGoal || 250,
        fats: goalsItem.metadata.fatsGoal || 65,
        fiber: goalsItem.metadata.fiberGoal || 30,
        water: goalsItem.metadata.waterGoal || 64,
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
      // Check multiple possible date fields (handle both createdAt and created_at)
      const rawDate = item.metadata?.date || item.createdAt || item.created_at || ''
      if (!rawDate) return false
      
      // Parse the date and compare in LOCAL timezone
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

  // Generate historical data for charts
  const periodData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data: any[] = []
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
          water: totals.water + waterAmount,
        }
      }, { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 })

      data.push({
        date: dateStr,
        day: days <= 7 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] : `${date.getMonth() + 1}/${date.getDate()}`,
        ...dayTotals,
        calorieGoal: goals.calories,
        proteinGoal: goals.protein,
        waterGoal: goals.water,
      })
    }

    return data
  }, [nutritionData, period, goals])

  // Calculate averages for the period
  const periodAverages = useMemo(() => {
    const daysWithData = periodData.filter(d => d.calories > 0 || d.water > 0)
    const count = daysWithData.length || 1

    const totals = daysWithData.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
      water: acc.water + day.water,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 })

    return {
      avgCalories: Math.round(totals.calories / count),
      avgProtein: Math.round(totals.protein / count),
      avgCarbs: Math.round(totals.carbs / count),
      avgFats: Math.round(totals.fats / count),
      avgWater: Math.round(totals.water / count),
      daysTracked: daysWithData.length,
      goalHitDays: daysWithData.filter(d => d.calories >= goals.calories * 0.8 && d.calories <= goals.calories * 1.2).length,
    }
  }, [periodData, goals])

  // Calculate trends (compare first half to second half)
  const trends = useMemo(() => {
    const halfIdx = Math.floor(periodData.length / 2)
    const firstHalf = periodData.slice(0, halfIdx)
    const secondHalf = periodData.slice(halfIdx)

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.calories, 0) / (firstHalf.length || 1)
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.calories, 0) / (secondHalf.length || 1)

    const firstWater = firstHalf.reduce((sum, d) => sum + d.water, 0) / (firstHalf.length || 1)
    const secondWater = secondHalf.reduce((sum, d) => sum + d.water, 0) / (secondHalf.length || 1)

    return {
      caloriesTrend: secondAvg - firstAvg,
      waterTrend: secondWater - firstWater,
    }
  }, [periodData])

  // Macro distribution for pie chart
  const macroDistribution = useMemo(() => {
    const total = todayTotals.protein * 4 + todayTotals.carbs * 4 + todayTotals.fats * 9
    if (total === 0) return []

    return [
      { name: 'Protein', value: Math.round((todayTotals.protein * 4 / total) * 100), grams: todayTotals.protein, color: '#3b82f6' },
      { name: 'Carbs', value: Math.round((todayTotals.carbs * 4 / total) * 100), grams: todayTotals.carbs, color: '#10b981' },
      { name: 'Fats', value: Math.round((todayTotals.fats * 9 / total) * 100), grams: todayTotals.fats, color: '#f59e0b' },
    ]
  }, [todayTotals])

  // Goal progress for radial chart
  const goalProgress = useMemo(() => [
    { name: 'Calories', value: Math.min(Math.round((todayTotals.calories / goals.calories) * 100), 100), fill: '#10b981' },
    { name: 'Protein', value: Math.min(Math.round((todayTotals.protein / goals.protein) * 100), 100), fill: '#3b82f6' },
    { name: 'Water', value: Math.min(Math.round((todayTotals.water / goals.water) * 100), 100), fill: '#06b6d4' },
    { name: 'Fiber', value: Math.min(Math.round((todayTotals.fiber / goals.fiber) * 100), 100), fill: '#8b5cf6' },
  ], [todayTotals, goals])

  // Score calculation
  const nutritionScore = useMemo(() => {
    let score = 0
    const calPercent = todayTotals.calories / goals.calories
    const proteinPercent = todayTotals.protein / goals.protein
    const waterPercent = todayTotals.water / goals.water

    // Calories (35 points) - penalize both under and over eating
    if (calPercent >= 0.9 && calPercent <= 1.1) score += 35
    else if (calPercent >= 0.8 && calPercent <= 1.2) score += 25
    else if (calPercent >= 0.6 && calPercent <= 1.4) score += 15

    // Protein (25 points)
    score += Math.min(proteinPercent, 1) * 25

    // Water (25 points)
    score += Math.min(waterPercent, 1) * 25

    // Macro balance (15 points)
    if (macroDistribution.length > 0) {
      const proteinPct = macroDistribution.find(m => m.name === 'Protein')?.value || 0
      if (proteinPct >= 20 && proteinPct <= 35) score += 15
      else if (proteinPct >= 15 && proteinPct <= 40) score += 10
    }

    return Math.round(score)
  }, [todayTotals, goals, macroDistribution])

  // Small card - minimal view
  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-2">
            <Utensils className="h-5 w-5 text-green-600" />
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              nutritionScore >= 80 ? 'bg-green-100 text-green-700' :
              nutritionScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {nutritionScore}%
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {todayTotals.calories.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">/ {goals.calories} cal</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Droplets className="h-3 w-3 text-cyan-500" />
            <span className="text-xs">{todayTotals.water} / {goals.water} oz</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Medium card - overview with mini charts
  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-green-600" />
              Nutrition
            </div>
            <Badge variant="secondary" className={`${
              nutritionScore >= 80 ? 'bg-green-100 text-green-700' :
              nutritionScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {nutritionScore}% Score
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Today's Progress Bars */}
          <div className="space-y-2">
            {/* Calories */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Calories
                </span>
                <span className="font-medium">{todayTotals.calories} / {goals.calories}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    todayTotals.calories > goals.calories * 1.2 ? 'bg-red-500' :
                    todayTotals.calories > goals.calories ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((todayTotals.calories / goals.calories) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Beef className="h-3 w-3 text-red-500" />
                  Protein
                </span>
                <span className="font-medium">{todayTotals.protein}g / {goals.protein}g</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all rounded-full"
                  style={{ width: `${Math.min((todayTotals.protein / goals.protein) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Water */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-cyan-500" />
                  Water
                </span>
                <span className="font-medium">{todayTotals.water} oz / {goals.water} oz</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all rounded-full"
                  style={{ width: `${Math.min((todayTotals.water / goals.water) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mini Sparkline */}
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={periodData.slice(-7)}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#colorCalories)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Macro Pills */}
          <div className="flex gap-2 justify-center">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium">{todayTotals.protein}g P</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium">{todayTotals.carbs}g C</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs font-medium">{todayTotals.fats}g F</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Large card - comprehensive dashboard
  return (
    <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-600" />
            Nutrition Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
              <TabsList className="h-7">
                <TabsTrigger value="7d" className="text-xs px-2 h-6">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2 h-6">30D</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs px-2 h-6">90D</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="secondary" className={`${
              nutritionScore >= 80 ? 'bg-green-100 text-green-700' :
              nutritionScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              <Award className="h-3 w-3 mr-1" />
              {nutritionScore}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Today's Summary Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Calories</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {todayTotals.calories.toLocaleString()}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">/ {goals.calories}</span>
              <span className={`text-xs font-medium ${
                todayTotals.calories >= goals.calories ? 'text-green-600' : 'text-gray-400'
              }`}>
                {Math.round((todayTotals.calories / goals.calories) * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-1 mb-1">
              <Beef className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Protein</span>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {todayTotals.protein}g
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">/ {goals.protein}g</span>
              <span className={`text-xs font-medium ${
                todayTotals.protein >= goals.protein ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {Math.round((todayTotals.protein / goals.protein) * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-cyan-500">
            <div className="flex items-center gap-1 mb-1">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Water</span>
            </div>
            <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
              {todayTotals.water} oz
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">/ {goals.water} oz</span>
              <span className={`text-xs font-medium ${
                todayTotals.water >= goals.water ? 'text-cyan-600' : 'text-gray-400'
              }`}>
                {Math.round((todayTotals.water / goals.water) * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-1 mb-1">
              <Apple className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Meals</span>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {todayTotals.meals}
            </p>
            <span className="text-xs text-gray-500">logged today</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Calorie Trend Chart */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Calorie Trend
              </h4>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                trends.caloriesTrend > 0 ? 'bg-green-100 text-green-700' :
                trends.caloriesTrend < 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trends.caloriesTrend > 0 ? <TrendingUp className="h-3 w-3" /> :
                 trends.caloriesTrend < 0 ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {Math.abs(Math.round(trends.caloriesTrend))} cal
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={periodData}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={period === '7d' ? 0 : period === '30d' ? 4 : 13}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}${name === 'calorieGoal' ? '' : ''}`,
                      name === 'calories' ? 'Calories' : 'Goal'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#calorieGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="calorieGoal"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Macros Distribution */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <CircleDot className="h-4 w-4 text-blue-600" />
              Today's Macros
            </h4>
            {macroDistribution.length > 0 ? (
              <div className="flex items-center">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
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
                <div className="flex-1 space-y-2 pl-4">
                  {macroDistribution.map((macro) => (
                    <div key={macro.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                        <span className="text-sm">{macro.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{macro.grams}g</span>
                        <span className="text-xs text-gray-500 ml-1">({macro.value}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-gray-500">
                No meals logged today
              </div>
            )}
          </div>
        </div>

        {/* Water & Goals Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Water Intake Chart */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-600" />
                Water Intake Trend
              </h4>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                trends.waterTrend > 0 ? 'bg-cyan-100 text-cyan-700' :
                trends.waterTrend < 0 ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trends.waterTrend > 0 ? <TrendingUp className="h-3 w-3" /> :
                 trends.waterTrend < 0 ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {Math.abs(Math.round(trends.waterTrend))} oz
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval={period === '7d' ? 0 : period === '30d' ? 4 : 13}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="waterGoal" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goal Progress Radial */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-purple-600" />
              Today's Goal Progress
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="100%"
                  barSize={8}
                  data={goalProgress}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Legend
                    iconSize={8}
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Period Stats Summary */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-indigo-600" />
            {period === '7d' ? '7 Day' : period === '30d' ? '30 Day' : '90 Day'} Summary
          </h4>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{periodAverages.avgCalories}</p>
              <p className="text-xs text-gray-500">Avg Cal/Day</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{periodAverages.avgProtein}g</p>
              <p className="text-xs text-gray-500">Avg Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-600">{periodAverages.avgWater} oz</p>
              <p className="text-xs text-gray-500">Avg Water</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{periodAverages.daysTracked}</p>
              <p className="text-xs text-gray-500">Days Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{periodAverages.goalHitDays}</p>
              <p className="text-xs text-gray-500">Goals Hit</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Apple className="h-4 w-4 mr-2" />
            Log Meal
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Droplets className="h-4 w-4 mr-2" />
            Log Water
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <ChevronRight className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}



