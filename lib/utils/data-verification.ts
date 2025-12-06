/**
 * Data Verification and Debugging Utilities
 * 
 * Tools to diagnose data accuracy issues:
 * - Compare Supabase vs IDB cache
 * - Clear all cached data
 * - Verify calculation accuracy
 * - Export data for inspection
 */

import { idbGet, idbSet, idbDel, idbClear } from './idb-cache'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { listDomainEntries } from '../hooks/use-domain-entries'
import type { Domain, DomainData } from '@/types/domains'

export interface DataVerificationReport {
  timestamp: string
  userId: string
  totalSupabase: number
  totalIDB: number
  discrepancies: Array<{
    domain: Domain
    supabaseCount: number
    idbCount: number
    difference: number
  }>
  cacheSizeBytes: number
}

/**
 * Clear all cached data from IndexedDB
 * Forces fresh load from Supabase on next page load
 */
export async function clearAllCache(): Promise<void> {
  console.log('🗑️ Clearing all IDB cache...')
  try {
    await idbClear()
    console.log('✅ Cache cleared successfully')
    
    // Note: localStorage is deprecated - all data now in IDB + Supabase
    // Use server migration endpoint if localStorage cleanup is needed
  } catch (error) {
    console.error('❌ Failed to clear cache:', error)
    throw error
  }
}

/**
 * Compare Supabase data with IDB cache to find discrepancies
 */
export async function verifyDataIntegrity(): Promise<DataVerificationReport> {
  const supabase = createClientComponentClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated - cannot verify data')
  }

  console.log('🔍 Starting data integrity verification for user:', user.email)

  // Load from Supabase
  const supabaseEntries = await listDomainEntries(supabase)
  const supabaseByDomain = supabaseEntries.reduce<Record<string, DomainData[]>>((acc, entry) => {
    if (!acc[entry.domain]) acc[entry.domain] = []
    acc[entry.domain].push(entry)
    return acc
  }, {})

  // Load from IDB cache
  const cacheKey = `domain_entries_snapshot_${user.id}`
  const idbData = (await idbGet<Record<string, DomainData[]>>(cacheKey, {})) || {}

  // Compare counts
  const discrepancies: DataVerificationReport['discrepancies'] = []
  const allDomains = new Set([...Object.keys(supabaseByDomain), ...Object.keys(idbData)])

  for (const domain of allDomains) {
    const supabaseCount = (supabaseByDomain[domain] || []).length
    const idbCount = (idbData[domain] || []).length
    const difference = Math.abs(supabaseCount - idbCount)

    if (difference > 0) {
      discrepancies.push({
        domain: domain as Domain,
        supabaseCount,
        idbCount,
        difference
      })
    }
  }

  // Estimate cache size
  const cacheString = JSON.stringify(idbData)
  const cacheSizeBytes = new Blob([cacheString]).size

  const report: DataVerificationReport = {
    timestamp: new Date().toISOString(),
    userId: user.id,
    totalSupabase: supabaseEntries.length,
    totalIDB: Object.values(idbData).flat().length,
    discrepancies: discrepancies.sort((a, b) => b.difference - a.difference),
    cacheSizeBytes
  }

  console.log('📊 Data Verification Report:', report)
  return report
}

/**
 * Force sync: Clear cache and reload from Supabase
 */
export async function forceSyncFromSupabase(): Promise<void> {
  console.log('🔄 Force syncing from Supabase...')
  
  // Clear cache
  await clearAllCache()
  
  // Trigger a reload event that DataProvider listens to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('force-data-reload'))
  }
  
  console.log('✅ Force sync initiated - page will reload data')
}

/**
 * Get detailed domain statistics
 */
export async function getDomainStats(domain: Domain) {
  const supabase = createClientComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const entries = await listDomainEntries(supabase, domain)
  
  return {
    domain,
    totalEntries: entries.length,
    withTitles: entries.filter(e => e.title).length,
    withDescriptions: entries.filter(e => e.description).length,
    withMetadata: entries.filter(e => e.metadata && Object.keys(e.metadata).length > 0).length,
    metadataKeys: [...new Set(entries.flatMap(e => Object.keys(e.metadata || {})))],
    recentEntries: entries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title,
        created: e.createdAt,
        metadataKeys: Object.keys(e.metadata || {})
      }))
  }
}

/**
 * Export all user data as JSON for inspection
 */
export async function exportAllData(): Promise<string> {
  const supabase = createClientComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const entries = await listDomainEntries(supabase)
  const byDomain = entries.reduce<Record<string, DomainData[]>>((acc, entry) => {
    if (!acc[entry.domain]) acc[entry.domain] = []
    acc[entry.domain].push(entry)
    return acc
  }, {})

  const exportData = {
    exportDate: new Date().toISOString(),
    userId: user.id,
    userEmail: user.email,
    totalEntries: entries.length,
    domains: Object.keys(byDomain).length,
    data: byDomain
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download data as JSON file
 */
export async function downloadDataExport(): Promise<void> {
  const json = await exportAllData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifehub-data-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

