'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, SupabaseClient, Session } from '@supabase/supabase-js'
import { createSafeBrowserClient } from './safe-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Store Google OAuth tokens to user_settings via API
 * This ensures Calendar, Drive, and Gmail integrations work
 */
async function storeGoogleTokens(session: Session | null) {
  if (!session?.provider_token) {
    console.log('🔑 No provider_token in session - skipping token storage')
    return
  }

  try {
    console.log('🔑 Storing Google OAuth tokens...')
    const response = await fetch('/api/auth/store-google-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_token: session.provider_token,
        provider_refresh_token: session.provider_refresh_token || null,
      }),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Google tokens stored successfully:', result.user_email)
    } else {
      console.error('❌ Failed to store Google tokens:', result.error)
    }
  } catch (error) {
    console.error('❌ Error storing Google tokens:', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const tokenStoredRef = useRef(false)

  useEffect(() => {
    // Create client on mount (client-side only)
    const client = createSafeBrowserClient()
    setSupabase(client)

    if (!client) {
      console.warn('⚠️ Supabase not configured, running in local-only mode')
      setLoading(false)
      return
    }

    // Get initial session and store tokens if needed
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Store Google tokens if we have them and haven't stored yet
      if (session?.provider_token && !tokenStoredRef.current) {
        tokenStoredRef.current = true
        storeGoogleTokens(session)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        
        // Store tokens on sign-in (especially important for OAuth)
        if (event === 'SIGNED_IN' && session?.provider_token && !tokenStoredRef.current) {
          tokenStoredRef.current = true
          storeGoogleTokens(session)
        }
        
        // Reset on sign-out
        if (event === 'SIGNED_OUT') {
          tokenStoredRef.current = false
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      return
    }
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.appdata'
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
    } catch (error) {
      console.error('Google sign in error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Export useUser for backward compatibility
export const useUser = () => {
  const { user, loading } = useAuth()
  return { user, loading, isLoading: loading }
}
