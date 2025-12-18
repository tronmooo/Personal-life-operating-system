'use client'

import { useState } from 'react'
import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  LayoutDashboard,
  List,
} from 'lucide-react'
import { DigitalLifeDashboard } from '@/components/digital-life/digital-life-dashboard'
import { DigitalLifeSubscriptions } from '@/components/digital-life/digital-life-subscriptions'
import { DigitalLifeCalendar } from '@/components/digital-life/digital-life-calendar'
import { DigitalLifeAnalytics } from '@/components/digital-life/digital-life-analytics'
import { AddSubscriptionDialog } from '@/components/digital-life/add-subscription-dialog'

export function ServiceProvidersHub() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const { analytics, loading } = useSubscriptions()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-700 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Digital Life
        </h1>
        <p className="text-slate-400 text-lg">
          Subscriptions & Recurring Costs
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <List className="w-4 h-4 mr-2" />
              All Subscriptions
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Subscription
          </Button>
        </div>

        {/* Tab Contents */}
        <TabsContent value="dashboard" className="mt-0">
          <DigitalLifeDashboard />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-0">
          <DigitalLifeSubscriptions />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <DigitalLifeCalendar />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <DigitalLifeAnalytics />
        </TabsContent>
      </Tabs>

      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  )
}










