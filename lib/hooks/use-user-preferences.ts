/**
 * React hook for managing user preferences in Supabase
 * Replaces localStorage-based preference management
 */

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export function useUserPreferences<T = any>(preferenceKey: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  // Load preference from Supabase
  const loadPreference = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setValue(defaultValue)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user.id)
        .eq('preference_key', preferenceKey)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data) {
        setValue(data.preference_value as T)
      } else {
        setValue(defaultValue)
      }
    } catch (err) {
      console.error(`Error loading preference ${preferenceKey}:`, err)
      setError(err as Error)
      setValue(defaultValue)
    } finally {
      setLoading(false)
    }
  }, [supabase, preferenceKey, defaultValue])

  // Save preference to Supabase
  const savePreference = useCallback(async (newValue: T) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_key: preferenceKey,
          preference_value: newValue as any,
        }, {
          onConflict: 'user_id,preference_key'
        })

      if (upsertError) throw upsertError

      setValue(newValue)
      return true
    } catch (err) {
      console.error(`Error saving preference ${preferenceKey}:`, err)
      setError(err as Error)
      return false
    }
  }, [supabase, preferenceKey])

  // Delete preference from Supabase
  const deletePreference = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('preference_key', preferenceKey)

      if (deleteError) throw deleteError

      setValue(defaultValue)
      return true
    } catch (err) {
      console.error(`Error deleting preference ${preferenceKey}:`, err)
      setError(err as Error)
      return false
    }
  }, [supabase, preferenceKey, defaultValue])

  // Load on mount and when preferenceKey changes
  useEffect(() => {
    loadPreference()
  }, [loadPreference])

  return {
    value,
    loading,
    error,
    setValue: savePreference,
    deleteValue: deletePreference,
    reload: loadPreference
  }
}

/**
 * Hook for managing multiple preferences at once
 */
export function useUserPreferencesMultiple<T = Record<string, any>>(preferenceKeys: string[]) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('preference_key, preference_value')
        .eq('user_id', user.id)
        .in('preference_key', preferenceKeys)

      if (fetchError) throw fetchError

      const prefsMap: Record<string, any> = {}
      if (data) {
        data.forEach(pref => {
          prefsMap[pref.preference_key] = pref.preference_value
        })
      }

      setValues(prefsMap)
    } catch (err) {
      console.error('Error loading preferences:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [supabase, preferenceKeys])

  const savePreference = useCallback(async (key: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_key: key,
          preference_value: value,
        }, {
          onConflict: 'user_id,preference_key'
        })

      if (upsertError) throw upsertError

      setValues(prev => ({ ...prev, [key]: value }))
      return true
    } catch (err) {
      console.error(`Error saving preference ${key}:`, err)
      setError(err as Error)
      return false
    }
  }, [supabase])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    values,
    loading,
    error,
    savePreference,
    reload: loadPreferences
  }
}









