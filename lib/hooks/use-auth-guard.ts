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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:useEffect-start',message:'useAuthGuard effect starting',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const supabase = createSafeBrowserClient()
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:after-createClient',message:'Supabase client creation result',data:{clientExists:!!supabase,clientType:supabase ? typeof supabase : 'null'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    if (!supabase) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:client-null',message:'CRITICAL: Supabase client is null, setting isLoading=false',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setIsLoading(false)
      return
    }

    // Check initial session
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:before-getSession',message:'About to call getSession()',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:getSession-result',message:'getSession() completed',data:{hasSession:!!session,hasUser:!!session?.user,userEmail:session?.user?.email||'none',expiresAt:session?.expires_at||'none'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
      setIsAuthenticated(!!session?.user)
      setUser(session?.user || null)
      setIsLoading(false)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:state-set',message:'Auth state set after getSession',data:{isAuthenticated:!!session?.user,isLoading:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-guard.ts:onAuthStateChange',message:'Auth state change event',data:{event:_event,hasSession:!!session,hasUser:!!session?.user,userEmail:session?.user?.email||'none'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      
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
