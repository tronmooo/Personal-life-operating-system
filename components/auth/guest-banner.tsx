'use client'

import { useState, useEffect } from 'react'
import { X, LogIn, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthGuard } from '@/lib/hooks/use-auth-guard'
import Link from 'next/link'

interface GuestBannerProps {
  /** Where to redirect after sign-in */
  redirectPath?: string
  /** Whether to show in a compact mode */
  compact?: boolean
  /** Custom message */
  message?: string
}

export function GuestBanner({ redirectPath, compact = false, message }: GuestBannerProps) {
  const { isAuthenticated, isLoading } = useAuthGuard()
  const [dismissed, setDismissed] = useState(false)
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'guest-banner.tsx:render',message:'GuestBanner render',data:{isAuthenticated,isLoading,dismissed,willShow:!isLoading&&!isAuthenticated&&!dismissed},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  }
  // #endregion

  // Check if banner was dismissed in this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem('guest-banner-dismissed')
      if (wasDismissed) {
        setDismissed(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('guest-banner-dismissed', 'true')
    }
  }

  // Don't show if loading, authenticated, or dismissed
  if (isLoading || isAuthenticated || dismissed) {
    return null
  }

  const currentPath = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const signInUrl = `/auth/signin?redirect=${encodeURIComponent(currentPath)}`

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
        <Eye className="h-4 w-4 text-blue-400" />
        <span className="text-blue-200">Viewing as guest</span>
        <Link href={signInUrl}>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-blue-400 hover:text-blue-300">
            Sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Eye className="h-5 w-5 text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            {message || "You're viewing as a guest"}
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            Sign in to add items, save your data, and access all features. Your information will be stored securely.
          </p>
          
          <div className="flex gap-3">
            <Link href={signInUrl}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href={`/auth/signup?redirect=${encodeURIComponent(currentPath)}`}>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A smaller inline prompt for use in cards or sections
 */
export function SignInPrompt({ action = 'save' }: { action?: string }) {
  const { isAuthenticated, isLoading } = useAuthGuard()
  
  if (isLoading || isAuthenticated) {
    return null
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <div className="text-center py-6 px-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <LogIn className="h-8 w-8 text-gray-500 mx-auto mb-2" />
      <p className="text-gray-400 text-sm mb-3">
        Sign in to {action} your data
      </p>
      <Link href={`/auth/signin?redirect=${encodeURIComponent(currentPath)}`}>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Sign In
        </Button>
      </Link>
    </div>
  )
}
