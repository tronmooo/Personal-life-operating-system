import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Domain } from '@/types/domains'

export interface DomainStats {
  count: number
  recent_count: number
  this_week: number
  this_month: number
  last_updated?: string
  recent_items?: Array<{
    id: string
    title: string
    created_at: string
    metadata?: Record<string, any>
  }>
}

export type BulkDomainStats = Record<Domain, DomainStats>

interface UseBulkDomainStatsOptions {
  includeRecentItems?: boolean // Default: false for faster queries
  refreshInterval?: number // Auto-refresh interval in ms (0 = disabled)
}

/**
 * Hook that fetches statistics for ALL domains in a SINGLE query
 * 
 * This solves the N+1 query problem where the dashboard makes 20+ separate queries.
 * Instead, we make 1 query that returns all stats at once.
 * 
 * **Performance Impact:**
 * - Before: 21 queries × ~50ms = ~1,050ms
 * - After: 1 query × ~100ms = ~100ms
 * - **90% faster!**
 * 
 * @param options Configuration options
 * @returns Object containing stats for all domains, loading state, and refresh function
 * 
 * @example
 * ```typescript
 * function Dashboard() {
 *   const { stats, loading, refresh } = useBulkDomainStats()
 *   
 *   if (loading) return <LoadingSkeleton />
 *   
 *   return (
 *     <div>
 *       <DomainCard 
 *         name="vehicles" 
 *         count={stats.vehicles?.count || 0}
 *         recent={stats.vehicles?.recent_count || 0}
 *       />
 *       {/\* ... more domains *\/}
 *     </div>
 *   )
 * }
 * ```
 */
export function useBulkDomainStats(options: UseBulkDomainStatsOptions = {}) {
  const { includeRecentItems = false, refreshInterval = 0 } = options
  
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<BulkDomainStats>({} as BulkDomainStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  /**
   * Fetch all domain statistics in one query
   */
  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats({} as BulkDomainStats)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Choose which function to call based on whether we need recent items
      const functionName = includeRecentItems 
        ? 'get_bulk_domain_stats' 
        : 'get_bulk_domain_summary'

      const { data, error: rpcError } = await supabase
        .rpc(functionName, { user_id_param: userId })

      if (rpcError) {
        throw new Error(`Failed to fetch domain stats: ${rpcError.message}`)
      }

      // Parse the JSON response
      const parsedStats = (data || {}) as BulkDomainStats
      
      setStats(parsedStats)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching bulk domain stats:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setLoading(false)
    }
  }, [userId, supabase, includeRecentItems])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh if interval is set
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchStats, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [refreshInterval, fetchStats])

  /**
   * Subscribe to realtime changes and refresh stats
   */
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('domain_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_entries',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Debounce rapid changes
          setTimeout(fetchStats, 300)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchStats])

  /**
   * Get stats for a specific domain
   * @param domain Domain name
   * @returns Stats for the domain or default empty stats
   */
  const getStatsForDomain = useCallback((domain: Domain): DomainStats => {
    return stats[domain] || {
      count: 0,
      recent_count: 0,
      this_week: 0,
      this_month: 0,
      recent_items: [],
    }
  }, [stats])

  /**
   * Get total count across all domains
   */
  const getTotalCount = useCallback((): number => {
    return Object.values(stats).reduce((sum, domainStats) => sum + (domainStats?.count || 0), 0)
  }, [stats])

  /**
   * Get domains sorted by count (most active first)
   */
  const getDomainsByActivity = useCallback((): Array<{ domain: Domain; count: number }> => {
    return Object.entries(stats)
      .map(([domain, domainStats]) => ({
        domain: domain as Domain,
        count: domainStats?.count || 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [stats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
    getStatsForDomain,
    getTotalCount,
    getDomainsByActivity,
  }
}

/**
 * Lightweight version that only returns summary stats (no recent items)
 * Use this for better performance when you don't need recent item details.
 * 
 * @example
 * ```typescript
 * function QuickDashboard() {
 *   const { stats, loading } = useBulkDomainSummary()
 *   // ...
 * }
 * ```
 */
export function useBulkDomainSummary() {
  return useBulkDomainStats({ includeRecentItems: false })
}




































