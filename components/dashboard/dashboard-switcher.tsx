'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, LayoutDashboard } from 'lucide-react'
import { CommandCenterRedesigned } from './command-center-redesigned'
import { CustomizableCommandCenter } from './customizable-command-center'
import { resetDashboardMode } from '@/lib/utils/dashboard-reset'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

export function DashboardSwitcher() {
  const [viewMode, setViewMode] = useState<'standard' | 'customizable'>('standard')

  // Load view mode from Supabase user_settings (non-blocking)
  useEffect(() => {
    (async () => {
      try {
        const settings = await getUserSettings()
        const savedMode = settings?.dashboardViewMode
        if (savedMode === 'customizable' || savedMode === 'standard') {
          setViewMode(savedMode)
        }
      } catch {
        // Silently fail - already defaults to 'standard'
      }
    })()
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

  return (
    <div>
      {/* Render Dashboard */}
      {viewMode === 'standard' ? (
        <CommandCenterRedesigned />
      ) : (
        <CustomizableCommandCenter />
      )}
    </div>
  )
}



