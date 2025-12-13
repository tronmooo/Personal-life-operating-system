import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for Server Components and Route Handlers
 * Uses the @supabase/ssr package for proper Next.js 14 compatibility
 */
export const createServerClient = async () => {
  // In Next.js 14.x, cookies() returns a Promise and must be awaited
  const cookieStore = await cookies()
  
  // #region agent log
  console.log('🔐 [SUPABASE/SERVER] createServerClient called, cookies available:', !!cookieStore)
  // #endregion
  
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          // #region agent log
          console.log('🔐 [SUPABASE/SERVER] getAll cookies count:', allCookies.length, 'names:', allCookies.map(c => c.name).join(', '))
          // #endregion
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for Route Handlers (same as createServerClient but explicit naming)
 */
export const createRouteClient = createServerClient

// Detect placeholder/dummy values
const looksLikePlaceholder = (value: string) => {
  const lower = value.toLowerCase()
  return (
    lower.includes('placeholder') ||
    lower.includes('your-project') ||
    lower.includes('dummy') ||
    lower.includes('example')
  )
}

// Lazy-initialized admin client to prevent build-time errors
let _supabaseAdmin: SupabaseClient | null = null

// Get the admin client (lazy initialization)
export const getSupabaseAdmin = (): SupabaseClient => {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Fail if environment variables are missing at runtime
  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required but not set. ' +
      'Please configure your environment variables.'
    )
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required but not set. ' +
      'Please configure your environment variables.'
    )
  }

  if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseServiceKey)) {
    throw new Error(
      'Supabase credentials appear to be placeholder values. ' +
      'Please configure real credentials in your environment variables.'
    )
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return _supabaseAdmin
}

// For backward compatibility - lazy getter
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient]
  }
})
