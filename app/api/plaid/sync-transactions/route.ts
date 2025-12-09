import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { decryptFromString } from '@/lib/utils/encryption'

export const runtime = 'nodejs'
export const maxDuration = 60

const PLAID_CLIENT_ID = process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'

/**
 * POST /api/plaid/sync-transactions
 * Fetch transactions from Plaid for a specific account
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access_token, item_id, start_date, end_date, account_ids } = await request.json()

    // Decrypt the access token if it's encrypted (new format)
    // Or accept plain token for backwards compatibility
    let decryptedAccessToken = access_token

    // If item_id is provided, fetch and decrypt the token from database (preferred method)
    if (item_id) {
      const { data: accountData, error: accountError } = await supabase
        .from('linked_accounts')
        .select('plaid_access_token')
        .eq('plaid_item_id', item_id)
        .eq('user_id', user.id)
        .single()

      if (accountError || !accountData) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      // Decrypt the stored token
      try {
        decryptedAccessToken = decryptFromString(accountData.plaid_access_token)
        console.log('🔓 Access token decrypted from database')
      } catch (err) {
        // If decryption fails, assume it's plain text (old format)
        decryptedAccessToken = accountData.plaid_access_token
        console.log('⚠️  Using unencrypted token (legacy)')
      }
    } else if (access_token) {
      // Try to decrypt if it looks encrypted
      if (access_token.includes(':')) {
        try {
          decryptedAccessToken = decryptFromString(access_token)
          console.log('🔓 Access token decrypted from parameter')
        } catch (err) {
          // If decryption fails, use as-is
          console.log('⚠️  Using token as-is')
        }
      }
    } else {
      return NextResponse.json(
        { error: 'item_id or access_token is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Syncing transactions from ${start_date} to ${end_date}`)

    // Call Plaid Transactions Get API
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: decryptedAccessToken,
        start_date,
        end_date,
        options: {
          account_ids,
          count: 500, // Max per request
          offset: 0,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Plaid API error:', errorData)
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()

    console.log(`✅ Fetched ${data.transactions.length} transactions`)
    console.log(`   Accounts: ${data.accounts.length}`)
    console.log(`   Total available: ${data.total_transactions}`)

    // Also get account balances while we're here
    const accountBalances = data.accounts.map((account: any) => ({
      account_id: account.account_id,
      current: account.balances.current,
      available: account.balances.available,
    }))

    return NextResponse.json({
      success: true,
      transactions: data.transactions,
      accounts: data.accounts,
      account_balances: accountBalances,
      total_transactions: data.total_transactions,
    })
  } catch (error: any) {
    console.error('❌ Sync transactions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync transactions',
        message: error.message,
      },
      { status: 500 }
    )
  }
}



