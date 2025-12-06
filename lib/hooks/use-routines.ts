'use client'

import { useDomainEntries } from './use-domain-entries'
import { Routine } from '@/lib/goals'

/**
 * Hook to manage routines using Supabase domain_entries
 * Replaces RoutineManager localStorage usage
 * Uses 'mindfulness' domain to store routine data
 */
export function useRoutines() {
  const { entries, createEntry, updateEntry, deleteEntry, isLoading, error } = useDomainEntries('mindfulness')

  // Convert domain entries to Routine format (filter for routine items only)
  const routines: Routine[] = entries
    .filter((entry: any) => entry.metadata?.itemType === 'routine')
    .map((entry: any) => ({
      id: entry.id,
      name: entry.title,
      description: entry.description || '',
      timeOfDay: (entry.metadata?.timeOfDay || 'anytime') as 'morning' | 'evening' | 'anytime',
      days: entry.metadata?.days || [],
      estimatedDuration: entry.metadata?.estimatedDuration || 30,
      completionCount: entry.metadata?.completionCount || 0,
      steps: entry.metadata?.steps || [],
      enabled: entry.metadata?.enabled ?? true,
      type: entry.metadata?.type || 'custom'
    }))

  const addRoutine = async (routine: Omit<Routine, 'id' | 'completionCount'>) => {
    return createEntry({
      title: routine.name,
      domain: 'mindfulness',
      description: routine.description || '',
      metadata: {
        itemType: 'routine',
        timeOfDay: routine.timeOfDay,
        days: routine.days,
        estimatedDuration: routine.estimatedDuration,
        completionCount: 0,
        steps: routine.steps,
        enabled: routine.enabled ?? true,
        type: routine.type || 'custom'
      } as any
    })
  }

  const completeRoutine = async (id: string) => {
    const routine = routines.find(r => r.id === id)
    if (!routine) return

    const entry: any = entries.find((e: any) => e.id === id)
    if (!entry) return

    return updateEntry({
      id,
      metadata: {
        ...entry.metadata,
        completionCount: (routine.completionCount || 0) + 1
      } as any
    })
  }

  const deleteRoutine = async (id: string) => {
    return deleteEntry(id)
  }

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    const routine = routines.find(r => r.id === id)
    if (!routine) return

    const entry: any = entries.find((e: any) => e.id === id)
    if (!entry) return

    return updateEntry({
      id,
      title: updates.name || routine.name,
      description: updates.description ?? routine.description,
      metadata: {
        ...entry.metadata,
        timeOfDay: updates.timeOfDay ?? routine.timeOfDay,
        days: updates.days ?? routine.days,
        estimatedDuration: updates.estimatedDuration ?? routine.estimatedDuration,
        completionCount: updates.completionCount ?? routine.completionCount,
        steps: updates.steps ?? routine.steps,
        enabled: updates.enabled ?? routine.enabled,
        type: updates.type ?? routine.type
      } as any
    })
  }

  return {
    routines,
    loading: isLoading,
    error,
    addRoutine,
    completeRoutine,
    deleteRoutine,
    updateRoutine
  }
}
