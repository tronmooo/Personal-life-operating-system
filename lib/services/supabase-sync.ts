import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * Supabase Sync Service (Deprecated)
 *
 * All domains now persist directly to Supabase via DataProvider. This module is
 * retained for backwards compatibility but no longer performs any work.
 */

export interface SyncStatus {
  lastSyncTime: string | null
  isSyncing: boolean
  error: string | null
  pendingChanges: number
}

// Get sync status from localStorage
export const getSyncStatus = (): SyncStatus => ({
  lastSyncTime: null,
  isSyncing: false,
  error: null,
  pendingChanges: 0,
})

// Update sync status
const updateSyncStatus = (updates: Partial<SyncStatus>) => {
  console.warn('supabase-sync: updateSyncStatus called but service is deprecated.', updates)
}

// Sync all data from localStorage to Supabase
export const syncToSupabase = async (): Promise<{ success: boolean; error?: string }> => {
  console.warn('supabase-sync: syncToSupabase called but service is deprecated.')
  return { success: true }
}

// Sync all data from Supabase to localStorage
export const syncFromSupabase = async (): Promise<{ success: boolean; error?: string }> => {
  console.warn('supabase-sync: syncFromSupabase called but service is deprecated.')
  return { success: true }
}

// Enable real-time sync (subscribe to changes)
export const enableRealtime = async () => {
  console.warn('supabase-sync: enableRealtime is deprecated. DataProvider handles realtime updates.')
  return null
}

// Disable real-time sync
export const disableRealtime = (channel: any) => {
  if (channel && supabase) {
    console.warn('supabase-sync: disableRealtime called for deprecated service.')
    supabase.removeChannel(channel)
  }
}

// Auto-sync on data changes (call this after any local data change)
export const queueSync = () => {
  console.warn('supabase-sync: queueSync called but service is deprecated.')
}
