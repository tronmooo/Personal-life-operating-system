'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    // Check auth status with timeout
    const checkAuth = async () => {
      try {
        console.log('🔐 Checking authentication...')
        
        // Set a timeout to prevent infinite loading (5 seconds)
        timeoutId = setTimeout(() => {
          console.warn('⚠️ Auth check timeout - proceeding without auth')
          setUser(null)
          setLoading(false)
        }, 5000)

        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('❌ Auth check error:', error)
          setUser(null)
        } else {
          console.log('✅ Auth check complete:', session?.user?.email || 'No user')
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('❌ Auth check exception:', error)
        clearTimeout(timeoutId)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      
      // If user signs out, redirect to signin
      if (event === 'SIGNED_OUT') {
        router.push('/auth/signin')
      }
      
      // Don't reload on SIGNED_IN - let the state update handle it
      // The DataProvider will reload data automatically when session changes
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Loading state
  if (loading || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('⏭️ User skipped auth check')
                setLoading(false)
                setUser(null)
              }}
            >
              Skip
            </Button>
            <p className="text-xs text-muted-foreground">
              Taking too long? Click Skip to continue
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access LifeHub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please sign in to continue. You'll be redirected to the sign-in page.
            </p>
            <Button 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated - render children
  return <>{children}</>
}

