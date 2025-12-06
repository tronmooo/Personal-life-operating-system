'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface GoogleSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  forceSignIn?: boolean
}

export function GoogleSignInButton({ forceSignIn = false, className, ...props }: GoogleSignInButtonProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleClick = async () => {
    if (forceSignIn || !session) {
      // Sign in with Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
        },
      })
      
      if (error) {
        console.error('Error signing in:', error)
      }
    } else {
      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (loading) {
    return <Button disabled className={cn('gap-2', className)} {...props}>Loading...</Button>
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      className={cn('gap-2', className)}
      {...props}
    >
      {session ? 'Sign out of Google' : 'Sign in with Google'}
    </Button>
  )
}

export default GoogleSignInButton
