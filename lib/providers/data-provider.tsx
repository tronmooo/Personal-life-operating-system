'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { Domain, DomainData } from '@/types/domains'
import { createSafeBrowserClient } from '@/lib/supabase/safe-client'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'
import { toast } from '@/lib/utils/toast'
import {
  listDomainEntries,
  createDomainEntry as createDomainEntryRecord,
  updateDomainEntry as updateDomainEntryRecord,
  deleteDomainEntry as deleteDomainEntryRecord,
} from '@/lib/hooks/use-domain-entries'
import { getUserSettings } from '@/lib/supabase/user-settings'

// Helper to get the active person ID
async function getActivePersonId(): Promise<string> {
  try {
    const settings = await getUserSettings()
    if (settings?.activePersonId) {
      return settings.activePersonId
    }
    const people = settings?.people || []
    const activePerson = people.find((p: any) => p.isActive)
    return activePerson?.id || 'me'
  } catch (error) {
    return 'me'
  }
}

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  category?: string
  createdAt: string
}

export interface Habit {
  id: string
  name: string
  completed: boolean
  streak: number
  icon: string
  frequency: 'daily' | 'weekly' | 'monthly'
  createdAt: string
  lastCompleted?: string
}

export interface Bill {
  id: string
  title: string
  amount: number
  dueDate: string
  category: string
  status: 'paid' | 'pending' | 'overdue'
  recurring: boolean
  createdAt: string
}

export interface Document {
  id: string
  title: string
  category: string
  expiryDate?: string
  fileUrl?: string
  extractedText?: string
  tags: string[]
  createdAt: string
}

export interface Event {
  id: string
  title: string
  date: string
  type: string
  description?: string
  reminder?: boolean
  createdAt: string
}

interface DataContextType {
  data: Record<string, DomainData[]>
  tasks: Task[]
  habits: Habit[]
  bills: Bill[]
  documents: Document[]
  events: Event[]
  isLoading: boolean
  isLoaded: boolean
  addData: (domain: Domain, data: Partial<DomainData>) => void
  updateData: (domain: Domain, id: string, data: Partial<DomainData>) => void
  deleteData: (domain: Domain, id: string) => void
  getData: (domain: Domain) => DomainData[]
  reloadDomain: (domain: Domain) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleHabit: (id: string) => void
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => Promise<void>
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>
  deleteBill: (id: string) => Promise<void>
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// ⚠️ localStorage REMOVED - All data now saves directly to Supabase database
// This ensures data persists correctly and never reverts to stale/phantom data

export function DataProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabaseClient] = useState<ReturnType<typeof createSafeBrowserClient>>(null)
  const [session, setSession] = useState<any>(null)
  const [data, setData] = useState<Record<string, DomainData[]>>({})
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activePersonId, setActivePersonId] = useState<string>('me')

  const getDomainSnapshotKey = useCallback(() => {
    const userId = session?.user?.id
    return userId ? `domain_entries_snapshot_${userId}_${activePersonId}` : null
  }, [session?.user?.id, activePersonId])

  const emitDomainEvents = useCallback((domain: Domain, payload: DomainData[], action: 'add' | 'update' | 'delete') => {
    if (typeof window === 'undefined') return
    try {
      console.log(`🔔 DataProvider emitting events for ${domain}:`, action, 'New data count:', payload.length)
      window.dispatchEvent(new CustomEvent('data-updated', {
        detail: { domain, data: payload, action, timestamp: Date.now() }
      }))
      window.dispatchEvent(new CustomEvent(`${domain}-data-updated`, {
        detail: { data: payload, action, timestamp: Date.now() }
      }))
      if (domain === 'financial') {
        window.dispatchEvent(new CustomEvent('financial-data-updated', {
          detail: { data: payload, action, timestamp: Date.now() }
        }))
      }
      console.log(`✅ Events dispatched for ${domain}`)
    } catch (error) {
      console.error('Failed to dispatch data update events:', error)
    }
  }, [])

  // Initialize Supabase client on mount
  useEffect(() => {
    const client = createSafeBrowserClient()
    setSupabaseClient(client)
  }, [])

  // Listen for auth changes
  useEffect(() => {
    if (!supabase) {
      console.warn('⚠️ Supabase not initialized yet')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'data-provider.tsx:supabase-null',message:'DataProvider: Supabase not initialized',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'data-provider.tsx:before-getSession',message:'DataProvider: About to call getSession',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 DataProvider: Initial session check', session?.user?.email || 'NO USER')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'data-provider.tsx:getSession-result',message:'DataProvider: getSession result',data:{hasSession:!!session,hasUser:!!session?.user,userEmail:session?.user?.email||'none'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 DataProvider: Auth state changed', _event, session?.user?.email || 'NO USER')
      setSession(session)
      
      // Reload data when user signs in
      if (_event === 'SIGNED_IN' && session?.user) {
        console.log('🔄 User signed in, reloading data...')
        // Call loadData immediately without storing in const
        void (async () => {
          await loadData()
          
          // Sync pending documents from IndexedDB to Supabase
          try {
            const { syncPendingDocuments } = await import('@/lib/sync-pending-documents')
            const result = await syncPendingDocuments()
            if (result.synced > 0) {
              console.log(`✅ Synced ${result.synced} pending document(s) from offline storage`)
            }
          } catch (error) {
            console.error('❌ Error syncing pending documents:', error)
          }
        })()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 🔥 Load directly from Supabase (normalized domain_entries only) with IDB fallback
  const loadData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3
    setIsLoading(true)
    console.log(`📡 Loading domain data from Supabase... (attempt ${retryCount + 1}/${maxRetries + 1})`)
    console.log('🔐 Supabase Auth:', session?.user?.email)

    // Ensure supabase client is initialized
    if (!supabase) {
      console.warn('⚠️ Supabase client not initialized yet, skipping data load')
      setIsLoading(false)
      return
    }

    try {
      // Use the session state from the provider
      const user = session?.user

      // Treat missing session as non-fatal (no retries)
      // Session state is managed by the provider, no need to check for errors here

      if (!user) {
        console.log('👀 Viewing as guest - no user data to load')
        // Allow viewing the app without authentication
        // Data will be empty but UI will render
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      console.log('✅ Authenticated! User:', user.email ?? user.id)

      const currentPersonId = await getActivePersonId()
      setActivePersonId(currentPersonId)

      const snapshotSuffix = `${user.id}_${currentPersonId}`
      const domainSnapshotKey = `domain_entries_snapshot_${snapshotSuffix}`
      const tasksSnapshotKey = `tasks_snapshot_${snapshotSuffix}`
      const habitsSnapshotKey = `habits_snapshot_${snapshotSuffix}`
      const billsSnapshotKey = `bills_snapshot_${snapshotSuffix}`

      // Try cached snapshots first for instant UI (non-blocking)
      if (domainSnapshotKey) {
        const cachedDomains = await idbGet<Record<string, DomainData[]>>(domainSnapshotKey, {})
        if (cachedDomains && Object.keys(cachedDomains).length > 0) {
          setData(cachedDomains)
        }
      }

      if (tasksSnapshotKey) {
        const cachedTasks = await idbGet<Task[]>(tasksSnapshotKey, [])
        if (Array.isArray(cachedTasks) && cachedTasks.length > 0) setTasks(cachedTasks)
      }

      if (habitsSnapshotKey) {
        const cachedHabits = await idbGet<Habit[]>(habitsSnapshotKey, [])
        if (Array.isArray(cachedHabits) && cachedHabits.length > 0) setHabits(cachedHabits)
      }

      if (billsSnapshotKey) {
        const cachedBills = await idbGet<Bill[]>(billsSnapshotKey, [])
        if (Array.isArray(cachedBills) && cachedBills.length > 0) setBills(cachedBills)
      }

      const domainEntries = await listDomainEntries(supabase)
      // #region agent log
      console.log('🔍 [DEBUG-DATAPROVIDER] Raw domainEntries from listDomainEntries:', {
        totalCount: domainEntries.length,
        byDomain: domainEntries.reduce((acc: Record<string, number>, e) => {
          acc[e.domain] = (acc[e.domain] || 0) + 1
          return acc
        }, {}),
        digitalEntriesRaw: domainEntries.filter(e => e.domain === 'digital').slice(0, 3).map(e => ({
          id: e.id,
          title: e.title,
          domain: e.domain,
          metadataType: e.metadata?.type,
          metadataKeys: Object.keys(e.metadata || {})
        }))
      })
      // #endregion
      const domainsObj = domainEntries.reduce<Record<string, DomainData[]>>((acc, entry) => {
        if (!acc[entry.domain]) {
          acc[entry.domain] = []
        }
        acc[entry.domain].push(entry)
        return acc
      }, {})

      console.log('✅ Loaded from Supabase domain_entries:', {
        domains: Object.keys(domainsObj).length,
        items: domainEntries.length,
      })
      // #region agent log
      console.log('🔍 [DEBUG-DATAPROVIDER] Digital domain data:', {
        digitalCount: domainsObj.digital?.length ?? 0,
        allDomains: Object.keys(domainsObj),
        digitalEntries: domainsObj.digital?.slice(0, 5).map((e: any) => ({
          id: e.id,
          title: e.title,
          type: e.metadata?.type,
          monthlyCost: e.metadata?.monthlyCost
        }))
      })
      // #endregion

      setData(domainsObj)
      // Save snapshot to IDB
      if (domainSnapshotKey) {
        idbSet(domainSnapshotKey, domainsObj)
      }

      const userId = user.id
      
      // Get active person ID for filtering
      const activePersonId = await getActivePersonId()
      console.log(`👤 Loading data for person: ${activePersonId}`)

      // Load Tasks from dedicated table
      try {
        let tasksQuery = supabase
          .from('tasks')
          .select('id,title,completed,priority,due_date,category,created_at,user_id,person_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
        
        // Filter by person_id, including NULL for 'me' (backward compatibility)
        if (activePersonId === 'me') {
          tasksQuery = tasksQuery.or(`person_id.eq.${activePersonId},person_id.is.null`)
        } else {
          tasksQuery = tasksQuery.eq('person_id', activePersonId)
        }
        
        const { data: taskRows, error: tasksError } = await tasksQuery

        if (tasksError) {
          console.warn('Failed to load tasks table:', tasksError)
        } else if (Array.isArray(taskRows)) {
          const mappedTasks = taskRows.map((t: any) => ({
            id: t.id,
            title: t.title,
            completed: t.completed || false,
            priority: t.priority || 'medium',
            dueDate: t.due_date || undefined,
            category: t.category || undefined,
            createdAt: t.created_at || new Date().toISOString(),
          }))
          setTasks(mappedTasks)
          if (tasksSnapshotKey) {
            idbSet(tasksSnapshotKey, mappedTasks)
          }
          console.log(`✅ Loaded ${mappedTasks.length} tasks from database`)
        }
      } catch (e) {
        console.warn('Failed to load tasks table:', e)
      }

      // Load Habits from dedicated table
      console.log('🔴 Loading habits from database...')
      try {
        let habitsQuery = supabase
          .from('habits')
          .select('id,name,completion_history,frequency,streak,icon,created_at,user_id,person_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
        
        // Filter by person_id, including NULL for 'me' (backward compatibility)
        if (activePersonId === 'me') {
          habitsQuery = habitsQuery.or(`person_id.eq.${activePersonId},person_id.is.null`)
        } else {
          habitsQuery = habitsQuery.eq('person_id', activePersonId)
        }
        
        const { data: habitRows, error: habitsError } = await habitsQuery

        console.log('🔴 Habits from DB:', { count: habitRows?.length || 0, error: habitsError })

        if (!habitsError && Array.isArray(habitRows)) {
          const today = new Date().toISOString().split('T')[0]
          
          const mapped = habitRows.map((h: any) => {
            const completionHistory = h.completion_history || []
            const frequency = (h.frequency || 'daily') as 'daily' | 'weekly' | 'monthly'
            
            // Check if habit is completed based on frequency
            let isCompletedForPeriod = false
            const lastCompletedDate = completionHistory.length > 0 
              ? completionHistory[completionHistory.length - 1] 
              : null
            
            if (frequency === 'daily') {
              // Daily: check if completed today
              isCompletedForPeriod = completionHistory.includes(today)
            } else if (frequency === 'weekly') {
              // Weekly: check if completed this week (Monday-Sunday)
              const todayDate = new Date()
              const weekStart = new Date(todayDate)
              weekStart.setDate(todayDate.getDate() - todayDate.getDay() + 1) // Monday
              const weekStartStr = weekStart.toISOString().split('T')[0]
              
              isCompletedForPeriod = completionHistory.some((date: string) => date >= weekStartStr && date <= today)
            } else if (frequency === 'monthly') {
              // Monthly: check if completed this month
              const thisMonth = today.substring(0, 7) // YYYY-MM
              isCompletedForPeriod = completionHistory.some((date: string) => date.startsWith(thisMonth))
            }
            
            return {
              id: h.id,
              name: h.name,
              completed: isCompletedForPeriod,
              streak: h.streak || 0,
              icon: h.icon || '⭐',
              frequency: frequency,
              createdAt: h.created_at || new Date().toISOString(),
              lastCompleted: lastCompletedDate ? new Date(lastCompletedDate).toISOString() : undefined,
            }
          })
          setHabits(mapped)
          if (habitsSnapshotKey) {
            idbSet(habitsSnapshotKey, mapped)
          }
          console.log(`✅ Loaded ${mapped.length} habits from database`)
        }
      } catch (e) {
        console.warn('Failed to load habits table:', e)
      }

      // Load Bills from dedicated table
      try {
        let billsQuery = supabase
          .from('bills')
          .select('id,title,amount,due_date,category,status,recurring,created_at,user_id,person_id')
          .eq('user_id', userId)
          .order('due_date', { ascending: true })
        
        // Filter by person_id, including NULL for 'me' (backward compatibility)
        if (activePersonId === 'me') {
          billsQuery = billsQuery.or(`person_id.eq.${activePersonId},person_id.is.null`)
        } else {
          billsQuery = billsQuery.eq('person_id', activePersonId)
        }
        
        const { data: billRows, error: billsError } = await billsQuery

        if (billsError) {
          console.warn('Failed to load bills table:', billsError)
        } else if (Array.isArray(billRows)) {
          const mappedBills = billRows.map((bill: any) => ({
            id: bill.id,
            title: bill.title || 'Untitled Bill',
            amount: Number(bill.amount) || 0,
            dueDate: bill.due_date || bill.created_at || new Date().toISOString(),
            category: bill.category || 'General',
            status: (bill.status || 'pending') as Bill['status'],
            recurring: Boolean(bill.recurring),
            createdAt: bill.created_at || new Date().toISOString(),
          }))
          setBills(mappedBills)
          if (billsSnapshotKey) {
            idbSet(billsSnapshotKey, mappedBills)
          }
          console.log(`✅ Loaded ${mappedBills.length} bills from database`)
        }
      } catch (e) {
        console.warn('Failed to load bills table:', e)
      }
      setIsLoaded(true)
      setIsLoading(false)
      console.log('✅ isLoaded set to TRUE, isLoading set to FALSE')
      
      // Dispatch event so other components know data is updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('data-provider-loaded'))
      }
    } catch (error) {
      console.error(`❌ Failed to load from Supabase (attempt ${retryCount + 1}):`, error)
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`🔄 Retrying in ${delay/1000}s...`)
        setTimeout(() => loadData(retryCount + 1), delay)
      } else {
        console.error('❌ Max retries reached, giving up')
        setIsLoaded(true)
        setIsLoading(false)
      }
    }
  }, [session, supabase])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // 🔄 PERSON CHANGE LISTENER: Reload all data when active person changes
  useEffect(() => {
    const handlePersonChange = () => {
      console.log('👤 Person changed in DataProvider, reloading all data...')
      loadData()
    }
    
    window.addEventListener('person-changed', handlePersonChange)
    window.addEventListener('profile-changed', handlePersonChange)
    
    return () => {
      window.removeEventListener('person-changed', handlePersonChange)
      window.removeEventListener('profile-changed', handlePersonChange)
    }
  }, [loadData])

  // Reload a specific domain (optimized)
  const reloadDomain = useCallback(async (domain: Domain) => {
    if (!session?.user || !supabase) {
      console.warn('⚠️ Not authenticated or Supabase not initialized - cannot reload domain')
      return
    }

    console.log(`🔄 Reloading domain: ${domain}`)
    
    try {
      const personId = await getActivePersonId()
      const entries = await listDomainEntries(supabase, domain, personId)

      setData(prev => {
        const updated = {
          ...prev,
          [domain]: entries,
        }
        const snapshotKey = `domain_entries_snapshot_${session.user.id}_${personId}`
        // 🔧 FIX: Update IDB cache to keep it in sync with Supabase
        idbSet(snapshotKey, updated).catch(err => {
          console.warn('Failed to update IDB cache during reload:', err)
        })
        return updated
      })
      console.log(`✅ Reloaded ${domain} domain from Supabase (${entries.length} entries)`) 
      
      // Dispatch domain-specific event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`${domain}-data-updated`, {
          detail: { data: entries, action: 'reload', timestamp: Date.now() }
        }))
      }
    } catch (error) {
      console.error(`❌ Failed to reload ${domain} domain:`, error)
    }
  }, [session, supabase])

  // Realtime subscriptions for core tables (debounced domain reload)
  useEffect(() => {
    if (!session?.user || !supabase) return

    const userId = session.user.id
    const currentPersonId = activePersonId
    const domainSnapshotKey = `domain_entries_snapshot_${userId}_${currentPersonId}`

    const domainEntriesChannel = supabase
      .channel('realtime-domain-entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_entries' }, async (payload: any) => {
        try {
          console.log('🔵 Realtime event received:', payload.eventType, payload)
          const row = (payload.new || payload.old) as any
          if (!row || row.user_id !== userId) {
            console.log('⚪️ Skipping realtime event (different user or no row)')
            return
          }
          if (row.person_id && row.person_id !== currentPersonId) {
            console.log('⚪️ Skipping realtime event (different person)')
            return
          }
          const domain = row.domain as Domain
          
          // Handle DELETE events immediately without full reload to avoid stale data
          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id
            console.log(`🗑️ Realtime DELETE detected for ${domain} entry ${deletedId}`)
            setData(prev => {
              const currentDomainData = Array.isArray(prev[domain]) ? prev[domain] as DomainData[] : []
              const filteredData = currentDomainData.filter(item => item.id !== deletedId)
              console.log(`🗑️ Realtime DELETE: Removed ${domain} entry ${deletedId} from local state (${currentDomainData.length} -> ${filteredData.length})`)
              
              // ✅ FIX: Update IDB cache using the new updated data (not stale closure)
              const updatedSnapshot = { ...prev, [domain]: filteredData }
              idbSet(domainSnapshotKey, updatedSnapshot).then(() => {
                console.log('✅ IDB cache updated after realtime DELETE')
              }).catch(err => {
                console.warn('Failed to update IDB after realtime DELETE:', err)
              })
              
              return updatedSnapshot
            })
          } else {
            // For INSERT and UPDATE, do an immediate reload (no debounce for instant updates)
            console.log(`🔄 Immediate reload for ${domain} (event: ${payload.eventType})`)
            reloadDomain(domain)
          }
        } catch (e) {
          console.warn('Realtime domain_entries handler error:', e)
        }
      })
      .subscribe()

    const tasksChannel = supabase
      .channel('realtime-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        const row = (payload.new || payload.old) as any
        if (!row || row.user_id !== userId) return
        if (row.person_id && row.person_id !== currentPersonId) return
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const t = payload.new as any
          const mapped: Task = {
            id: t.id,
            title: t.title,
            completed: !!t.completed,
            priority: t.priority || 'medium',
            dueDate: t.due_date || undefined,
            category: t.category || undefined,
            createdAt: t.created_at || new Date().toISOString(),
          }
          setTasks(prev => {
            const exists = prev.some(x => x.id === mapped.id)
            return exists ? prev.map(x => (x.id === mapped.id ? mapped : x)) : [...prev, mapped]
          })
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any).id
          setTasks(prev => prev.filter(x => x.id !== id))
        }
      })
      .subscribe()

    const habitsChannel = supabase
      .channel('realtime-habits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, (payload: any) => {
        const row = (payload.new || payload.old) as any
        if (!row || row.user_id !== userId) return
        if (row.person_id && row.person_id !== currentPersonId) return
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const h = payload.new as any
          const today = new Date().toISOString().split('T')[0]
          const completionHistory = h.completion_history || []
          const frequency = (h.frequency || 'daily') as 'daily' | 'weekly' | 'monthly'
          let isCompletedForPeriod = false
          if (frequency === 'daily') {
            isCompletedForPeriod = completionHistory.includes(today)
          } else if (frequency === 'weekly') {
            const todayDate = new Date()
            const weekStart = new Date(todayDate)
            weekStart.setDate(todayDate.getDate() - todayDate.getDay() + 1)
            const weekStartStr = weekStart.toISOString().split('T')[0]
            isCompletedForPeriod = completionHistory.some((d: string) => d >= weekStartStr && d <= today)
          } else if (frequency === 'monthly') {
            const thisMonth = today.substring(0, 7)
            isCompletedForPeriod = completionHistory.some((d: string) => d.startsWith(thisMonth))
          }
          const mapped: Habit = {
            id: h.id,
            name: h.name,
            completed: isCompletedForPeriod,
            streak: h.streak || 0,
            icon: h.icon || '⭐',
            frequency,
            createdAt: h.created_at || new Date().toISOString(),
            lastCompleted: completionHistory.length > 0 ? new Date(completionHistory[completionHistory.length - 1]).toISOString() : undefined,
          }
          setHabits(prev => {
            const exists = prev.some(x => x.id === mapped.id)
            return exists ? prev.map(x => (x.id === mapped.id ? mapped : x)) : [...prev, mapped]
          })
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any).id
          setHabits(prev => prev.filter(x => x.id !== id))
        }
      })
      .subscribe()

    const billsChannel = supabase
      .channel('realtime-bills')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload: any) => {
        const row = (payload.new || payload.old) as any
        if (!row || row.user_id !== userId) return
        if (row.person_id && row.person_id !== currentPersonId) return
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const b = payload.new as any
          const mapped: Bill = {
            id: b.id,
            title: b.title || 'Untitled Bill',
            amount: Number(b.amount) || 0,
            dueDate: b.due_date || b.created_at || new Date().toISOString(),
            category: b.category || 'General',
            status: (b.status || 'pending') as Bill['status'],
            recurring: !!b.recurring,
            createdAt: b.created_at || new Date().toISOString(),
          }
          setBills(prev => {
            const exists = prev.some(x => x.id === mapped.id)
            return exists ? prev.map(x => (x.id === mapped.id ? mapped : x)) : [...prev, mapped]
          })
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any).id
          setBills(prev => prev.filter(x => x.id !== id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(domainEntriesChannel)
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(habitsChannel)
      supabase.removeChannel(billsChannel)
    }
  }, [session, supabase, reloadDomain, activePersonId])

  // Listen for AI Assistant save events and reload data
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleAISave = () => {
      console.log('🔄 AI saved data - reloading DataProvider...')
      loadData()
    }

    const handleForceReload = () => {
      console.log('🔄 Force reload requested - reloading DataProvider...')
      loadData()
    }

    window.addEventListener('ai-assistant-saved', handleAISave)
    window.addEventListener('force-data-reload', handleForceReload)
    return () => {
      window.removeEventListener('ai-assistant-saved', handleAISave)
      window.removeEventListener('force-data-reload', handleForceReload)
    }
  }, [loadData])

  // ⚠️ REMOVED: Auto-sync useEffect (was causing delays and data loss on refresh)
  // Individual operations (add/update/delete) now sync immediately in their callbacks

  const addData = useCallback(async (domain: Domain, newData: Partial<DomainData>) => {
    const now = new Date().toISOString()
    const entryId = (newData as any)?.id || crypto.randomUUID()
    const optimisticEntry: DomainData = {
      id: entryId,
      domain,
      title: newData.title || 'Untitled',
      description: newData.description,
      createdAt: now,
      updatedAt: now,
      metadata: (newData.metadata || {}) as DomainData['metadata'],
    }

    console.log(`➕ Adding ${domain} entry:`, optimisticEntry.title)

    // Optimistically update UI first and update IDB with the same object to avoid stale snapshots
    const current = Array.isArray(data[domain]) ? (data[domain] as DomainData[]) : []
    const newDataArray = [...current, optimisticEntry]
    const updated = { ...data, [domain]: newDataArray }

    setData(updated)

    // Update IDB cache immediately with the same object used to update state
    try {
      const snapshotKey = getDomainSnapshotKey()
      if (snapshotKey) {
        await idbSet(snapshotKey, updated)
      }
    } catch (err) {
      console.warn('Failed to update IDB cache:', err)
    }

    // Emit events
    emitDomainEvents(domain, newDataArray, 'add')

    // ✅ CRITICAL FIX: Check auth and save to database
    try {
      // Use the session state from the provider instead of calling getSession() again
      // This avoids issues with multiple Supabase client instances
      if (!session?.user) {
        console.error('❌ Not authenticated - cannot save data: No session')
        // Rollback optimistic update
  const rollbackData = current.filter(item => item.id !== entryId)
  setData(prev => ({ ...prev, [domain]: rollbackData }))
      const snapshotKey = getDomainSnapshotKey()
      if (snapshotKey) {
        const rollbackSnapshot = { ...data, [domain]: rollbackData }
        await idbSet(snapshotKey, rollbackSnapshot)
      }
        emitDomainEvents(domain, rollbackData, 'delete')

        // Show error to user
        if (typeof window !== 'undefined') {
          toast.error('Authentication Required', 'Please sign in to save your data. Your changes were not saved.')
        }
        return
      }

      console.log('✅ Authenticated - saving to database as user:', session.user.email)

      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return
      }

      const savedEntry = await createDomainEntryRecord(supabase, {
        id: entryId,
        domain,
        title: optimisticEntry.title,
        description: optimisticEntry.description,
        metadata: optimisticEntry.metadata,
      })

      console.log('✅ Successfully saved to database:', savedEntry.id)

      // Update with server response
  const finalData = newDataArray.map(item => (item.id === entryId ? savedEntry : item))
  setData(prev => ({ ...prev, [domain]: finalData }))
  const snapshotKey = getDomainSnapshotKey()
  if (snapshotKey) {
    const finalSnapshot = { ...data, [domain]: finalData }
    await idbSet(snapshotKey, finalSnapshot)
  }
      emitDomainEvents(domain, finalData, 'update')

      // Show success toast
      if (typeof window !== 'undefined') {
        const { toast } = await import('@/lib/utils/toast')
        toast.success('Saved', 'Your data has been saved successfully.')
      }

    } catch (error: any) {
      console.error('❌ Failed to persist domain entry:', error)
      // Rollback optimistic update
  const rollbackData = current.filter(item => item.id !== entryId)
  setData(prev => ({ ...prev, [domain]: rollbackData }))
  const snapshotKeyRollback = getDomainSnapshotKey()
  if (snapshotKeyRollback) {
    const rollbackSnapshot = { ...data, [domain]: rollbackData }
    await idbSet(snapshotKeyRollback, rollbackSnapshot)
  }
      emitDomainEvents(domain, rollbackData, 'delete')

      // Show user-friendly error
      if (typeof window !== 'undefined') {
        toast.error('Failed to Save', `Could not save your data: ${error.message || 'Unknown error'}. Please try again or contact support.`)
      }
    }
  }, [data, emitDomainEvents, supabase])

  const updateData = useCallback(async (domain: Domain, id: string, updates: Partial<DomainData>) => {
    const previousDomainData = Array.isArray(data[domain]) ? data[domain] as DomainData[] : []
    const previousItem = previousDomainData.find(item => item.id === id)
    if (!previousItem) {
      console.warn(`⚠️ Attempted to update ${domain} item ${id}, but it does not exist locally.`)
      return
    }

    console.log(`✏️ Updating ${domain} entry:`, id)

    const now = new Date().toISOString()
    const mergedMetadata = updates.metadata
      ? { ...previousItem.metadata, ...(updates.metadata as Record<string, unknown>) }
      : previousItem.metadata

    // Optimistically update UI
    const newDataArray = previousDomainData.map(item =>
      item.id === id
        ? {
            ...item,
            ...updates,
            metadata: mergedMetadata,
            updatedAt: now,
          }
        : item
    )

    setData(prev => {
      return { ...prev, [domain]: newDataArray }
    })

    // Update IDB cache immediately
    try {
      const snapshotKey = getDomainSnapshotKey()
      if (snapshotKey) {
        const snapshot = { ...data, [domain]: newDataArray }
        await idbSet(snapshotKey, snapshot)
      }
    } catch (err) {
      console.warn('Failed to update IDB cache:', err)
    }

    // Emit events
    emitDomainEvents(domain, newDataArray, 'update')

    // ✅ CRITICAL FIX: Check auth and save to database
    try {
      // Use the session state from the provider instead of calling getSession() again
      if (!session?.user) {
        console.error('❌ Not authenticated - cannot update data: No session')
  // Rollback
  setData(prev => ({ ...prev, [domain]: previousDomainData }))
  const snapshotKey = getDomainSnapshotKey()
  if (snapshotKey) {
    const rollbackSnapshot = { ...data, [domain]: previousDomainData }
    await idbSet(snapshotKey, rollbackSnapshot)
  }
  emitDomainEvents(domain, previousDomainData, 'update')

        if (typeof window !== 'undefined') {
          toast.error('Authentication Required', 'Please sign in to save your changes.')
        }
        return
      }

      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return
      }

      const updatedEntry = await updateDomainEntryRecord(supabase, {
        id,
        title: updates.title,
        description: updates.description,
        metadata: mergedMetadata,
        domain: updates.domain,
      })

      console.log('✅ Successfully updated in database:', id)

      // Update with server response
  const finalDataArray = newDataArray.map(item => (item.id === id ? updatedEntry : item))
  setData(prev => ({ ...prev, [domain]: finalDataArray }))
  const finalSnapshotKey = getDomainSnapshotKey()
  if (finalSnapshotKey) {
    const finalSnapshot = { ...data, [domain]: finalDataArray }
    await idbSet(finalSnapshotKey, finalSnapshot)
  }
  emitDomainEvents(domain, finalDataArray, 'update')

    } catch (error: any) {
      console.error('❌ Update error:', error)
  // Rollback
  setData(prev => ({ ...prev, [domain]: previousDomainData }))
  const rollbackSnapshotKey = getDomainSnapshotKey()
  if (rollbackSnapshotKey) {
    const rollbackSnapshot = { ...data, [domain]: previousDomainData }
    await idbSet(rollbackSnapshotKey, rollbackSnapshot)
  }
  emitDomainEvents(domain, previousDomainData, 'update')

      if (typeof window !== 'undefined') {
        const { toast } = await import('@/lib/utils/toast')
        toast.error('Failed to Update', `Could not save changes: ${error.message || 'Unknown error'}`)
      }
    }
  }, [data, emitDomainEvents, supabase])

  const deleteData = useCallback(async (domain: Domain, id: string) => {
    const previousDomainData = Array.isArray(data[domain]) ? (data[domain] as DomainData[]) : []
    const removedEntry = previousDomainData.find(item => item.id === id)
    if (!removedEntry) {
      console.warn(`⚠️ Attempted to delete ${domain} item ${id}, but it does not exist locally.`)
      return
    }

    console.log(`🗑️ Deleting ${domain} entry:`, id)

    // Optimistically remove from UI IMMEDIATELY
    const newData = previousDomainData.filter(item => item.id !== id)
    setData(prev => {
      const updated = { ...prev, [domain]: newData }
      return updated
    })

    // Update IDB cache immediately for offline support
    try {
      const snapshotKey = getDomainSnapshotKey()
      if (snapshotKey) {
        const snapshot = { ...data, [domain]: newData }
        await idbSet(snapshotKey, snapshot)
      }
    } catch (err) {
      console.warn('Failed to update IDB cache:', err)
    }

    // Emit events for other components
    emitDomainEvents(domain, newData, 'delete')

    // ✅ CRITICAL FIX: Check auth and delete from database
    try {
      // Use the session state from the provider instead of calling getSession() again
      if (!session?.user) {
        console.error('❌ Not authenticated - cannot delete data: No session')
        // Rollback
  setData(prev => ({ ...prev, [domain]: previousDomainData }))
  const rollbackSnapshotKey = getDomainSnapshotKey()
  if (rollbackSnapshotKey) {
    const rollbackSnapshot = { ...data, [domain]: previousDomainData }
    await idbSet(rollbackSnapshotKey, rollbackSnapshot)
  }
  emitDomainEvents(domain, previousDomainData, 'update')

        if (typeof window !== 'undefined') {
          toast.error('Authentication Required', 'Please sign in to delete data.')
        }
        return
      }

      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        return
      }

      await deleteDomainEntryRecord(supabase, id)
      console.log('✅ Successfully deleted from database:', id)

      // Show success message
      if (typeof window !== 'undefined') {
        const { toast } = await import('@/lib/utils/toast')
        toast.success('Deleted', 'Item removed successfully')
      }

    } catch (error: any) {
      console.error('❌ Delete error:', error)
  // Rollback
  setData(prev => ({ ...prev, [domain]: previousDomainData }))
  const deleteRollbackKey = getDomainSnapshotKey()
  if (deleteRollbackKey) {
    const rollbackSnapshot = { ...data, [domain]: previousDomainData }
    await idbSet(deleteRollbackKey, rollbackSnapshot)
  }
  emitDomainEvents(domain, previousDomainData, 'update')

      if (typeof window !== 'undefined') {
        const { toast } = await import('@/lib/utils/toast')
        toast.error('Failed to Delete', `Could not delete item: ${error.message || 'Unknown error'}`)
      }
    }
  }, [data, emitDomainEvents, supabase])

  const getData = useCallback((domain: Domain) => {
    const domainData = data[domain]
    if (!domainData) return []
    // Normalize both flat arrays and { items: [...] } structures to a simple array
    if (Array.isArray(domainData)) return domainData
    if (domainData && Array.isArray((domainData as any).items)) return (domainData as any).items
    return []
  }, [data])

  // Task management
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    
    // Optimistically update UI
    setTasks(prev => [...prev, newTask])

    // Persist to Supabase
    try {
      // Use the session state from the provider
      if (session?.user && supabase) {
        const personId = await getActivePersonId()
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            id: newTask.id,
            user_id: session.user.id,
            person_id: personId,
            title: newTask.title,
            description: newTask.description || null,
            completed: newTask.completed,
            priority: newTask.priority,
            due_date: newTask.dueDate || null,
            metadata: { category: newTask.category || null },
            created_at: newTask.createdAt,
          })
          .select()
        
        if (error) {
          console.error('❌ Task insert error:', error)
          alert(`Failed to save task: ${error.message}`)
          // Revert optimistic update
          setTasks(prev => prev.filter(t => t.id !== newTask.id))
        } else {
          console.log('✅ Task saved to database:', newTask.title)
        }
      }
    } catch (e: any) {
      console.error('❌ Failed to persist task:', e)
      alert(`Failed to save task: ${e.message || 'Unknown error'}`)
      // Revert optimistic update
      setTasks(prev => prev.filter(t => t.id !== newTask.id))
    }
  }, [supabase])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Optimistically update UI
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task))

    // Persist to Supabase
    if (!supabase) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const dbUpdates: any = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
        if (updates.category !== undefined) dbUpdates.category = updates.category

        await supabase
          .from('tasks')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', session.user.id)
        console.log('✅ Task updated in database')
      }
    } catch (e) {
      console.error('❌ Failed to update task:', e)
    }
  }, [supabase])

  const deleteTask = useCallback(async (id: string) => {
    // Optimistically update UI
    setTasks(prev => prev.filter(task => task.id !== id))

    // Persist to Supabase
    try {
      // Use the session state from the provider
      if (session?.user && supabase) {
        await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id)
        console.log('✅ Task deleted from database')
      }
    } catch (e) {
      console.error('❌ Failed to delete task:', e)
    }
  }, [supabase])

  // Habit management
  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    console.log('🔵 addHabit called with:', habit)
    
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    
    console.log('🔵 Created newHabit:', newHabit)
    
    // Optimistically update UI
    setHabits(prev => {
      console.log('🔵 Updating habits in state, old count:', prev.length)
      const updated = [...prev, newHabit]
      console.log('🔵 New habits count:', updated.length)
      return updated
    })

    // Persist to Supabase
    console.log('🔵 Starting Supabase save...')
    try {
      // Use the session state from the provider
      const user = session?.user
      console.log('🔵 User check result:', { user: user?.id })
      
      if (!user) {
        console.error('❌ No user found! Cannot save habit.')
        alert('You must be logged in to save habits!')
        return
      }

      console.log('🔵 Attempting to insert habit into database...')
      if (!supabase) {
        console.error('❌ Supabase not initialized')
        return
      }
      const personId = await getActivePersonId()
      const { data: insertedData, error: insertError } = await supabase
        .from('habits')
        .insert({
          id: newHabit.id,
          user_id: user.id,
          person_id: personId,
          name: newHabit.name,
          icon: newHabit.icon,
          frequency: newHabit.frequency,
          streak: newHabit.streak || 0,
          completion_history: [],
          created_at: newHabit.createdAt,
        })
        .select()
        
      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        alert(`Failed to save habit: ${insertError.message}`)
      } else {
        console.log('✅ Habit saved to database successfully!', insertedData)
      }
    } catch (e: any) {
      console.error('❌ Exception in addHabit:', e)
      alert(`Error saving habit: ${e.message}`)
    }
  }, [supabase])

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    // Optimistically update UI
    setHabits(prev => prev.map(habit => habit.id === id ? { ...habit, ...updates } : habit))

    // Persist to Supabase
    if (!supabase) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const dbUpdates: any = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
        if (updates.streak !== undefined) dbUpdates.streak = updates.streak

        await supabase
          .from('habits')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', session.user.id)
        console.log('✅ Habit updated in database')
      }
    } catch (e) {
      console.error('❌ Failed to update habit:', e)
    }
  }, [supabase])

  const deleteHabit = useCallback(async (id: string) => {
    // Optimistically update UI
    setHabits(prev => prev.filter(habit => habit.id !== id))

    // Persist to Supabase
    try {
      // Use the session state from the provider
      if (session?.user && supabase) {
        await supabase
          .from('habits')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id)
        console.log('✅ Habit deleted from database')
      }
    } catch (e) {
      console.error('❌ Failed to delete habit:', e)
    }
  }, [supabase])

  const toggleHabit = useCallback(async (id: string) => {
    console.log('🟢 toggleHabit called for id:', id)
    try {
      // Use the session state from the provider
      const user = session?.user
      console.log('🟢 User check:', { user: user?.id })
      
      if (!user) {
        console.error('❌ No user found for toggle!')
        alert('You must be logged in to check off habits!')
        return
      }

      // Get current habit from database
      console.log('🟢 Fetching habit from database...')
      if (!supabase) {
        console.error('❌ Supabase not initialized')
        return
      }
      const { data: habitData, error: fetchError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      console.log('🟢 Habit data from DB:', habitData, 'Error:', fetchError)

      if (fetchError || !habitData) {
        console.error('❌ Failed to fetch habit:', fetchError)
        alert('Habit not found in database! Try refreshing the page.')
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const history = habitData.completion_history || []
      
      console.log('🟢 Today:', today, 'Current history:', history)
      
      // Toggle today's completion
      const wasCompleted = history.includes(today)
      const updatedHistory = wasCompleted
        ? history.filter((date: string) => date !== today)
        : [...history, today]

      console.log('🟢 Was completed?', wasCompleted, 'Updated history:', updatedHistory)

      // Calculate streak
      const sortedHistory = [...updatedHistory].sort().reverse()
      let streak = 0
      const currentDate = new Date()
      
      for (const date of sortedHistory) {
        const historyDate = new Date(date)
        const diffDays = Math.floor((currentDate.getTime() - historyDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === streak) {
          streak++
        } else {
          break
        }
      }

      console.log('🟢 Calculated streak:', streak)

      // Update in database
      console.log('🟢 Updating database...')
      const { error: updateError } = await supabase
        .from('habits')
        .update({
          completion_history: updatedHistory,
          streak: streak,
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('❌ Failed to update habit in database:', updateError)
        alert(`Failed to update: ${updateError.message}`)
        return
      }

      console.log('🟢 Database updated! Updating local state...')

      // Update local state
      setHabits(prev => prev.map(habit => {
        if (habit.id === id) {
          const frequency = habit.frequency
          
          // Recalculate completion status based on frequency
          let isCompletedForPeriod = false
          if (frequency === 'daily') {
            isCompletedForPeriod = updatedHistory.includes(today)
          } else if (frequency === 'weekly') {
            const todayDate = new Date()
            const weekStart = new Date(todayDate)
            weekStart.setDate(todayDate.getDate() - todayDate.getDay() + 1)
            const weekStartStr = weekStart.toISOString().split('T')[0]
            isCompletedForPeriod = updatedHistory.some((date: string) => date >= weekStartStr && date <= today)
          } else if (frequency === 'monthly') {
            const thisMonth = today.substring(0, 7)
            isCompletedForPeriod = updatedHistory.some((date: string) => date.startsWith(thisMonth))
          }
          
          console.log('🟢 New completed status:', isCompletedForPeriod)
          
          return {
            ...habit,
            completed: isCompletedForPeriod,
            streak: streak,
            lastCompleted: updatedHistory.length > 0 
              ? new Date(updatedHistory[updatedHistory.length - 1]).toISOString() 
              : undefined,
          }
        }
        return habit
      }))

      console.log('✅ Habit toggled successfully!')
    } catch (error: any) {
      console.error('❌ Exception in toggleHabit:', error)
      alert(`Error: ${error.message}`)
    }
  }, [supabase])

  // Bill management
  const addBill = useCallback(async (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setBills(prev => [...prev, newBill])
    
    try {
      // Use the session state from the provider
      if (!session?.user) {
        console.warn('⚠️ Cannot persist bill - no authenticated user')
        return
      }

      if (!supabase) {
        console.error('❌ Supabase not initialized')
        return
      }
      const personId = await getActivePersonId()
      const { error } = await supabase
        .from('bills')
        .insert({
          id: newBill.id,
          user_id: session.user.id,
          person_id: personId,
          title: newBill.title,
          amount: newBill.amount,
          due_date: newBill.dueDate,
          category: newBill.category,
          status: newBill.status,
          recurring: newBill.recurring,
          created_at: newBill.createdAt,
        })

      if (error) {
        console.error('❌ Failed to save bill:', error)
        alert(`Failed to save bill: ${error.message}`)
      } else {
        console.log('✅ Bill saved to Supabase')
      }
    } catch (e: any) {
      console.error('❌ Exception saving bill:', e)
      alert(`Failed to save bill: ${e.message}`)
    }
  }, [supabase])

  const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
    setBills(prev => prev.map(bill => bill.id === id ? { ...bill, ...updates } : bill))

    try {
      // Use the session state from the provider
      if (!session?.user) {
        console.warn('⚠️ Cannot update bill - no authenticated user')
        return
      }

      const payload: Record<string, any> = {
        title: updates.title,
        amount: updates.amount,
        due_date: updates.dueDate,
        category: updates.category,
        status: updates.status,
        recurring: updates.recurring,
        updated_at: new Date().toISOString(),
      }

      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key]
        }
      })

      if (Object.keys(payload).length === 0) {
        return
      }

      if (!supabase) {
        console.error('❌ Supabase not initialized')
        return
      }

      const { error } = await supabase
        .from('bills')
        .update(payload)
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('❌ Failed to update bill:', error)
        alert(`Failed to update bill: ${error.message}`)
      } else {
        console.log('✅ Bill updated in Supabase')
      }
    } catch (e: any) {
      console.error('❌ Exception updating bill:', e)
      alert(`Failed to update bill: ${e.message}`)
    }
  }, [supabase])

  const deleteBill = useCallback(async (id: string) => {
    setBills(prev => prev.filter(bill => bill.id !== id))

    try {
      // Use the session state from the provider
      if (!session?.user || !supabase) {
        console.warn('⚠️ Cannot delete bill - no authenticated user or supabase not initialized')
        return
      }

      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('❌ Failed to delete bill:', error)
        alert(`Failed to delete bill: ${error.message}`)
      } else {
        console.log('✅ Bill deleted from Supabase')
      }
    } catch (e: any) {
      console.error('❌ Exception deleting bill:', e)
      alert(`Failed to delete bill: ${e.message}`)
    }
  }, [supabase])

  // Document management
  const addDocument = useCallback((doc: Omit<Document, 'id' | 'createdAt'>) => {
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setDocuments(prev => [...prev, newDoc])
  }, [])

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc))
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }, [])

  // Event management
  const addEvent = useCallback((event: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setEvents(prev => [...prev, newEvent])
  }, [])

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event => event.id === id ? { ...event, ...updates } : event))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id))
  }, [])

  return (
    <DataContext.Provider value={{ 
      data, 
      tasks,
      habits,
      bills,
      documents,
      events,
      isLoading,
      isLoaded,
      addData, 
      updateData, 
      deleteData, 
      getData,
      reloadDomain,
      addTask,
      updateTask,
      deleteTask,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabit,
      addBill,
      updateBill,
      deleteBill,
      addDocument,
      updateDocument,
      deleteDocument,
      addEvent,
      updateEvent,
      deleteEvent,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
