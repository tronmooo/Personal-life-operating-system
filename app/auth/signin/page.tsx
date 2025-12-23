'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Redirect function that works reliably
  const redirectToHome = useCallback(() => {
    console.log('🔄 Redirecting to home...')
    // Use replace to avoid back button issues
    window.location.replace('/')
  }, [])

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('✅ Already authenticated, redirecting...', session.user.email)
          redirectToHome()
          return
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [supabase.auth, redirectToHome])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Sign-in detected')
        
        // Store Google tokens if present (for OAuth sign-in)
        if (session.provider_token) {
          console.log('🔑 Google OAuth tokens detected, storing...')
          try {
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
              console.log('✅ Google tokens stored:', result.user_email)
            } else {
              console.error('❌ Failed to store tokens:', result.error)
            }
          } catch (err) {
            console.error('❌ Error storing Google tokens:', err)
          }
        }
        
        console.log('🏠 Redirecting to home...')
        redirectToHome()
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth, redirectToHome])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Fallback: read from DOM if React state is empty (for browser automation)
    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement
    const emailValue = email || emailInput?.value || ''
    const passwordValue = password || passwordInput?.value || ''

    try {
      if (isSignUp) {
        // Sign up with auto-confirm (no email verification required)
        const { data, error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            // Auto-confirm the user without email verification
            data: {
              email_confirmed: true
            }
          },
        })
        
        if (error) throw error
        
        // If sign up successful, automatically sign in
        if (data.user) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailValue,
            password: passwordValue,
          })
          
          if (signInError) {
            // If auto sign-in fails, show success message
            setError('Account created! Please sign in.')
            setIsSignUp(false)
          } else if (signInData.session) {
            // Successfully signed in - the auth state listener will redirect
            console.log('✅ Sign-up successful, user:', signInData.user.email)
            // Force redirect in case auth listener doesn't fire
            setTimeout(() => redirectToHome(), 100)
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        })
        if (error) throw error
        
        if (data.session) {
          // Successfully signed in - the auth state listener will redirect
          console.log('✅ Sign-in successful, user:', data.user.email)
          // Force redirect in case auth listener doesn't fire
          setTimeout(() => redirectToHome(), 100)
        }
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error)
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
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
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'An error occurred')
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Create a new account to get started' 
              : 'Sign in to your AI Concierge account'}
          </CardDescription>
          {isSignUp && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Creating a new account?</strong> Make sure you're on the "Create Account" screen (not "Sign in").
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant={error.includes('Check your email') ? 'default' : 'destructive'}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>{isSignUp ? 'Create Account' : 'Sign In'}</>
              )}
            </Button>
            {!isSignUp && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Don't have an account? Click the link below to sign up.
              </p>
            )}
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setEmail('')
                setPassword('')
              }}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
