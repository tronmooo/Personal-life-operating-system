import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Server-side client for Server Components
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Validate required environment variables for admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Fail fast if environment variables are missing
// This prevents silent failures against non-existent endpoints
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

if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseServiceKey)) {
  throw new Error(
    'Supabase credentials appear to be placeholder values. ' +
    'Please configure real credentials in your environment variables.'
  )
}

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

