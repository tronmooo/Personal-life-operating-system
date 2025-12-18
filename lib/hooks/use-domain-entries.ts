import { useCallback, useEffect, useMemo, useState, useContext, useRef } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Domain, DomainData } from '@/types/domains'
import { getUserSettings } from '@/lib/supabase/user-settings'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

// Cache key helper for domain entries
function getCacheKey(domain?: Domain, personId?: string): string {
  return `domain-entries:${domain || 'all'}:${personId || 'me'}`
}

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

  // 🔧 FIX: Build query with proper person_id filtering
  // The .or() method should work correctly, but let's add explicit logging
  let query = client
    .from('domain_entries')  // Use table directly instead of view to access person_id
    .select('id, domain, title, description, metadata, created_at, updated_at, person_id')
    .eq('user_id', user.id) // 🔧 FIX: Filter by current user!
    .order('created_at', { ascending: true })
  
  // Filter by domain FIRST if specified (this is more selective)
  if (domain) {
    query = query.eq('domain', domain)
  }
  
  // Filter by person_id, including NULL values for the 'me' person (backward compatibility)
  // 🔧 FIX: Use explicit filter with quoted string value
  if (activePersonId === 'me') {
    // person_id can be 'me' OR NULL for backward compatibility
    query = query.or('person_id.eq.me,person_id.is.null')
  } else {
    query = query.eq('person_id', activePersonId)
  }

  console.log('🔍 [listDomainEntries] Final query for:', { domain: domain || 'all', activePersonId, userId: user.id })

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
  const [isLoading, setIsLoading] = useState(true) // Start as true - we're always loading initially
  const [error, setError] = useState<string | null>(null)
  const [currentPersonId, setCurrentPersonId] = useState<string>('me')
  const initialLoadDone = useRef(false)
  const cacheHydrated = useRef(false)

  // 🚀 INSTANT HYDRATION: Load from IDB cache immediately on mount
  useEffect(() => {
    if (cacheHydrated.current) return
    cacheHydrated.current = true
    
    const hydrateFromCache = async () => {
      try {
        const personId = await getActivePersonId()
        const cacheKey = getCacheKey(domain, personId)
        const cached = await idbGet<DomainData[]>(cacheKey)
        
        if (cached && cached.length > 0 && !initialLoadDone.current) {
          console.log(`⚡ [useDomainEntries] Instant hydration from cache: ${cached.length} entries for ${domain || 'all'}`)
          setEntries(cached)
          setCurrentPersonId(personId)
          // 🔑 KEY: Stop showing loading state when we have cached data
          setIsLoading(false)
        }
      } catch (err) {
        console.warn('⚠️ [useDomainEntries] Cache hydration failed:', err)
      }
    }
    
    hydrateFromCache()
  }, [domain])

  const fetchEntries = useCallback(async () => {
    // Don't set loading if we already have cached data (background refresh)
    if (entries.length === 0) {
      setIsLoading(true)
    }
    setError(null)
    console.log(`🔄 [useDomainEntries] Fetching entries for domain: ${domain || 'all'}`)
    try {
      // Get current active person ID
      const personId = await getActivePersonId()
      setCurrentPersonId(personId)
      console.log(`🔄 [useDomainEntries] Using personId: ${personId}`)
      
      const data = await listDomainEntries(supabase, domain, personId)
      console.log(`✅ [useDomainEntries] Loaded ${data.length} entries for domain: ${domain || 'all'}`)
      
      // 🔧 DEBUG: Log each entry when loading home domain
      if (domain === 'home' && data.length > 0) {
        data.forEach((entry, i) => {
          console.log(`✅ [useDomainEntries] Home entry ${i}:`, entry.title, entry.metadata?.itemType)
        })
      }
      
      setEntries(data)
      initialLoadDone.current = true
      
      // 💾 Save to IDB cache for instant hydration on next load
      const cacheKey = getCacheKey(domain, personId)
      await idbSet(cacheKey, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('❌ [useDomainEntries] Failed to load domain entries:', {
        domain,
        error: error.message,
        stack: error.stack
      })
      // Only clear entries if we don't have cached data
      if (!cacheHydrated.current || entries.length === 0) {
        setEntries([])
      }
      setError(error.message)
    }
    setIsLoading(false)
  }, [domain, supabase, entries.length])

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

  // Helper to emit events for faster dashboard updates
  const emitDomainEvent = useCallback((entryDomain: Domain, action: 'add' | 'update' | 'delete', data: DomainData[]) => {
    if (typeof window === 'undefined') return
    console.log(`🔔 [useDomainEntries] Emitting event for ${entryDomain}:`, action)
    window.dispatchEvent(new CustomEvent('data-updated', {
      detail: { domain: entryDomain, data, action, timestamp: Date.now() }
    }))
    window.dispatchEvent(new CustomEvent(`${entryDomain}-data-updated`, {
      detail: { data, action, timestamp: Date.now() }
    }))
  }, [])

  const createEntry = useCallback(
    async (payload: CreateDomainEntryPayload) => {
      try {
        const created = await createDomainEntry(supabase, payload)
        setEntries(prev => {
          const updated = [...prev, created]
          // 🔥 Emit event immediately for faster dashboard updates
          emitDomainEvent(payload.domain, 'add', updated)
          // 💾 Update IDB cache
          const cacheKey = getCacheKey(domain, currentPersonId)
          idbSet(cacheKey, updated).catch(() => {})
          return updated
        })
        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase, emitDomainEvent, domain, currentPersonId]
  )

  const updateEntry = useCallback(
    async (payload: UpdateDomainEntryPayload) => {
      try {
        const updated = await updateDomainEntry(supabase, payload)
        setEntries(prev => {
          const newEntries = prev.map(entry => (entry.id === updated.id ? updated : entry))
          // 🔥 Emit event immediately for faster dashboard updates
          if (domain) emitDomainEvent(domain, 'update', newEntries)
          // 💾 Update IDB cache
          const cacheKey = getCacheKey(domain, currentPersonId)
          idbSet(cacheKey, newEntries).catch(() => {})
          return newEntries
        })
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase, domain, emitDomainEvent, currentPersonId]
  )

  const removeEntry = useCallback(
    async (id: string) => {
      try {
        await deleteDomainEntry(supabase, id)
        setEntries(prev => {
          const newEntries = prev.filter(entry => entry.id !== id)
          // 🔥 Emit event immediately for faster dashboard updates
          if (domain) emitDomainEvent(domain, 'delete', newEntries)
          // 💾 Update IDB cache
          const cacheKey = getCacheKey(domain, currentPersonId)
          idbSet(cacheKey, newEntries).catch(() => {})
          return newEntries
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        throw error
      }
    },
    [supabase, domain, emitDomainEvent, currentPersonId]
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
