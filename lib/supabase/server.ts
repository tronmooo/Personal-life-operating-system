import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side client for Server Components
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

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
