'use client'

/**
 * Safe browser client wrapper that mimics createClientComponentClient
 * but doesn't throw during static build time when env vars aren't available
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _browserClient: SupabaseClient | null = null
let _initializationAttempted = false

/**
 * Creates a browser client for Supabase that handles missing env vars gracefully.
 * Returns a valid client when env vars are set, or throws only at runtime when actually used.
 */
export function createClientComponentClient(): SupabaseClient {
  // Return cached client if exists
  if (_browserClient) {
    return _browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not set, return a dummy client that throws on use
  // This allows the module to load during build, but will fail at runtime if used
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!_initializationAttempted) {
      _initializationAttempted = true
      console.warn('⚠️ Supabase credentials not found. Client operations will fail.')
    }
    
    // Return a proxy that throws helpful errors when actually used
    return createDummyClient() as unknown as SupabaseClient
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
    return createDummyClient() as unknown as SupabaseClient
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

// Helper to create a proxy that throws on any method call
function createDummyClient() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      // Return functions for method calls
      if (typeof prop === 'string') {
        // Special handling for auth object
        if (prop === 'auth') {
          return new Proxy({}, {
            get(_t, authProp) {
              return () => {
                console.warn(`⚠️ Supabase auth.${String(authProp)} called but client not configured`)
                return Promise.resolve({ data: { session: null, user: null }, error: null })
              }
            }
          })
        }
        // Return a dummy function for other methods
        return () => {
          console.warn(`⚠️ Supabase ${prop} called but client not configured`)
          return { data: null, error: { message: 'Supabase not configured' } }
        }
      }
      return undefined
    }
  }
  return new Proxy({}, handler)
}

// Re-export for convenience
export { createClientComponentClient as createBrowserClient }

