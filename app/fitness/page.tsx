'use client'

import { useState } from 'react'
import { Activity, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { DashboardTab } from '@/components/fitness/dashboard-tab'
import { ActivitiesTab } from '@/components/fitness/activities-tab'
import { AddActivityDialog } from '@/components/fitness/add-activity-dialog'

export default function FitnessPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities'>('dashboard')
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/domains')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Fitness Tracker
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your workouts, steps, and progress
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <Activity className="w-5 h-5 mr-2" />
              Log Activity
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'activities'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Activity History
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab onAddActivity={() => setShowAddDialog(true)} />}
        {activeTab === 'activities' && <ActivitiesTab />}
      </div>

      {/* Add Activity Dialog */}
      <AddActivityDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  )
}

