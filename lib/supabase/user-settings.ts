'use client'

import { createClientComponentClient } from '@/lib/supabase/browser-client'

type Settings = Record<string, any>

export async function getUserSettings(): Promise<Settings> {
  const supabase = createClientComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .single()
  return (data?.settings as Settings) || {}
}

export async function updateUserSettings(partial: Settings): Promise<void> {
  const supabase = createClientComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Silently skip if not authenticated (e.g. on sign-in page)
    return
  }

  // Fetch current settings, shallow merge, upsert
  const { data: existing } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .single()

  const merged = { ...(existing?.settings || {}), ...partial }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { 
        user_id: user.id, 
        settings: merged, 
        updated_at: new Date().toISOString() 
      },
      { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      }
    )

  if (error) {
    console.error('Failed to update user settings:', error)
    throw error
  }
}












