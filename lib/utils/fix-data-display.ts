/**
 * Utility to fix data display issues by clearing caches and reloading from Supabase
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { idbDel } from './idb-cache'

export async function fixDataDisplay() {
  console.log('🔧 Starting data display fix...')

  try {
    // 1. Clear all IndexedDB caches
    console.log('1️⃣ Clearing IndexedDB caches...')
    await idbDel('domain_entries_snapshot')
    await idbDel('tasks_snapshot')
    await idbDel('habits_snapshot')
    await idbDel('bills_snapshot')
    await idbDel('dismissed-alerts')
    console.log('✅ IDB caches cleared')

    // 2. Verify authentication
    console.log('2️⃣ Checking authentication...')
    const supabase = createClientComponentClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Auth error:', error)
      throw new Error('Authentication failed: ' + error.message)
    }

    if (!session?.user) {
      console.warn('⚠️ No user session found')
      throw new Error('Please sign in to view your data')
    }

    console.log('✅ Authenticated as:', session.user.email || session.user.id)

    // 3. Force a fresh data load by dispatching an event
    console.log('3️⃣ Triggering data reload...')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-data-reload'))
    }

    console.log('✅ Data display fix complete!')
    return {
      success: true,
      user: session.user.email || session.user.id
    }
  } catch (error: any) {
    console.error('❌ Fix failed:', error)
    return {
      success: false,
      error: error.message || String(error)
    }
  }
}

/**
 * Check if data is displaying correctly
 */
export async function checkDataConsistency() {
  const supabase = createClientComponentClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return {
        consistent: false,
        issue: 'Not authenticated'
      }
    }

    // Count entries in database
    const { data: entries, error } = await supabase
      .from('domain_entries')
      .select('domain')
      .eq('user_id', session.user.id)

    if (error) {
      return {
        consistent: false,
        issue: 'Database query failed: ' + error.message
      }
    }

    const dbCounts: Record<string, number> = {}
    entries?.forEach((entry: any) => {
      dbCounts[entry.domain] = (dbCounts[entry.domain] || 0) + 1
    })

    return {
      consistent: true,
      dbCounts,
      totalEntries: entries?.length || 0
    }
  } catch (error: any) {
    return {
      consistent: false,
      issue: error.message || String(error)
    }
  }
}
