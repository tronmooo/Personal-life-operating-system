'use client'

import { useState, useEffect } from 'react'
import { idbGet, idbSet, idbDel } from '@/lib/utils/idb-cache'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, CreditCard, DollarSign, RefreshCw, Link as LinkIcon, CheckCircle } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    Plaid?: any
  }
}

interface PlaidAccount {
  account_id: string
  name: string
  type: string
  subtype: string
  balances: {
    available: number | null
    current: number | null
    limit: number | null
  }
  mask: string
}

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidAccount[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [plaidReady, setPlaidReady] = useState(false)

  // Load saved connection from Supabase
  useEffect(() => {
    const loadSavedConnection = async () => {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback to IndexedDB for unauthenticated users
        idbGet<string>('plaid_access_token', null).then((savedToken) => {
          if (savedToken) {
            setAccessToken(savedToken)
            loadAccounts(savedToken)
          }
        })
        return
      }

      // Load from Supabase
      const { data: plaidItem, error } = await supabase
        .from('plaid_items')
        .select('plaid_access_token, plaid_item_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!error && plaidItem) {
        setAccessToken(plaidItem.plaid_access_token)
        loadAccounts(plaidItem.plaid_access_token)
      }
    }

    loadSavedConnection()
  }, [])

  // Initialize Plaid Link
  const initializePlaid = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user' }),
      })

      const data = await response.json()

      if (data.success) {
        setLinkToken(data.link_token)
        
        if (window.Plaid && plaidReady) {
          openPlaidLink(data.link_token)
        }
      } else {
        alert(`Error: ${data.error}\n\n${data.message}`)
      }
    } catch (error) {
      console.error('Error initializing Plaid:', error)
      alert('Failed to initialize Plaid connection')
    } finally {
      setIsConnecting(false)
    }
  }

  const openPlaidLink = (token: string) => {
    if (!window.Plaid) {
      alert('Plaid is not loaded yet. Please try again.')
      return
    }

    const handler = window.Plaid.create({
      token: token,
      onSuccess: async (public_token: string, metadata: any) => {
        console.log('✅ Plaid connection successful:', metadata)
        
        // Exchange public token for access token
        try {
          const response = await fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          })

          const data = await response.json()

          if (data.success) {
            setAccessToken(data.access_token)
            
            // Save to Supabase
            const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
            const supabase = createClientComponentClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
              // Save to Supabase plaid_items table
              await supabase.from('plaid_items').upsert({
                user_id: user.id,
                plaid_item_id: data.item_id,
                plaid_access_token: data.access_token,
                institution_id: metadata?.institution?.institution_id,
                institution_name: metadata?.institution?.name,
                is_active: true
              })
            } else {
              // Fallback to IndexedDB for unauthenticated users
              idbSet('plaid_access_token', data.access_token)
              idbSet('plaid_item_id', data.item_id)
            }
            
            // Load accounts
            await loadAccounts(data.access_token)
            
            alert('Bank account connected successfully! 🎉')
          } else {
            alert(`Error: ${data.error}`)
          }
        } catch (error) {
          console.error('Error exchanging token:', error)
          alert('Failed to connect bank account')
        }
      },
      onExit: (err: any, metadata: any) => {
        if (err) {
          console.error('Plaid Link error:', err)
        }
        console.log('Plaid Link exit:', metadata)
      },
      onEvent: (eventName: string, metadata: any) => {
        console.log('Plaid Link event:', eventName, metadata)
      },
    })

    handler.open()
  }

  const loadAccounts = async (token: string) => {
    try {
      const response = await fetch('/api/plaid/get-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      })

      const data = await response.json()

      if (data.success) {
        setConnectedAccounts(data.accounts)
        
        // Save accounts to Supabase
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get the plaid_item_id for this user
          const { data: plaidItem } = await supabase
            .from('plaid_items')
            .select('plaid_item_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

          if (plaidItem) {
            // Upsert linked accounts
            for (const account of data.accounts) {
              await supabase.from('linked_accounts').upsert({
                user_id: user.id,
                plaid_item_id: plaidItem.plaid_item_id,
                plaid_account_id: account.account_id,
                plaid_access_token: token,
                institution_name: account.official_name || account.name,
                account_name: account.name,
                account_type: account.type,
                account_subtype: account.subtype,
                account_mask: account.mask,
                current_balance: account.balances.current,
                available_balance: account.balances.available,
                currency_code: account.balances.iso_currency_code || 'USD',
                last_synced_at: new Date().toISOString()
              })
            }
          }
        } else {
          // Fallback to IndexedDB
          idbSet('plaid_accounts', data.accounts)
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const refreshAccounts = async () => {
    if (!accessToken) return
    
    setIsRefreshing(true)
    await loadAccounts(accessToken)
    setIsRefreshing(false)
  }

  const disconnectAccount = async () => {
    if (!confirm('Are you sure you want to disconnect your bank account?')) return

    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Deactivate in Supabase
      await supabase
        .from('plaid_items')
        .update({ is_active: false })
        .eq('user_id', user.id)
    } else {
      // Fallback to IndexedDB
      idbDel('plaid_access_token')
      idbDel('plaid_item_id')
      idbDel('plaid_accounts')
    }
    
    setAccessToken(null)
    setConnectedAccounts([])
    alert('Bank account disconnected')
  }

  const totalBalance = connectedAccounts.reduce((sum, account) => 
    sum + (account.balances.current || 0), 0
  )

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        onLoad={() => {
          console.log('✅ Plaid script loaded')
          setPlaidReady(true)
        }}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Bank Accounts
              </CardTitle>
              <CardDescription>
                Connect your bank accounts via Plaid to automatically sync transactions
              </CardDescription>
            </div>
            {accessToken && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!accessToken ? (
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bank Connected</h3>
              <p className="text-muted-foreground mb-6">
                Connect your bank account to automatically track transactions and balances
              </p>
              <Button 
                onClick={initializePlaid}
                disabled={isConnecting || !plaidReady}
                className="w-full max-w-xs"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Bank Account
                  </>
                )}
              </Button>
              {!plaidReady && (
                <p className="text-xs text-muted-foreground mt-2">
                  Loading Plaid...
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Total Balance */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
                <div className="text-3xl font-bold">${totalBalance.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Across {connectedAccounts.length} {connectedAccounts.length === 1 ? 'account' : 'accounts'}
                </div>
              </div>

              {/* Accounts List */}
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.account_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.subtype} •••• {account.mask}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        ${(account.balances.current || 0).toLocaleString()}
                      </div>
                      {account.balances.available !== null && account.balances.available !== account.balances.current && (
                        <div className="text-xs text-muted-foreground">
                          ${(account.balances.available || 0).toLocaleString()} available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={refreshAccounts}
                  disabled={isRefreshing}
                  className="flex-1"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnectAccount}
                  className="text-red-600 hover:text-red-700"
                >
                  Disconnect
                </Button>
              </div>
            </>
          )}

          {/* Setup Instructions */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">
              🔧 Plaid Setup Required
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
              To use bank account connections, you need to:
            </p>
            <ol className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
              <li>Sign up for a free Plaid account at <a href="https://plaid.com" target="_blank" rel="noopener noreferrer" className="underline">plaid.com</a></li>
              <li>Get your API keys from the Plaid Dashboard</li>
              <li>Add them to your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file:
                <div className="mt-2 font-mono text-xs bg-amber-100 dark:bg-amber-900 p-2 rounded">
                  PLAID_CLIENT_ID=your_client_id<br />
                  PLAID_SECRET=your_secret<br />
                  PLAID_ENV=sandbox
                </div>
              </li>
              <li>Restart your dev server</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </>
  )
}






















