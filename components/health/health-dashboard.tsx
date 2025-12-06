'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Heart, Pill, Activity, Calendar, Stethoscope, Dumbbell,
  FileText, Users, AlertCircle, Syringe, Plus, Settings, ArrowLeft
} from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { DashboardTab } from './tabs/dashboard-tab'
import { MedicationsTab } from './tabs/medications-tab'
import { MetricsTab } from './tabs/metrics-tab'
import { AppointmentsTab } from './tabs/appointments-tab'
import { SymptomsTab } from './tabs/symptoms-tab'
import { WorkoutsTab } from './tabs/workouts-tab'
import { ProvidersTab } from './tabs/providers-tab'
import { DocumentsTab } from './tabs/documents-tab'

export function HealthDashboard() {
  const { dashboardSummary } = useHealth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/domains')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <Heart className="h-10 w-10 text-red-500" />
                Health & Wellness
              </h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive health tracking and management
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Medications Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardSummary.todaysMedicationsTaken}/{dashboardSummary.todaysMedicationsTotal}
              </div>
              <Progress 
                value={(dashboardSummary.todaysMedicationsTaken / dashboardSummary.todaysMedicationsTotal) * 100 || 0} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Taken today
              </p>
            </CardContent>
          </Card>

          {/* Steps Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardSummary.todaysSteps.toLocaleString()}
              </div>
              <Progress 
                value={(dashboardSummary.todaysSteps / dashboardSummary.stepsGoal) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {dashboardSummary.stepsGoal.toLocaleString()} goal
              </p>
            </CardContent>
          </Card>

          {/* Water Intake Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                💧 Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardSummary.waterIntake} oz
              </div>
              <Progress 
                value={(dashboardSummary.waterIntake / dashboardSummary.waterGoal) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {dashboardSummary.waterGoal} oz goal
              </p>
            </CardContent>
          </Card>

          {/* Active Minutes Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-orange-500" />
                Active Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardSummary.activeMinutes} min
              </div>
              <Progress 
                value={(dashboardSummary.activeMinutes / dashboardSummary.activeMinutesGoal) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {dashboardSummary.activeMinutesGoal} min goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="dashboard" className="flex flex-col gap-1 py-2">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex flex-col gap-1 py-2">
              <Pill className="h-4 w-4" />
              <span className="text-xs">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex flex-col gap-1 py-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex flex-col gap-1 py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="flex flex-col gap-1 py-2">
              <Stethoscope className="h-4 w-4" />
              <span className="text-xs">Symptoms</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex flex-col gap-1 py-2">
              <Dumbbell className="h-4 w-4" />
              <span className="text-xs">Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex flex-col gap-1 py-2">
              <Users className="h-4 w-4" />
              <span className="text-xs">Providers</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex flex-col gap-1 py-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Documents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <MedicationsTab />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <MetricsTab />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <AppointmentsTab />
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-4">
            <SymptomsTab />
          </TabsContent>

          <TabsContent value="workouts" className="space-y-4">
            <WorkoutsTab />
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <ProvidersTab />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

