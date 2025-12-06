'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

export interface Person {
  id: string
  name: string
  relationship: string
  isActive: boolean
  initial: string
}

interface ActivePersonContextType {
  activePerson: Person | null
  activePersonId: string
  people: Person[]
  isLoading: boolean
  switchPerson: (personId: string) => Promise<void>
  refreshPeople: () => Promise<void>
}

const ActivePersonContext = createContext<ActivePersonContextType | undefined>(undefined)

// Default person for new users
const DEFAULT_PERSON: Person = {
  id: 'me',
  name: 'Me',
  relationship: 'You',
  isActive: true,
  initial: 'M'
}

export function ActivePersonProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([DEFAULT_PERSON])
  const [activePerson, setActivePerson] = useState<Person | null>(DEFAULT_PERSON)
  const [isLoading, setIsLoading] = useState(true)

  // Compute active person ID (default to 'me')
  const activePersonId = activePerson?.id || 'me'

  // Load people from user settings
  const refreshPeople = useCallback(async () => {
    try {
      setIsLoading(true)
      const settings = await getUserSettings()
      const loadedPeople: Person[] = settings?.people || []
      
      if (loadedPeople.length > 0) {
        setPeople(loadedPeople)
        const active = loadedPeople.find(p => p.isActive) || loadedPeople[0]
        setActivePerson(active)
      } else {
        // Initialize with default person
        setPeople([DEFAULT_PERSON])
        setActivePerson(DEFAULT_PERSON)
        await updateUserSettings({ 
          people: [DEFAULT_PERSON], 
          activePersonId: 'me' 
        })
      }
    } catch (error) {
      console.error('Failed to load people:', error)
      // Fallback to default
      setPeople([DEFAULT_PERSON])
      setActivePerson(DEFAULT_PERSON)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Switch active person
  const switchPerson = useCallback(async (personId: string) => {
    try {
      const updatedPeople = people.map(p => ({
        ...p,
        isActive: p.id === personId
      }))
      
      // Update state optimistically
      setPeople(updatedPeople)
      const newActivePerson = updatedPeople.find(p => p.id === personId) || null
      setActivePerson(newActivePerson)
      
      // Persist to settings
      await updateUserSettings({ 
        people: updatedPeople, 
        activePersonId: personId 
      })
      
      // Dispatch event so other components can react
      window.dispatchEvent(new CustomEvent('person-changed', { 
        detail: { personId, person: newActivePerson } 
      }))
      
      // Also dispatch profile-changed for backward compatibility
      window.dispatchEvent(new Event('profile-changed'))
    } catch (error) {
      console.error('Failed to switch person:', error)
      // Revert on error
      await refreshPeople()
    }
  }, [people, refreshPeople])

  // Initial load
  useEffect(() => {
    refreshPeople()
  }, [refreshPeople])

  // Listen for profile changes from other components
  useEffect(() => {
    const handleProfileChange = () => {
      refreshPeople()
    }
    
    window.addEventListener('profile-changed', handleProfileChange)
    return () => window.removeEventListener('profile-changed', handleProfileChange)
  }, [refreshPeople])

  return (
    <ActivePersonContext.Provider
      value={{
        activePerson,
        activePersonId,
        people,
        isLoading,
        switchPerson,
        refreshPeople
      }}
    >
      {children}
    </ActivePersonContext.Provider>
  )
}

export function useActivePerson() {
  const context = useContext(ActivePersonContext)
  if (!context) {
    throw new Error('useActivePerson must be used within ActivePersonProvider')
  }
  return context
}

// Export a hook that can safely be used outside the provider (returns default values)
export function useActivePersonId(): string {
  const context = useContext(ActivePersonContext)
  return context?.activePersonId || 'me'
}





