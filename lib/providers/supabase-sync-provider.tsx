'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
// localStorage access guarded by typeof window checks
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from './data-provider'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface SupabaseSyncContextType {
  isEnabled: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  syncStatus: SyncStatus
  enableSync: () => Promise<void>
  disableSync: () => void
  syncNow: () => Promise<void>
  downloadFromCloud: () => Promise<void>
}

const SupabaseSyncContext = createContext<SupabaseSyncContextType | undefined>(undefined)

export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const { data } = useData()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const { value: prefEnabled, setValue: setPrefEnabled } = useUserPreferences<boolean>('cloud_sync_enabled', false)
  const { value: prefLast, setValue: setPrefLast } = useUserPreferences<string | null>('cloud_last_sync_time', null)

  // Check if Supabase is configured
  const hasSupabaseConfig = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return !!(url && key && url !== 'https://your-project.supabase.co' && key !== 'your-anon-key-here')
  }, [])

  // Load sync settings from Supabase preferences
  useEffect(() => {
    setIsEnabled(!!prefEnabled && hasSupabaseConfig())
    setLastSyncTime(prefLast || null)
  }, [prefEnabled, prefLast, hasSupabaseConfig])

  const enableSync = async () => {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase not configured. Please add your credentials to .env.local')
    }
    
    setIsEnabled(true)
    setPrefEnabled(true)
    
    // Perform initial sync
    await syncNow()
  }

  const disableSync = () => {
    setIsEnabled(false)
    setPrefEnabled(false)
    setSyncStatus('idle')
  }

  const syncNow = async () => {
    if (!isEnabled || isSyncing) return

    setIsSyncing(true)
    setSyncStatus('syncing')

    try {
      // ✅ FIX: Removed uploadToCloud() - DataProvider already syncs to Supabase
      // The DataProvider handles all CRUD operations with domain_entries table
      // This was redundant and referenced non-existent 'domains' table
      
      const now = new Date().toISOString()
      setLastSyncTime(now)
      setPrefLast(now)
      setSyncStatus('synced')
      
      console.log('✅ Sync status updated (DataProvider handles actual sync)')
      
      // Auto-reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      
      // Auto-reset error status after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle')
      }, 5000)
    } finally {
      setIsSyncing(false)
    }
  }

  const downloadFromCloud = async () => {
    if (!hasSupabaseConfig()) {
      throw new Error('Supabase not configured')
    }

    setIsSyncing(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      if (!supabase) {
        throw new Error('Supabase not configured')
      }
      
      // ✅ FIX: Download from correct table (domain_entries, not domains)
      const { data: entries, error } = await supabase
        .from('domain_entries')
        .select('*')

      if (error) {
        console.error('Download error:', error)
        throw error
      }

      if (entries && entries.length > 0) {
        // Group entries by domain for IDB cache structure
        const { idbSet } = await import('@/lib/utils/idb-cache')
        const groupedByDomain: Record<string, any[]> = {}
        
        // Get user_id from first entry (all entries belong to same user)
        const userId = entries[0].user_id
        
        for (const entry of entries) {
          if (!groupedByDomain[entry.domain]) {
            groupedByDomain[entry.domain] = []
          }
          groupedByDomain[entry.domain].push(entry)
        }
        
        // Save to IDB cache using correct user_id
        const key = `domain_entries_snapshot_${userId}`
        try {
          await idbSet(key, groupedByDomain)
        } catch (error) {
          console.error(`Failed to save to IndexedDB:`, error)
        }
        
        alert(`Downloaded ${entries.length} entries from cloud successfully!`)
        
        // Reload the page to refresh all data
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        alert('No data found in cloud')
      }
    } catch (error) {
      console.error('Download error:', error)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-sync on data changes (debounced)
  useEffect(() => {
    if (!isEnabled) return

    const timeoutId = setTimeout(() => {
      syncNow()
    }, 5000) // 5 second debounce

    return () => clearTimeout(timeoutId)
  }, [data, isEnabled])

  return (
    <SupabaseSyncContext.Provider
      value={{
        isEnabled,
        isSyncing,
        lastSyncTime,
        syncStatus,
        enableSync,
        disableSync,
        syncNow,
        downloadFromCloud,
      }}
    >
      {children}
    </SupabaseSyncContext.Provider>
  )
}

export function useSupabaseSync() {
  const context = useContext(SupabaseSyncContext)
  if (context === undefined) {
    throw new Error('useSupabaseSync must be used within a SupabaseSyncProvider')
  }
  return context
}

