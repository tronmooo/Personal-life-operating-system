/**
 * Hook to manage financial domain data with Supabase
 * Replaces localStorage-based data management
 */

import { useEffect, useCallback } from 'react'
import { useDomainEntries } from './use-domain-entries'

export function useFinancialSync() {
  const { entries, isLoading, error, fetchEntries } = useDomainEntries('financial')

  useEffect(() => {
    // Dispatch custom event for financial data changes
    // This ensures all components stay in sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('financial-data-updated', {
        detail: { data: entries, timestamp: Date.now() }
      }))
    }
  }, [entries])

  return {
    data: entries,
    isLoading,
    error,
    reload: fetchEntries
  }
}

// Hook for components to listen to financial updates
export function useFinancialUpdates(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = () => {
      callback()
    }

    window.addEventListener('financial-data-updated', handler)
    return () => window.removeEventListener('financial-data-updated', handler)
  }, [callback])
}
































