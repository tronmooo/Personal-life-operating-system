'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { usePasskeys } from '@/lib/hooks/use-passkeys'
import { Button } from '@/components/ui/button'
import { Fingerprint, Loader2, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PasskeySignInButtonProps {
  className?: string
  email?: string
  onError?: (error: string) => void
  onSuccess?: () => void
  showAlways?: boolean // Show button even if device doesn't support Face ID
}

export function PasskeySignInButton({ 
  className, 
  email,
  onError,
  onSuccess,
  showAlways = true, // Default to always showing the button
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
  const isBiometricsAvailable = isSupported && isPlatformAuthenticatorAvailable

  // Hide if device doesn't support passkeys (unless showAlways is true)
  if (!showAlways && !isBiometricsAvailable) {
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

  // If biometrics not available, show disabled button with tooltip
  if (!isBiometricsAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={className}>
              <Button
                type="button"
                variant="outline"
                className="w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Sign in with Face ID
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Face ID is only available on supported devices (iPhone, Mac with Touch ID)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

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

