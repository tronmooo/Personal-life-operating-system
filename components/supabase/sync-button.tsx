'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cloud, CloudOff, Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { isSupabaseConfigured, getSession } from '@/lib/supabase/client'
import {
  syncToSupabase,
  syncFromSupabase,
  getSyncStatus,
  enableRealtime,
  disableRealtime,
} from '@/lib/services/supabase-sync'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function SupabaseSyncButton() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>({ 
    isSyncing: false, 
    lastSyncTime: null, 
    error: null, 
    pendingChanges: 0 
  })
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

  useEffect(() => {
    // Check if Supabase is configured
    setIsConfigured(isSupabaseConfigured())

    // Load initial sync status
    setSyncStatus(getSyncStatus())

    // Check if user is authenticated
    const checkAuth = async () => {
      const session = await getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()

    // Listen to sync status changes
    const handleSyncStatusChange = (event: CustomEvent) => {
      setSyncStatus(event.detail)
    }

    window.addEventListener('syncStatusChanged', handleSyncStatusChange as EventListener)

    return () => {
      window.removeEventListener('syncStatusChanged', handleSyncStatusChange as EventListener)
    }
  }, [])

  const handleSync = async () => {
    if (!isConfigured || !isAuthenticated) return

    const result = await syncToSupabase()
    if (result.success) {
      // Also fetch latest from cloud
      await syncFromSupabase()
    }
  }

  const handleEnableRealtime = async () => {
    if (!isConfigured || !isAuthenticated) return

    const channel = await enableRealtime()
    setRealtimeChannel(channel)
  }

  const handleDisableRealtime = () => {
    if (realtimeChannel) {
      disableRealtime(realtimeChannel)
      setRealtimeChannel(null)
    }
  }

  if (!isConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled>
              <CloudOff className="h-4 w-4 mr-2" />
              Offline Mode
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Supabase not configured. Data saved locally only.</p>
            <p className="text-xs mt-1">Add NEXT_PUBLIC_SUPABASE_URL to enable cloud sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled>
              <CloudOff className="h-4 w-4 mr-2" />
              Not Signed In
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign in to enable cloud sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    }
    if (syncStatus.error) {
      return <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
    }
    if (syncStatus.lastSyncTime) {
      return <Check className="h-4 w-4 mr-2 text-green-500" />
    }
    return <Cloud className="h-4 w-4 mr-2" />
  }

  const getStatusText = () => {
    if (syncStatus.isSyncing) {
      return 'Syncing...'
    }
    if (syncStatus.error) {
      return 'Sync Error'
    }
    if (syncStatus.lastSyncTime) {
      const lastSync = new Date(syncStatus.lastSyncTime)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / 60000)
      
      if (diffMinutes < 1) return 'Synced just now'
      if (diffMinutes < 60) return `Synced ${diffMinutes}m ago`
      
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `Synced ${diffHours}h ago`
      
      return `Synced ${Math.floor(diffHours / 24)}d ago`
    }
    return 'Never synced'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className={cn(
              'gap-2',
              syncStatus.error && 'text-red-500',
              syncStatus.lastSyncTime && !syncStatus.error && 'text-green-600'
            )}
          >
            {getStatusIcon()}
            <span className="hidden sm:inline">{getStatusText()}</span>
            {syncStatus.pendingChanges > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                {syncStatus.pendingChanges}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p>Cloud Sync Status</p>
            {syncStatus.lastSyncTime && (
              <p className="text-xs">Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}</p>
            )}
            {syncStatus.error && (
              <p className="text-xs text-red-500">Error: {syncStatus.error}</p>
            )}
            {syncStatus.pendingChanges > 0 && (
              <p className="text-xs text-orange-600">
                {syncStatus.pendingChanges} pending change(s)
              </p>
            )}
            <p className="text-xs mt-2">Click to sync now</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

