'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Safe client that doesn't throw at module load time
let _browserClient: SupabaseClient | null = null

export function createSafeBrowserClient(): SupabaseClient | null {
  // Return cached client if exists
  if (_browserClient) {
    return _browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not set, return null (for build time)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found during client creation')
    return null
  }

  // Check for placeholder values
  const looksPlaceholder = (value: string) => {
    const lower = value.toLowerCase()
    return (
      lower.includes('your-project') ||
      lower.includes('placeholder') ||
      lower.includes('dummy') ||
      lower.includes('example')
    )
  }

  if (looksPlaceholder(supabaseUrl) || looksPlaceholder(supabaseAnonKey)) {
    console.warn('⚠️ Supabase credentials appear to be placeholder values')
    return null
  }

  _browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return _browserClient
}

// Export a function to get the client (will return null if not configured)
export function getSafeBrowserClient(): SupabaseClient | null {
  return createSafeBrowserClient()
}





