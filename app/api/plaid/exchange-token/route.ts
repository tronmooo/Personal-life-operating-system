import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { encryptToString } from '@/lib/utils/encryption'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { public_token, userId } = await request.json()

    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Exchanging public token for access token')

    // Exchange public token for access token
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Access token obtained successfully')

    // Get account details
    const accountsResponse = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: data.access_token,
      }),
    })

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch account details')
    }

    const accountsData = await accountsResponse.json()
    console.log('✅ Fetched account details:', accountsData.accounts.length, 'accounts')

    // Get institution details
    const itemResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: data.access_token,
      }),
    })

    let institutionName = 'Unknown Bank'
    let institutionId = null

    if (itemResponse.ok) {
      const itemData = await itemResponse.json()
      institutionId = itemData.item.institution_id

      if (institutionId) {
        const instResponse = await fetch(`https://${PLAID_ENV}.plaid.com/institutions/get_by_id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            institution_id: institutionId,
            country_codes: ['US'],
          }),
        })

        if (instResponse.ok) {
          const instData = await instResponse.json()
          institutionName = instData.institution.name
        }
      }
    }

    // Encrypt the access token before storing (SECURITY)
    const encryptedAccessToken = encryptToString(data.access_token)
    console.log('🔒 Access token encrypted for secure storage')

    // Store each account separately in linked_accounts table
    const accountsToInsert = accountsData.accounts.map((account: any) => ({
      user_id: session.user.id,
      plaid_item_id: data.item_id,
      plaid_access_token: encryptedAccessToken,
      plaid_account_id: account.account_id,
      institution_id: institutionId,
      institution_name: institutionName,
      account_name: account.name,
      account_type: account.type,
      account_subtype: account.subtype,
      mask: account.mask,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      currency_code: account.balances.iso_currency_code || 'USD',
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('linked_accounts')
      .insert(accountsToInsert)

    if (insertError) {
      console.error('❌ Error storing linked accounts:', insertError)
      throw new Error(`Failed to store account data: ${insertError.message}`)
    }

    console.log(`✅ Stored ${accountsToInsert.length} accounts in database`)

    return NextResponse.json({
      success: true,
      item_id: data.item_id,
      accounts: accountsToInsert.length,
      institution: institutionName,
    })
  } catch (error) {
    console.error('❌ Token exchange error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to exchange public token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}






















