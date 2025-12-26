'use client'

import { useState, useCallback, useEffect } from 'react'
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface PasskeyCredential {
  id: string
  device_name: string
  device_type: string
  created_at: string
  last_used_at: string | null
  backed_up: boolean
}

interface UsePasskeysReturn {
  // State
  credentials: PasskeyCredential[]
  loading: boolean
  registering: boolean
  authenticating: boolean
  error: string | null
  
  // Capabilities
  isSupported: boolean
  isPlatformAuthenticatorAvailable: boolean
  
  // Actions
  registerPasskey: (deviceName?: string) => Promise<boolean>
  authenticateWithPasskey: (email?: string) => Promise<{ success: boolean; token?: string; tokenType?: string }>
  removePasskey: (id: string) => Promise<boolean>
  renamePasskey: (id: string, newName: string) => Promise<boolean>
  refreshCredentials: () => Promise<void>
}

function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device'
  
  const ua = navigator.userAgent
  
  // iOS devices
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  
  // Android
  if (/Android/.test(ua)) {
    const match = ua.match(/Android.*?;\s*([^;)]+)/)
    if (match) return match[1].trim()
    return 'Android Device'
  }
  
  // macOS
  if (/Macintosh/.test(ua)) return 'Mac'
  
  // Windows
  if (/Windows/.test(ua)) return 'Windows PC'
  
  // Linux
  if (/Linux/.test(ua)) return 'Linux Device'
  
  return 'Unknown Device'
}

export function usePasskeys(): UsePasskeysReturn {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState(false)
  
  const supabase = createClientComponentClient()

  // Check WebAuthn support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = browserSupportsWebAuthn()
      setIsSupported(supported)
      
      if (supported && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setIsPlatformAuthenticatorAvailable(available)
        } catch {
          setIsPlatformAuthenticatorAvailable(false)
        }
      }
    }
    
    checkSupport()
  }, [])

  // Fetch credentials
  const refreshCredentials = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/webauthn/credentials')
      const data = await response.json()
      
      if (!response.ok) {
        // Not authenticated is expected on login page
        if (response.status !== 401) {
          throw new Error(data.error || 'Failed to fetch credentials')
        }
        setCredentials([])
        return
      }
      
      setCredentials(data.credentials || [])
    } catch (err: any) {
      console.error('Failed to fetch passkey credentials:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load credentials on mount
  useEffect(() => {
    refreshCredentials()
  }, [refreshCredentials])

  // Register a new passkey
  const registerPasskey = useCallback(async (deviceName?: string): Promise<boolean> => {
    if (!isSupported) {
      setError('WebAuthn is not supported on this device')
      return false
    }

    try {
      setRegistering(true)
      setError(null)

      // Get registration options from server
      const optionsResponse = await fetch('/api/webauthn/register/options', {
        method: 'POST',
      })
      
      if (!optionsResponse.ok) {
        const data = await optionsResponse.json()
        throw new Error(data.error || 'Failed to get registration options')
      }
      
      const options = await optionsResponse.json()

      // Trigger the browser's passkey creation (Face ID / Touch ID prompt)
      const credential = await startRegistration(options)

      // Verify and store the credential
      const verifyResponse = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          deviceName: deviceName || getDeviceName(),
        }),
      })

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.error || 'Failed to register passkey')
      }

      // Refresh the credentials list
      await refreshCredentials()
      
      return true
    } catch (err: any) {
      console.error('Passkey registration failed:', err)
      
      // Handle user cancellation gracefully
      if (err.name === 'NotAllowedError') {
        setError('Passkey registration was cancelled')
      } else {
        setError(err.message || 'Failed to register passkey')
      }
      
      return false
    } finally {
      setRegistering(false)
    }
  }, [isSupported, refreshCredentials])

  // Authenticate with passkey
  const authenticateWithPasskey = useCallback(async (email?: string): Promise<{ success: boolean; token?: string; tokenType?: string }> => {
    if (!isSupported) {
      setError('WebAuthn is not supported on this device')
      return { success: false }
    }

    try {
      setAuthenticating(true)
      setError(null)

      // Get authentication options from server
      const optionsResponse = await fetch('/api/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (!optionsResponse.ok) {
        const data = await optionsResponse.json()
        throw new Error(data.error || 'Failed to get authentication options')
      }
      
      const options = await optionsResponse.json()

      // Trigger the browser's passkey authentication (Face ID / Touch ID prompt)
      const credential = await startAuthentication(options)

      // Verify the authentication
      const verifyResponse = await fetch('/api/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.error || 'Authentication failed')
      }

      const data = await verifyResponse.json()
      
      return { 
        success: true, 
        token: data.token,
        tokenType: data.tokenType,
      }
    } catch (err: any) {
      console.error('Passkey authentication failed:', err)
      
      // Handle user cancellation gracefully
      if (err.name === 'NotAllowedError') {
        setError('Authentication was cancelled')
      } else {
        setError(err.message || 'Authentication failed')
      }
      
      return { success: false }
    } finally {
      setAuthenticating(false)
    }
  }, [isSupported])

  // Remove a passkey
  const removePasskey = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/webauthn/credentials?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove passkey')
      }

      // Refresh the list
      await refreshCredentials()
      
      return true
    } catch (err: any) {
      console.error('Failed to remove passkey:', err)
      setError(err.message)
      return false
    }
  }, [refreshCredentials])

  // Rename a passkey
  const renamePasskey = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch('/api/webauthn/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, device_name: newName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rename passkey')
      }

      // Refresh the list
      await refreshCredentials()
      
      return true
    } catch (err: any) {
      console.error('Failed to rename passkey:', err)
      setError(err.message)
      return false
    }
  }, [refreshCredentials])

  return {
    credentials,
    loading,
    registering,
    authenticating,
    error,
    isSupported,
    isPlatformAuthenticatorAvailable,
    registerPasskey,
    authenticateWithPasskey,
    removePasskey,
    renamePasskey,
    refreshCredentials,
  }
}

