'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, LayoutDashboard, List, Calendar as CalendarIcon, TrendingUp, Monitor } from 'lucide-react'
import { DigitalLifeDashboard } from '@/components/digital-life/digital-life-dashboard'
import { DigitalLifeSubscriptions } from '@/components/digital-life/digital-life-subscriptions'
import { DigitalLifeCalendar } from '@/components/digital-life/digital-life-calendar'
import { DigitalLifeAnalytics } from '@/components/digital-life/digital-life-analytics'
import { AddSubscriptionDialog } from '@/components/digital-life/add-subscription-dialog'
import { DomainBackButton } from '@/components/ui/domain-back-button'

export default function DigitalLifePage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <DomainBackButton variant="light" />
        </div>

        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Digital Life
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                Subscriptions & Recurring Costs
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 mb-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 inline-flex w-max min-w-full sm:w-auto">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Dashboard</span>
                  <span className="xs:hidden">Home</span>
                </TabsTrigger>
                <TabsTrigger
                  value="subscriptions"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap"
                >
                  <List className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">All Subscriptions</span>
                  <span className="sm:hidden">Subs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap"
                >
                  <CalendarIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Calendar</span>
                  <span className="xs:hidden">Cal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Analytics</span>
                  <span className="xs:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:self-end"
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
