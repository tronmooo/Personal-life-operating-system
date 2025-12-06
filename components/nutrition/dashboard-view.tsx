'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

export function DashboardView() {
  const { getData } = useData()
  const [meals, setMeals] = useState<any[]>([])
  const [water, setWater] = useState<any[]>([])
  const [allMeals, setAllMeals] = useState<any[]>([])

  // Load nutrition data from DataProvider
  const loadData = () => {
    const nutritionData = getData('nutrition')
    
    // Load meals
    const mealData = nutritionData
      .filter(item => item.metadata?.type === 'meal' || item.metadata?.logType === 'meal')
      .map(item => ({
        id: item.id,
        name: item.metadata?.name || item.title || '',
        calories: item.metadata?.calories || 0,
        protein: item.metadata?.protein || 0,
        carbs: item.metadata?.carbs || 0,
        fats: item.metadata?.fats || 0,
        fiber: item.metadata?.fiber || 0,
        date: item.metadata?.date || item.createdAt
      }))
    
    setMeals(mealData)
    setAllMeals(mealData)
    
    // Load water
    const waterData = nutritionData
      .filter(item => item.metadata?.type === 'water' || 
                     item.metadata?.itemType === 'water' || 
                     item.metadata?.logType === 'water')
      .map(item => ({
        id: item.id,
        amount: item.metadata?.water || item.metadata?.amount || item.metadata?.value || 0,
        date: item.metadata?.date || item.createdAt
      }))
    
    setWater(waterData)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => loadData()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('nutrition-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('nutrition-data-updated', handleUpdate)
    }
  }, [])

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const totalWater = water.reduce((sum, w) => sum + w.amount, 0)
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0)
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0)
  const totalFats = meals.reduce((sum, m) => sum + (m.fats || 0), 0)

  const calorieGoal = 2000
  const waterGoal = 64

  const macroData = [
    { name: 'Protein', value: totalProtein, color: '#3b82f6' },
    { name: 'Carbs', value: totalCarbs, color: '#10b981' },
    { name: 'Fats', value: totalFats, color: '#f59e0b' },
  ]

  // Get weekly trends data
  const getWeeklyData = () => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayMeals = allMeals.filter(m => m.date?.startsWith(dateStr))
      const calories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
      const protein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0)
      
      last7Days.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        calories,
        protein
      })
    }
    
    return last7Days
  }

  const weeklyData = getWeeklyData()

  return (
    <div className="space-y-6">
      {/* Today's Progress */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6">Today's Progress</h2>

        <div className="space-y-6">
          {/* Calories */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-lg font-semibold">Calories</span>
              <span className="text-2xl font-bold text-green-600">
                {totalCalories} / {calorieGoal}
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                style={{ width: `${Math.min((totalCalories / calorieGoal) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-lg font-semibold">Water</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalWater} oz / {waterGoal} oz
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                style={{ width: `${Math.min((totalWater / waterGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Macronutrients */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6">Macronutrients</h2>

        {macroData.some(d => d.value > 0) ? (
          <>
            <div className="h-[300px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}g`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span className="text-lg font-semibold">Protein</span>
                </div>
                <span className="text-2xl font-bold">{totalProtein.toFixed(1)}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-lg font-semibold">Carbs</span>
                </div>
                <span className="text-2xl font-bold">{totalCarbs.toFixed(1)}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span className="text-lg font-semibold">Fats</span>
                </div>
                <span className="text-2xl font-bold">{totalFats.toFixed(1)}g</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No meals logged yet. Add your first meal to see macros!</p>
          </div>
        )}
      </Card>

      {/* Weekly Trends */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Weekly Trends</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 6 }}
                name="calories"
              />
              <Line 
                type="monotone" 
                dataKey="protein" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 6 }}
                name="protein"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

