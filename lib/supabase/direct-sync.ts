import { supabase } from './client'
import { Domain } from '@/types/domains'

/**
 * DIRECT TABLE SYNC - Bypasses edge functions entirely
 * Writes directly to Supabase tables for maximum reliability
 */

export interface SyncData {
  domains?: Record<string, any[]>
  tasks?: any[]
  habits?: any[]
  bills?: any[]
  events?: any[]
}

/**
 * Sync all data directly to Supabase tables (NO edge function)
 */
export async function syncDirectToSupabase(data: SyncData) {
  try {
    if (!supabase) {
      console.error('❌ Supabase not configured')
      return { success: false, error: 'Supabase not configured' }
    }

    // Check for session in multiple ways
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      // Try to get user directly
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No session for direct sync')
        return { success: false, error: 'Not authenticated' }
      }
      // Use user.id if we have it
      const userId = user.id
      console.log('📤 DIRECT sync using user ID:', userId)

      // Continue with sync using userId
      return await performSync(data, userId)
    }

    const userId = session.user.id
    console.log('📤 DIRECT sync to Supabase tables (bypassing edge function)...')

    return await performSync(data, userId)
  } catch (error: any) {
    console.error('❌ Direct sync error:', error)
    return { success: false, error: error.message || 'Sync failed' }
  }
}

/**
 * Perform the actual sync with a given user ID
 */
async function performSync(data: SyncData, userId: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Sync domains - UPSERT each domain to domains table
    if (data.domains) {
      for (const [domainName, domainData] of Object.entries(data.domains)) {
        const { error } = await supabase
          .from('domains')
          .upsert(
            {
              user_id: userId,
              domain_name: domainName,
              data: domainData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,domain_name',
            }
          )

        if (error) {
          console.error(`❌ Failed to sync ${domainName}:`, error)
          return { success: false, error: `Failed to sync ${domainName}: ${error.message}` }
        }
      }
    }

    // Sync tasks
    if (data.tasks && data.tasks.length > 0) {
      const { error } = await supabase
        .from('tasks')
        .upsert(
          data.tasks.map(t => ({ ...t, user_id: userId })),
          { onConflict: 'id' }
        )
      if (error) {
        console.error('❌ Failed to sync tasks:', error)
      }
    }

    // Sync habits
    if (data.habits && data.habits.length > 0) {
      const { error } = await supabase
        .from('habits')
        .upsert(
          data.habits.map(h => ({ ...h, user_id: userId })),
          { onConflict: 'id' }
        )
      if (error) {
        console.error('❌ Failed to sync habits:', error)
      }
    }

    // Sync bills
    if (data.bills && data.bills.length > 0) {
      const { error } = await supabase
        .from('bills')
        .upsert(
          data.bills.map(b => ({ ...b, user_id: userId })),
          { onConflict: 'id' }
        )
      if (error) {
        console.error('❌ Failed to sync bills:', error)
      }
    }

    // Sync events
    if (data.events && data.events.length > 0) {
      const { error } = await supabase
        .from('events')
        .upsert(
          data.events.map(e => ({ ...e, user_id: userId })),
          { onConflict: 'id' }
        )
      if (error) {
        console.error('❌ Failed to sync events:', error)
      }
    }

    console.log('✅ DIRECT sync completed successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Direct sync error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load all data directly from Supabase tables (NO edge function)
 */
export async function loadDirectFromSupabase(): Promise<SyncData> {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Not authenticated')
    }

    const userId = session.user.id
    console.log('📥 DIRECT load from Supabase tables...')

    const [domainsResult, tasksResult, habitsResult, billsResult, eventsResult] = await Promise.all([
      supabase.from('domains').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('bills').select('*').eq('user_id', userId),
      supabase.from('events').select('*').eq('user_id', userId),
    ])

    // Transform domains array to object keyed by domain_name
    const domainsObj: Record<string, any[]> = {}
    if (domainsResult.data) {
      domainsResult.data.forEach((domain: any) => {
        domainsObj[domain.domain_name] = domain.data || []
      })
    }

    console.log('✅ DIRECT load completed:', {
      domains: Object.keys(domainsObj).length,
      tasks: tasksResult.data?.length || 0,
      habits: habitsResult.data?.length || 0,
      bills: billsResult.data?.length || 0,
      events: eventsResult.data?.length || 0,
    })

    return {
      domains: domainsObj,
      tasks: tasksResult.data || [],
      habits: habitsResult.data || [],
      bills: billsResult.data || [],
      events: eventsResult.data || [],
    }
  } catch (error: any) {
    console.error('❌ Direct load error:', error)
    throw error
  }
}

