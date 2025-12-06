/**
 * React hook for managing external integrations
 * Handles connection state, OAuth flows, and sync status
 */

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

export interface ExternalConnection {
  id: string
  user_id: string
  provider: string
  connection_type: 'oauth' | 'api_key'
  access_token?: string
  refresh_token?: string
  expires_at?: string
  metadata: Record<string, any>
  status: 'active' | 'expired' | 'error' | 'disconnected'
  created_at: string
  last_synced?: string
}

export interface IntegrationConfig {
  id: string
  name: string
  description: string
  tier: 1 | 2 | 3
  category: string
  domain: string
  features: string[]
  authType: 'oauth' | 'api_key'
  website?: string
  logoUrl?: string
  // OAuth config
  oauthUrl?: string
  scopes?: string[]
  // Required env vars
  requiredEnvVars?: string[]
  // Setup instructions
  setupInstructions?: string
}

export function useIntegrations() {
  const [connections, setConnections] = useState<ExternalConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  // Fetch all connections
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/integrations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connections')
      }

      setConnections(data.connections || [])
    } catch (err) {
      console.error('Error fetching integrations:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if a provider is connected
  const isConnected = useCallback((provider: string): boolean => {
    return connections.some(c => c.provider === provider && c.status === 'active')
  }, [connections])

  // Get connection for a provider
  const getConnection = useCallback((provider: string): ExternalConnection | undefined => {
    return connections.find(c => c.provider === provider)
  }, [connections])

  // Connect via API key
  const connectWithApiKey = useCallback(async (
    provider: string,
    apiKey: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          connection_type: 'api_key',
          api_key: apiKey,
          metadata,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect')
      }

      toast.success(`Connected to ${provider}!`)
      await fetchConnections()
      return data.connection
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect')
      throw err
    }
  }, [fetchConnections])

  // Initiate OAuth flow
  const initiateOAuth = useCallback((provider: string, config: IntegrationConfig) => {
    if (!config.oauthUrl) {
      toast.error('OAuth not configured for this provider')
      return
    }

    // Build state for callback
    const state = Buffer.from(JSON.stringify({
      provider,
      returnUrl: window.location.href,
    })).toString('base64')

    // Build OAuth URL
    const redirectUri = `${window.location.origin}/api/integrations/oauth/callback`
    const scopes = config.scopes?.join(' ') || ''

    const oauthUrl = new URL(config.oauthUrl)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    
    if (scopes) {
      oauthUrl.searchParams.set('scope', scopes)
    }

    // Redirect to OAuth provider
    window.location.href = oauthUrl.toString()
  }, [])

  // Disconnect a provider
  const disconnect = useCallback(async (provider: string) => {
    try {
      const response = await fetch(`/api/integrations?provider=${encodeURIComponent(provider)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      toast.success(`Disconnected from ${provider}`)
      await fetchConnections()
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect')
      throw err
    }
  }, [fetchConnections])

  // Sync data for a provider
  const syncProvider = useCallback(async (provider: string) => {
    try {
      toast.loading(`Syncing ${provider}...`, { id: `sync-${provider}` })
      
      // Update last_synced timestamp
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      await supabase
        .from('external_connections')
        .update({ last_synced: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('provider', provider)

      await fetchConnections()
      toast.success(`${provider} synced successfully!`, { id: `sync-${provider}` })
    } catch (err: any) {
      toast.error(err.message || 'Sync failed', { id: `sync-${provider}` })
      throw err
    }
  }, [supabase, fetchConnections])

  // Load connections on mount
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  // Get stats
  const stats = {
    totalConnected: connections.filter(c => c.status === 'active').length,
    totalSyncing: connections.filter(c => c.metadata?.is_syncing).length,
    totalWithErrors: connections.filter(c => c.status === 'error').length,
  }

  return {
    connections,
    loading,
    error,
    stats,
    isConnected,
    getConnection,
    connectWithApiKey,
    initiateOAuth,
    disconnect,
    syncProvider,
    refresh: fetchConnections,
  }
}










