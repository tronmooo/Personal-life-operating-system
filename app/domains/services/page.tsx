'use client'

import { Suspense } from 'react'
import { ServiceProvidersHub } from '@/components/service-providers/service-providers-hub'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

function ServiceProvidersLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-20 mt-2" />
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
        {/* Sidebar */}
        <Card className="bg-slate-800/50 border-slate-700/50 p-5">
          <Skeleton className="h-6 w-32 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

export default function ServiceProvidersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <Suspense fallback={<ServiceProvidersLoading />}>
        <ServiceProvidersHub />
      </Suspense>
    </div>
  )
}


