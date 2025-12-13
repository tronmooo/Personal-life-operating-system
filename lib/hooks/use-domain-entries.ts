import { useCallback, useEffect, useMemo, useState, useContext } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Domain, DomainData } from '@/types/domains'
import { getUserSettings } from '@/lib/supabase/user-settings'

interface BaseDomainEntryPayload {
  title?: string
  description?: string
  metadata?: DomainData['metadata']
  domain?: Domain
  person_id?: string
}

interface CreateDomainEntryPayload extends BaseDomainEntryPayload {
  title: string
  domain: Domain
  id?: string
  person_id?: string
}

interface UpdateDomainEntryPayload extends BaseDomainEntryPayload {
  id: string
}

// Helper to get the active person ID from user settings
async function getActivePersonId(): Promise<string> {
  try {
    const settings = await getUserSettings()
    // Check for activePersonId first, then look for the active person in the people array
    if (settings?.activePersonId) {
      return settings.activePersonId
    }
    const people = settings?.people || []
    const activePerson = people.find((p: any) => p.isActive)
    return activePerson?.id || 'me'
  } catch (error) {
    console.warn('Failed to get active person ID, defaulting to "me":', error)
    return 'me'
  }
}

export function normalizeDomainEntry(entry: any): DomainData {
  return {
    id: entry.id,
    domain: entry.domain as Domain,
    title: entry.title,
    description: entry.description ?? undefined,
    createdAt: entry.created_at ?? entry.createdAt ?? new Date().toISOString(),
    updatedAt: entry.updated_at ?? entry.updatedAt ?? new Date().toISOString(),
    // Normalize metadata to a single predictable shape. Some rows store metadata directly
    // while others store a nested `metadata.metadata` object. Prefer the inner object
    // when present so UI code can rely on a consistent structure.
    metadata: entry.metadata?.metadata ?? entry.metadata ?? {},
  }
}

export async function listDomainEntries(client: SupabaseClient, domain?: Domain, personId?: string): Promise<DomainData[]> {
  // 🔧 FIX: Get current user to filter entries (view doesn't have RLS)
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    console.warn('⚠️ Not authenticated, cannot list domain entries')
    return []
  }

  // Get active person ID if not provided
  const activePersonId = personId || await getActivePersonId()
  
  console.log(`📋 Loading domain entries for person: ${activePersonId}, domain: ${domain || 'all'}`)
  // #region agent log
  console.log('🔍 [DEBUG-LISTDOMAINENTRIES] Query params:', { userId: user.id, activePersonId, domain: domain || 'all' })
  // #endregion

  let query = client
    .from('domain_entries')  // Use table directly instead of view to access person_id
    .select('id, domain, title, description, metadata, created_at, updated_at, person_id')
    .eq('user_id', user.id) // 🔧 FIX: Filter by current user!
    .order('created_at', { ascending: true })
  
  // Filter by person_id, including NULL values for the 'me' person (backward compatibility)
  if (activePersonId === 'me') {
    query = query.or(`person_id.eq.${activePersonId},person_id.is.null`)
  } else {
    query = query.eq('person_id', activePersonId)
  }
  
  if (domain) {
    query = query.eq('domain', domain)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  console.log(`✅ Loaded ${data?.length || 0} entries for person ${activePersonId}`)
  // #region agent log
  const digitalEntries = data?.filter(e => e.domain === 'digital') || []
  console.log('🔍 [DEBUG-LISTDOMAINENTRIES] Digital entries in result:', {
    totalLoaded: data?.length || 0,
    digitalCount: digitalEntries.length,
    digitalEntries: digitalEntries.slice(0, 5).map(e => ({
      id: e.id,
      title: e.title,
      domain: e.domain,
      person_id: e.person_id,
      type: e.metadata?.type
    }))
  })
  // #endregion
  return (data ?? []).map(normalizeDomainEntry)
}

export async function createDomainEntry(client: SupabaseClient, payload: CreateDomainEntryPayload): Promise<DomainData> {
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) {
    throw userError
  }

  if (!user?.id) {
    throw new Error('Not authenticated')
  }

  // Get active person ID - use provided one or fetch from settings
  const activePersonId = payload.person_id || await getActivePersonId()
  
  const insertPayload: Record<string, any> = {
    domain: payload.domain,
    title: payload.title,
    description: payload.description ?? null,
    metadata: payload.metadata ?? {},
    user_id: user.id,
    person_id: activePersonId, // 🔧 NEW: Include person_id in new entries
  }

  if (payload.id) {
    insertPayload.id = payload.id
  }

  console.log('🔵 About to insert into domain_entries:', {
    payload: insertPayload,
    userId: user.id,
    userEmail: user.email,
    personId: activePersonId
  })

  const { data, error } = await client
    .from('domain_entries')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    console.error('❌ Supabase insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: insertPayload
    })
    throw error
  }

  if (!data) {
    console.error('❌ No data returned from insert, but no error either')
    throw new Error('Failed to create domain entry: no data returned')
  }

  return normalizeDomainEntry(data)
}

export async function updateDomainEntry(client: SupabaseClient, payload: UpdateDomainEntryPayload): Promise<DomainData> {
  const updates: Record<string, any> = {}
  if (payload.title !== undefined) updates.title = payload.title
  if (payload.description !== undefined) updates.description = payload.description
  if (payload.metadata !== undefined) updates.metadata = payload.metadata
  if (payload.domain !== undefined) updates.domain = payload.domain

  const { data, error } = await client
    .from('domain_entries')
    .update(updates)
    .eq('id', payload.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return normalizeDomainEntry(data)
}

export async function deleteDomainEntry(client: SupabaseClient, id: string): Promise<void> {
  // 🔒 SAFETY CHECK: Verify user is authenticated before deleting
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated - cannot delete entry')
  }
  
  // 🔒 SAFETY CHECK: Verify ID is provided
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid entry ID provided for deletion')
  }

  console.log(`🗑️ Deleting entry ${id} for user ${user.id}`)
  
  // Delete with explicit user_id check for safety (belt + suspenders)
  const { error, count } = await client
    .from('domain_entries')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id)  // 🔒 EXPLICIT user_id check (doesn't rely solely on RLS)
  
  if (error) {
    console.error('❌ Delete failed:', error)
    throw error
  }
  
  console.log(`✅ Deleted ${count ?? 0} entries`)
  
  // 🔒 SAFETY CHECK: Verify exactly 1 entry was deleted
  if (count !== 1) {
    console.warn(`⚠️ Expected to delete 1 entry, but deleted ${count ?? 0}`)
  }
}

export function useDomainEntries(domain?: Domain) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [entries, setEntries] = useState<DomainData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPersonId, setCurrentPersonId] = useState<string>('me')

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get current active person ID
      const personId = await getActivePersonId()
      setCurrentPersonId(personId)
      
      const data = await listDomainEntries(supabase, domain, personId)
      setEntries(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Failed to load domain entries:', {
        domain,
        error: error.message,
        stack: error.stack
      })
      setEntries([])
      setError(error.message)
    }
    setIsLoading(false)
  }, [domain, supabase])

  // Initial fetch
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // 🔄 PERSON CHANGE LISTENER: Refetch when active person changes
  useEffect(() => {
    const handlePersonChange = () => {
      console.log('👤 Person changed, refetching entries...')
      fetchEntries()
    }
    
    window.addEventListener('person-changed', handlePersonChange)
    window.addEventListener('profile-changed', handlePersonChange)
    
    return () => {
      window.removeEventListener('person-changed', handlePersonChange)
      window.removeEventListener('profile-changed', handlePersonChange)
    }
  }, [fetchEntries])

  // 🔄 REALTIME SUBSCRIPTION: Listen for changes to keep all instances in sync
  useEffect(() => {
    const channel = supabase
      .channel(`domain_entries:${domain || 'all'}:${currentPersonId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'domain_entries',
          filter: domain ? `domain=eq.${domain}` : undefined,
        },
        (payload) => {
          console.log('🔄 Realtime change detected:', payload)
          
          // Refetch all entries to ensure consistency
          // This is simpler than trying to merge individual changes
          fetchEntries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [domain, supabase, fetchEntries, currentPersonId])

  const createEntry = useCallback(
    async (payload: CreateDomainEntryPayload) => {
      try {
        const created = await createDomainEntry(supabase, payload)
        setEntries(prev => [...prev, created])
        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase]
  )

  const updateEntry = useCallback(
    async (payload: UpdateDomainEntryPayload) => {
      try {
        const updated = await updateDomainEntry(supabase, payload)
        setEntries(prev => prev.map(entry => (entry.id === updated.id ? updated : entry)))
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase]
  )

  const removeEntry = useCallback(
    async (id: string) => {
      try {
        await deleteDomainEntry(supabase, id)
        setEntries(prev => prev.filter(entry => entry.id !== id))
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase]
  )

  return {
    entries,
    isLoading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry: removeEntry,
    setEntries,
  }
}
