'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { OverviewTab } from '@/components/home/overview-tab'
import { MaintenanceTab } from '@/components/home/maintenance-tab'
import { AssetsTab } from '@/components/home/assets-tab'
import { ProjectsTab } from '@/components/home/projects-tab'
import { BillsTab } from '@/components/home/bills-tab'
import { ServiceHistoryTab } from '@/components/home/service-history-tab'
import { MaintenanceScheduleTab } from '@/components/home/maintenance-schedule-tab'
import { DocumentsTab } from '@/components/home/documents-tab'

export function HomeDetailPageClient({ homeId }: { homeId: string }) {
  const router = useRouter()
  const { getData } = useData()
  // ✅ Use useDomainEntries for realtime updates
  const { entries, isLoading } = useDomainEntries('home')

  // ✅ Calculate home stats from entries
  const property = entries.find(item => 
    item.id === homeId && item.metadata?.type === 'property'
  )
  
  const assets = entries.filter(item => 
    item.metadata?.itemType === 'asset' && item.metadata?.homeId === homeId
  )
  const projects = entries.filter(item => 
    item.metadata?.itemType === 'project' && item.metadata?.homeId === homeId
  )
  const maintenanceTasks = entries.filter(item => 
    item.metadata?.itemType === 'maintenance-task' && item.metadata?.homeId === homeId
  )
  const documents = entries.filter(item => 
    item.metadata?.itemType === 'document' && item.metadata?.homeId === homeId
  )
  const bills = entries.filter(item => 
    item.metadata?.itemType === 'bill' && item.metadata?.homeId === homeId
  )
  
  // Calculate total asset value
  const totalAssetsValue = assets.reduce((sum, asset) => 
    sum + (Number(asset.metadata?.value) || 0), 0
  )
  
  // Calculate monthly expenses
  const monthlyBills = bills
    .filter(b => b.metadata?.frequency === 'monthly')
    .reduce((sum, bill) => sum + (Number(bill.metadata?.amount) || 0), 0)
  
  const home = property ? {
    id: property.id,
    name: String(property.title || property.metadata?.name || 'Unnamed Property'),
    address: String(property.metadata?.address || ''),
    type: property.metadata?.propertyType,
    purchaseDate: property.metadata?.purchaseDate,
    purchasePrice: property.metadata?.purchasePrice || 0,
    propertyValue: property.metadata?.propertyValue || 0,
    squareFootage: property.metadata?.squareFootage,
    bedrooms: property.metadata?.bedrooms,
    bathrooms: property.metadata?.bathrooms,
    lotSize: property.metadata?.lotSize,
    totalAssets: assets.length,
    totalAssetsValue,
    totalProjects: projects.length,
    totalMaintenanceTasks: maintenanceTasks.length,
    totalDocuments: documents.length,
    monthlyExpenses: monthlyBills,
  } : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!home) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Property not found</p>
          <Button onClick={() => router.push('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/home')}
            className="text-white hover:bg-white/20 mb-2 sm:mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Properties</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate">{home.name}</h1>
          <p className="text-purple-100 text-sm sm:text-base truncate">{home.address}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          {/* Horizontally scrollable tab toolbar */}
          <div className="relative">
            {/* Fade indicator for more content on right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            {/* Fade indicator for more content on left */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
              <TabsList className="inline-flex w-max gap-1 p-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="maintenance" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Maintenance</TabsTrigger>
                <TabsTrigger value="assets" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Assets</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Projects</TabsTrigger>
                <TabsTrigger value="bills" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Bills</TabsTrigger>
                <TabsTrigger value="service" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Service</TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Schedule</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Documents</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview">
            <OverviewTab home={home} />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="assets">
            <AssetsTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="bills">
            <BillsTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="service">
            <ServiceHistoryTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="schedule">
            <MaintenanceScheduleTab homeId={homeId} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab homeId={homeId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}





















