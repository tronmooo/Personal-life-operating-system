import { Suspense } from 'react'
import { DashboardSwitcher } from '@/components/dashboard/dashboard-switcher'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardSwitcher />
    </Suspense>
  )
}
