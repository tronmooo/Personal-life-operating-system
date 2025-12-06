import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Treat obviously placeholder values as "not configured"
const looksPlaceholder = (value: string) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return (
    lower.includes('your-project-id') ||
    lower.includes('your-anon-key') ||
    lower.includes('placeholder') ||
    lower.includes('dummy')
  )
}

// Warn if credentials are missing or look like placeholders (allow local-only mode)
if (!supabaseUrl || !supabaseAnonKey || looksPlaceholder(supabaseUrl) || looksPlaceholder(supabaseAnonKey)) {
  console.warn('⚠️ Supabase credentials not found. Running in local-only mode.')
  console.warn('To enable cloud sync, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

// Create Supabase client
export const supabase = (supabaseUrl && supabaseAnonKey && !looksPlaceholder(supabaseUrl) && !looksPlaceholder(supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && !looksPlaceholder(supabaseUrl) && !looksPlaceholder(supabaseAnonKey) && supabase)
}

// Get current user session
export const getCurrentUser = async () => {
  if (!supabase) return null
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

// Get current session
export const getSession = async () => {
  if (!supabase) return null
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Error in getSession:', error)
    return null
  }
}

// Sign in with email/password
export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

// Sign up with email/password
export const signUp = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

// Sign out
export const signOut = async () => {
  if (!supabase) return
  
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  
  return supabase.auth.onAuthStateChange(callback)
}
