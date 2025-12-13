'use client'

import { Suspense } from 'react'
import { ServiceProvidersHub } from '@/components/service-providers/service-providers-hub'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

function ServiceProvidersLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="p-6 max-w-7xl mx-auto">
        <Suspense fallback={<ServiceProvidersLoading />}>
          <ServiceProvidersHub />
        </Suspense>
      </div>
    </div>
  )
}

