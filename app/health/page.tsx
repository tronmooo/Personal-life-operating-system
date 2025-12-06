/**
 * Health & Wellness Page
 * Comprehensive health tracking with demographics, vitals, sleep, symptoms, medications
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, ArrowLeft, Plus, Activity, TrendingUp, Moon, AlertCircle, Pill, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProfileTabEnhanced } from '@/components/health/profile-tab-enhanced'
import { EnhancedDashboardTab } from '@/components/health/enhanced-dashboard-tab'
import { VitalsLabsTab } from '@/components/health/vitals-labs-tab'
import { SleepTrackingTab } from '@/components/health/sleep-tracking-tab'
import { SymptomsTab } from '@/components/health/symptoms-tab'
import { MedicationsTabEnhanced } from '@/components/health/medications-tab-enhanced'
import { QuickLogDialog } from '@/components/health/quick-log-dialog'
import { LogSymptomDialog } from '@/components/health/log-symptom-dialog'
import { LogSleepDialog } from '@/components/health/log-sleep-dialog'
import { AddMedicationDialog } from '@/components/health/add-medication-dialog'

type TabType = 'dashboard' | 'vitals' | 'sleep' | 'symptoms' | 'medications' | 'profile'

export default function HealthPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [showLogSymptom, setShowLogSymptom] = useState(false)
  const [showLogSleep, setShowLogSleep] = useState(false)
  const [showAddMedication, setShowAddMedication] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/domains')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-red-500 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-900 dark:text-red-100">Health & Wellness</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track your health journey</p>
              </div>
            </div>
            <Button
              onClick={() => setShowQuickLog(true)}
              className="bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Log
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('vitals')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'vitals'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Vitals & Labs</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('sleep')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sleep'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium">Sleep</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('symptoms')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'symptoms'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Symptoms</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('medications')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'medications'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span className="font-medium">Medications</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-950'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <EnhancedDashboardTab />}
        {activeTab === 'vitals' && <VitalsLabsTab />}
        {activeTab === 'sleep' && <SleepTrackingTab onLogSleep={() => setShowLogSleep(true)} />}
        {activeTab === 'symptoms' && <SymptomsTab onLogSymptom={() => setShowLogSymptom(true)} />}
        {activeTab === 'medications' && <MedicationsTabEnhanced onAddMedication={() => setShowAddMedication(true)} />}
        {activeTab === 'profile' && <ProfileTabEnhanced />}
      </div>

      {/* Dialogs */}
      <QuickLogDialog open={showQuickLog} onOpenChange={setShowQuickLog} />
      <LogSymptomDialog open={showLogSymptom} onOpenChange={setShowLogSymptom} />
      <LogSleepDialog open={showLogSleep} onOpenChange={setShowLogSleep} />
      <AddMedicationDialog open={showAddMedication} onOpenChange={setShowAddMedication} />
    </div>
  )
}
