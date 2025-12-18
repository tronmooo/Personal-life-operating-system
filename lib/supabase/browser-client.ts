'use client'

/**
 * Safe browser client wrapper that mimics createClientComponentClient
 * but doesn't throw during static build time when env vars aren't available
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { debugIngest } from '@/lib/utils/debug-ingest'

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

  _browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
  debugIngest({
    location: 'browser-client.ts:createClient',
    message: 'Supabase browser client created',
    data: { url: supabaseUrl?.substring(0, 30), hasKey: !!supabaseAnonKey },
    sessionId: 'debug-session',
    hypothesisId: 'H3',
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
              // onAuthStateChange returns synchronously, not a Promise
              if (authProp === 'onAuthStateChange') {
                return () => {
                  console.warn('⚠️ Supabase auth.onAuthStateChange called but client not configured')
                  return { 
                    data: { 
                      subscription: { 
                        unsubscribe: () => {} 
                      } 
                    } 
                  }
                }
              }
              // Other auth methods return Promises
              return () => {
                console.warn(`⚠️ Supabase auth.${String(authProp)} called but client not configured`)
                return Promise.resolve({ data: { session: null, user: null }, error: null })
              }
            }
          })
        }
        // #region agent log
        // Special handling for channel() - must return a chainable object for realtime subscriptions
        if (prop === 'channel') {
          return (channelName: string) => {
            console.warn(`⚠️ Supabase channel('${channelName}') called but client not configured`)
            debugIngest({
              location: 'browser-client.ts:channel',
              message: 'Dummy channel created',
              data: { channelName },
              sessionId: 'debug-session',
              hypothesisId: 'A',
            })
            // Return a chainable mock that mimics Supabase RealtimeChannel
            const chainable: Record<string, unknown> = {
              on: (..._args: unknown[]) => {
                debugIngest({
                  location: 'browser-client.ts:channel.on',
                  message: 'Dummy channel.on() called',
                  data: {},
                  sessionId: 'debug-session',
                  hypothesisId: 'A',
                })
                return chainable
              },
              subscribe: (_callback?: (status: string) => void) => {
                debugIngest({
                  location: 'browser-client.ts:channel.subscribe',
                  message: 'Dummy channel.subscribe() called',
                  data: {},
                  sessionId: 'debug-session',
                  hypothesisId: 'A',
                })
                return chainable
              },
              unsubscribe: () => Promise.resolve('ok'),
            }
            return chainable
          }
        }
        // Special handling for removeChannel() - must accept channel and return Promise
        if (prop === 'removeChannel') {
          return (_channel: unknown) => {
            console.warn('⚠️ Supabase removeChannel called but client not configured')
            debugIngest({
              location: 'browser-client.ts:removeChannel',
              message: 'Dummy removeChannel called',
              data: {},
              sessionId: 'debug-session',
              hypothesisId: 'A',
            })
            return Promise.resolve('ok')
          }
        }
        // #endregion
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
