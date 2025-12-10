'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSafeBrowserClient } from '@/lib/supabase/safe-client'
import { toast } from '@/lib/utils/toast'

/**
 * Hook to guard actions that require authentication
 * Returns:
 * - isAuthenticated: whether user is logged in
 * - isLoading: whether auth state is being checked
 * - user: the authenticated user object (or null)
 * - requireAuth: function to wrap actions - shows sign-in prompt if not authenticated
 */
export function useAuthGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createSafeBrowserClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user)
      setUser(session?.user || null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Wrap an action to require authentication
   * If not authenticated, shows a toast and redirects to sign-in
   * @param action - The action to perform if authenticated
   * @param actionName - Description of the action (e.g., "add items", "save changes")
   * @returns The wrapped action function
   */
  const requireAuth = useCallback(<T extends (...args: any[]) => any>(
    action: T,
    actionName: string = 'perform this action'
  ): T => {
    return ((...args: Parameters<T>) => {
      if (!isAuthenticated) {
        toast.warning(
          'Sign In Required',
          `Please sign in to ${actionName}. Your data will be saved securely.`
        )
        
        // Redirect to sign-in after a short delay
        setTimeout(() => {
          const currentPath = window.location.pathname
          window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentPath)}`
        }, 1500)
        
        return
      }
      return action(...args)
    }) as T
  }, [isAuthenticated])

  /**
   * Check if user can perform an action (without redirecting)
   * Shows a toast if not authenticated
   */
  const canPerformAction = useCallback((actionName: string = 'perform this action'): boolean => {
    if (!isAuthenticated) {
      toast.warning(
        'Sign In Required',
        `Please sign in to ${actionName}.`
      )
      return false
    }
    return true
  }, [isAuthenticated])

  /**
   * Prompt sign-in with optional redirect
   */
  const promptSignIn = useCallback((message?: string) => {
    toast.info(
      'Sign In to Continue',
      message || 'Create a free account to save your data and access all features.'
    )
    setTimeout(() => {
      const currentPath = window.location.pathname
      window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentPath)}`
    }, 1500)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    user,
    requireAuth,
    canPerformAction,
    promptSignIn,
  }
}

/**
 * Simple check if user is authenticated (for server components or quick checks)
 */
export async function checkAuth(): Promise<{ authenticated: boolean; user: any }> {
  const supabase = createSafeBrowserClient()
  if (!supabase) {
    return { authenticated: false, user: null }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  return { authenticated: !!user, user }
}
