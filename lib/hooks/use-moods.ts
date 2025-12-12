import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface MoodEntry {
  id: string
  logged_at: string
  score: number
  note?: string
  tags?: string[]
}

export function useMoods() {
  const supabase = createClientComponentClient()
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMoods([])
        return
      }
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
      if (error) throw error
      setMoods(
        (data || []).map((m: any) => ({
          id: m.id,
          logged_at: m.logged_at,
          score: m.score,
          note: m.note || undefined,
          tags: Array.isArray(m.tags) ? m.tags : [],
        }))
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to load moods:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to load moods')
      setMoods([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(async (entry: Omit<MoodEntry, 'id'>) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('moods')
        .insert({
          user_id: user.id,
          logged_at: entry.logged_at,
          score: entry.score,
          note: entry.note || null,
          tags: entry.tags || [],
        })
        .select('*')
        .single()
      if (error) throw error
      const newMood: MoodEntry = {
        id: data.id,
        logged_at: data.logged_at,
        score: data.score,
        note: data.note || undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
      }
      setMoods(prev => [newMood, ...prev])
      return newMood
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to add mood:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to add mood')
      throw err
    }
  }, [supabase])

  const remove = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error } = await supabase.from('moods').delete().eq('id', id)
      if (error) throw error
      setMoods(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to delete mood:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(errorMessage || 'Failed to delete mood')
      throw err
    }
  }, [supabase])

  return { moods, loading, error, reload: load, add, remove }
}









