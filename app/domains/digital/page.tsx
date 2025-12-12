'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, LayoutDashboard, List, Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import { DigitalLifeDashboard } from '@/components/digital-life/digital-life-dashboard'
import { DigitalLifeSubscriptions } from '@/components/digital-life/digital-life-subscriptions'
import { DigitalLifeCalendar } from '@/components/digital-life/digital-life-calendar'
import { DigitalLifeAnalytics } from '@/components/digital-life/digital-life-analytics'
import { AddSubscriptionDialog } from '@/components/digital-life/add-subscription-dialog'

export default function DigitalLifePage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
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
                <CalendarIcon className="w-4 h-4 mr-2" />
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
    </div>
  )
}
