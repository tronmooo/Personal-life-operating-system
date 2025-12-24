'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, Camera, Droplet, Target, ArrowLeft } from 'lucide-react'
import { DashboardView } from '@/components/nutrition/dashboard-view'
import { MealsView } from '@/components/nutrition/meals-view'
import { WaterView } from '@/components/nutrition/water-view'
import { GoalsView } from '@/components/nutrition/goals-view'
import { useRouter } from 'next/navigation'

export default function NutritionPage() {
  const [activeView, setActiveView] = useState('dashboard')
  const router = useRouter()

  const navigationButtons = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'meals', label: 'Meals', icon: Camera },
    { id: 'water', label: 'Water', icon: Droplet },
    { id: 'goals', label: 'Goals', icon: Target },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 text-white/90 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">NutriTrack</h1>
          <p className="text-green-100">Your Personal Nutrition Companion</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-2xl">🏆</span>
            <span className="font-semibold">7 Day Streak! 🔥</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {navigationButtons.map((btn) => {
            const Icon = btn.icon
            return (
              <Button
                key={btn.id}
                onClick={() => setActiveView(btn.id)}
                className={`h-16 text-lg ${
                  activeView === btn.id
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {btn.label}
              </Button>
            )
          })}
        </div>

        {/* Content */}
        <div>
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'meals' && <MealsView />}
          {activeView === 'water' && <WaterView />}
          {activeView === 'goals' && <GoalsView />}
        </div>
      </div>
    </div>
  )
}

