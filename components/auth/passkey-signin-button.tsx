'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { usePasskeys } from '@/lib/hooks/use-passkeys'
import { Button } from '@/components/ui/button'
import { Fingerprint, Loader2 } from 'lucide-react'

interface PasskeySignInButtonProps {
  className?: string
  email?: string
  onError?: (error: string) => void
  onSuccess?: () => void
}

export function PasskeySignInButton({ 
  className, 
  email,
  onError,
  onSuccess,
}: PasskeySignInButtonProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { 
    isSupported, 
    isPlatformAuthenticatorAvailable,
    authenticateWithPasskey, 
    authenticating,
    error,
  } = usePasskeys()

  const [completing, setCompleting] = useState(false)

  // Only show if device supports passkeys
  if (!isSupported || !isPlatformAuthenticatorAvailable) {
    return null
  }

  const handleSignIn = async () => {
    const result = await authenticateWithPasskey(email)
    
    if (result.success && result.token) {
      setCompleting(true)
      
      try {
        // Complete the sign-in by verifying the magic link token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: result.token,
          type: 'magiclink',
        })

        if (verifyError) {
          console.error('Token verification failed:', verifyError)
          onError?.(verifyError.message)
          setCompleting(false)
          return
        }

        // Successfully signed in!
        onSuccess?.()
        
        // Redirect to home
        window.location.replace('/')
      } catch (err: any) {
        console.error('Sign-in completion failed:', err)
        onError?.(err.message || 'Failed to complete sign-in')
        setCompleting(false)
      }
    } else if (error) {
      onError?.(error)
    }
  }

  const isLoading = authenticating || completing

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {completing ? 'Signing in...' : 'Authenticating...'}
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          Sign in with Face ID
        </>
      )}
    </Button>
  )
}

