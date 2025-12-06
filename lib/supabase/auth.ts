import { supabase } from './client'

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

export async function signUp({ email, password, name }: SignUpData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return { data: null, error: error.message || 'Failed to sign up' }
  }
}

export async function signIn({ email, password }: SignInData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { data: null, error: error.message || 'Failed to sign in' }
  }
}

export async function signOut() {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return { error: error.message || 'Failed to sign out' }
  }
}

export async function resetPassword(email: string) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Reset password error:', error)
    return { error: error.message || 'Failed to send reset email' }
  }
}

export async function updatePassword(newPassword: string) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Update password error:', error)
    return { error: error.message || 'Failed to update password' }
  }
}

export async function getCurrentUser() {
  try {
    if (!supabase) {
      return { user: null, error: 'Supabase not configured' }
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error: any) {
    console.error('Get user error:', error)
    return { user: null, error: error.message || 'Failed to get user' }
  }
}

export async function getSession() {
  try {
    if (!supabase) {
      return { session: null, error: 'Supabase not configured' }
    }

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error: any) {
    console.error('Get session error:', error)
    return { session: null, error: error.message || 'Failed to get session' }
  }
}
































