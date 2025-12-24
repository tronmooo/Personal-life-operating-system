'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { LayoutGrid, LayoutDashboard } from 'lucide-react'
import { resetDashboardMode } from '@/lib/utils/dashboard-reset'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'
import { DashboardSkeleton } from './dashboard-skeleton'

// Lazy load heavy components for faster initial render
const CommandCenterRedesigned = lazy(() => import('./command-center-redesigned').then(mod => ({ default: mod.CommandCenterRedesigned })))
const CustomizableCommandCenter = lazy(() => import('./customizable-command-center').then(mod => ({ default: mod.CustomizableCommandCenter })))

export function DashboardSwitcher() {
  const [viewMode, setViewMode] = useState<'standard' | 'customizable'>('standard')
  const [isReady, setIsReady] = useState(false)

  // Load view mode from Supabase user_settings (non-blocking)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const settings = await getUserSettings()
        if (!mounted) return
        const savedMode = settings?.dashboardViewMode
        if (savedMode === 'customizable' || savedMode === 'standard') {
          setViewMode(savedMode)
        }
      } catch {
        // Silently fail - already defaults to 'standard'
      } finally {
        if (mounted) {
          // Small delay to ensure smooth transition
          requestAnimationFrame(() => {
            setIsReady(true)
          })
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Listen for view mode changes from settings
  useEffect(() => {
    const handleViewModeChange = (e: CustomEvent) => {
      console.log('📊 Dashboard mode changed to:', e.detail.mode)
      setViewMode(e.detail.mode)
      // Persist to Supabase settings
      updateUserSettings({ dashboardViewMode: e.detail.mode }).catch(() => {})
    }
    
    window.addEventListener('dashboard-view-mode-changed' as any, handleViewModeChange as any)
    return () => {
      window.removeEventListener('dashboard-view-mode-changed' as any, handleViewModeChange as any)
    }
  }, [])

  // Show skeleton while loading
  if (!isReady) {
    return <DashboardSkeleton />
  }

  return (
    <div>
      {/* Render Dashboard with Suspense for lazy loading */}
      <Suspense fallback={<DashboardSkeleton />}>
        {viewMode === 'standard' ? (
          <CommandCenterRedesigned />
        ) : (
          <CustomizableCommandCenter />
        )}
      </Suspense>
    </div>
  )
}



