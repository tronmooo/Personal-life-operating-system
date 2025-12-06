import { supabase } from './client'
import { Domain } from '@/types/domains'

export interface SyncData {
  domains?: Record<string, any[]>
  tasks?: any[]
  habits?: any[]
  bills?: any[]
  events?: any[]
  goals?: any[]
}

export async function syncAllToSupabase(data: SyncData) {
  try {
    if (!supabase) {
      console.log('Supabase not configured, skipping sync')
      return { success: false, error: 'Supabase not configured' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('No session, skipping sync')
      return { success: false, error: 'Not authenticated' }
    }

    const payload = {
      action: 'sync_up',
      data,
    }
    
    console.log('📤 Sending to Supabase edge function:', {
      action: payload.action,
      dataKeys: Object.keys(payload.data || {}),
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-all-data`
    })

    let response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-all-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    )

    // Ensure HTTP status is OK
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sync HTTP error:', response.status, errorText)

      // Fallback: try legacy contract used by older deployed functions
      if (errorText.includes('Invalid action')) {
        const legacyPayload = {
          action: 'sync_all',
          allData: data,
        }
        console.warn('➡️ Retrying with legacy payload:', { action: legacyPayload.action })
        response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-all-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(legacyPayload),
          }
        )

        if (!response.ok) {
          const err2 = await response.text()
          console.error('Legacy sync HTTP error:', response.status, err2)
          return { success: false, error: `HTTP ${response.status}: ${err2}` }
        }
      } else {
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }
    }

    const result = await response.json()
    // Edge function typically wraps as { success, data }
    if (result && result.success === false) {
      return { success: false, error: result.error || 'Edge function reported failure' }
    }
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Sync error:', error)
    return { success: false, error: error.message }
  }
}

export async function syncDomainData(domain: Domain, data: any[]) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-domain-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain,
          data,
          action: 'upsert',
        }),
      }
    )

    const result = await response.json()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Domain sync error:', error)
    return { success: false, error: error.message }
  }
}

export async function addDomainData(domain: Domain, data: any) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-domain-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain,
          data,
          action: 'add',
        }),
      }
    )

    const result = await response.json()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Add domain data error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateDomainData(domain: Domain, id: string, data: any) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-domain-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain,
          data: { id, ...data },
          action: 'update',
        }),
      }
    )

    const result = await response.json()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update domain data error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteDomainData(domain: Domain, id: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-domain-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain,
          data: { id },
          action: 'delete',
        }),
      }
    )

    const result = await response.json()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Delete domain data error:', error)
    return { success: false, error: error.message }
  }
}

export async function getAllFromSupabase(): Promise<SyncData> {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-all-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_all',
        }),
      }
    )

    const result = await response.json()
    
    // Access data from the wrapped response (edge function wraps in { success, data })
    const responseData = result.data || result

    return {
      domains: responseData.domains || {},
      tasks: responseData.tasks || [],
      habits: responseData.habits || [],
      bills: responseData.bills || [],
      events: responseData.events || [],
      goals: responseData.goals || [],
    }
  } catch (error: any) {
    console.error('Get all error:', error)
    throw error
  }
}

// Set up realtime subscriptions
export function subscribeToAllChanges(userId: string, callback: (payload: any) => void) {
  const channels: any[] = []

  if (!supabase) {
    console.warn('Supabase not configured, skipping realtime subscriptions')
    return {
      unsubscribe: () => {},
      channels: []
    }
  }

  // Subscribe to tasks
  const tasksChannel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback({ ...payload, tableName: 'tasks' })
    )
    .subscribe()

  channels.push(tasksChannel)

  // Subscribe to habits
  const habitsChannel = supabase
    .channel('habits-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback({ ...payload, tableName: 'habits' })
    )
    .subscribe()

  channels.push(habitsChannel)

  // Subscribe to bills
  const billsChannel = supabase
    .channel('bills-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bills',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback({ ...payload, tableName: 'bills' })
    )
    .subscribe()

  channels.push(billsChannel)

  // Subscribe to events
  const eventsChannel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback({ ...payload, tableName: 'events' })
    )
    .subscribe()

  channels.push(eventsChannel)

  // Subscribe to domains
  const domainsChannel = supabase
    .channel('domains-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'domains',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback({ ...payload, tableName: 'domains' })
    )
    .subscribe()

  channels.push(domainsChannel)

  // Return unsubscribe function
  return () => {
    if (!supabase) return
    channels.forEach(channel => supabase?.removeChannel(channel))
  }
}



