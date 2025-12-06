import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

const PLAID_CLIENT_ID = process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'
const CRON_SECRET = process.env.CRON_SECRET || ''

// Use service role key for cron jobs (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * GET /api/plaid/sync-all
 * Background job to sync transactions for all users
 * Called daily at 6am via cron job
 * 
 * Security: Requires Authorization header with CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check authorization
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting daily transaction sync for all users...')

    // Get all active Plaid items
    const { data: plaidItems, error: itemsError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('is_active', true)

    if (itemsError) {
      throw itemsError
    }

    console.log(`📊 Found ${plaidItems?.length || 0} active Plaid connections`)

    const results: any[] = []
    let totalSynced = 0
    let totalErrors = 0

    // Sync transactions for each item
    for (const item of plaidItems || []) {
      try {
        const result = await syncItemTransactions(item)
        results.push(result)
        totalSynced += result.transactions_added || 0
      } catch (error: any) {
        console.error(`Error syncing item ${item.plaid_item_id}:`, error)
        totalErrors++
        results.push({
          item_id: item.plaid_item_id,
          status: 'error',
          error: error.message,
        })
      }
    }

    // Calculate net worth for all users
    console.log('💰 Calculating net worth for all users...')
    await calculateAllNetWorth()

    console.log(`✅ Sync complete: ${totalSynced} transactions, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        items_processed: plaidItems?.length || 0,
        total_transactions: totalSynced,
        errors: totalErrors,
      },
      results,
    })
  } catch (error: any) {
    console.error('❌ Sync job error:', error)
    return NextResponse.json(
      {
        error: 'Sync job failed',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Sync transactions for a single Plaid item
 */
async function syncItemTransactions(item: any) {
  const startTime = Date.now()
  
  try {
    console.log(`   Syncing item: ${item.institution_name} (${item.plaid_item_id})`)

    // Get last 30 days of transactions
    const startDate = getDateDaysAgo(30)
    const endDate = getToday()

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: item.plaid_access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset: 0,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()

    // Get linked accounts for this item
    const { data: linkedAccounts } = await supabase
      .from('linked_accounts')
      .select('id, plaid_account_id')
      .eq('plaid_item_id', item.plaid_item_id)

    if (!linkedAccounts || linkedAccounts.length === 0) {
      console.error('   No linked accounts found')
      return {
        item_id: item.plaid_item_id,
        status: 'error',
        error: 'No linked accounts',
      }
    }

    // Create account ID map
    const accountMap = new Map(
      linkedAccounts.map(acc => [acc.plaid_account_id, acc.id])
    )

    // Store transactions
    const transactionsToInsert = data.transactions.map((tx: any) => ({
      user_id: item.user_id,
      account_id: accountMap.get(tx.account_id),
      plaid_transaction_id: tx.transaction_id,
      date: tx.date,
      authorized_date: tx.authorized_date,
      merchant_name: tx.merchant_name,
      name: tx.name,
      amount: tx.amount,
      currency_code: 'USD',
      primary_category: tx.category?.[0] || null,
      detailed_category: tx.category?.[1] || null,
      transaction_type: tx.amount > 0 ? 'debit' : 'credit',
      payment_channel: tx.payment_channel,
      pending: tx.pending,
      city: tx.location?.city,
      region: tx.location?.region,
      country: tx.location?.country,
    }))

    const { error } = await supabase
      .from('transactions')
      .upsert(transactionsToInsert, {
        onConflict: 'plaid_transaction_id',
      })

    if (error) {
      throw error
    }

    // Update account balances
    for (const account of data.accounts) {
      await supabase
        .from('linked_accounts')
        .update({
          current_balance: account.balances.current,
          available_balance: account.balances.available,
          last_synced_at: new Date().toISOString(),
        })
        .eq('plaid_account_id', account.account_id)
    }

    const duration = Date.now() - startTime

    // Log sync
    await supabase.from('transaction_sync_log').insert({
      user_id: item.user_id,
      sync_type: 'daily',
      status: 'success',
      transactions_added: transactionsToInsert.length,
      sync_duration_ms: duration,
    })

    console.log(`   ✅ Synced ${transactionsToInsert.length} transactions in ${duration}ms`)

    return {
      item_id: item.plaid_item_id,
      status: 'success',
      transactions_added: transactionsToInsert.length,
      duration_ms: duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    // Log error
    await supabase.from('transaction_sync_log').insert({
      user_id: item.user_id,
      sync_type: 'daily',
      status: 'failed',
      error_message: error.message,
      sync_duration_ms: duration,
    })

    throw error
  }
}

/**
 * Calculate net worth for all users with linked accounts
 */
async function calculateAllNetWorth() {
  const { data: users } = await supabase
    .from('linked_accounts')
    .select('user_id')
    .eq('is_active', true)

  if (!users) return

  // Get unique user IDs
  const userIds = [...new Set(users.map(u => u.user_id))]

  console.log(`   Calculating for ${userIds.length} users`)

  for (const userId of userIds) {
    try {
      // Get user's accounts
      const { data: accounts } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (!accounts || accounts.length === 0) continue

      let totalAssets = 0
      let totalLiabilities = 0
      const breakdown = {
        checking: 0,
        savings: 0,
        investment: 0,
        creditCard: 0,
        loan: 0,
      }

      for (const account of accounts) {
        const balance = account.current_balance || 0

        if (account.account_type === 'depository') {
          totalAssets += balance
          if (account.account_subtype === 'checking') {
            breakdown.checking += balance
          } else if (account.account_subtype === 'savings') {
            breakdown.savings += balance
          }
        } else if (account.account_type === 'investment') {
          totalAssets += balance
          breakdown.investment += balance
        } else if (account.account_type === 'credit') {
          totalLiabilities += Math.abs(balance)
          breakdown.creditCard += Math.abs(balance)
        } else if (account.account_type === 'loan') {
          totalLiabilities += Math.abs(balance)
          breakdown.loan += Math.abs(balance)
        }
      }

      const netWorth = totalAssets - totalLiabilities

      // Store snapshot
      await supabase.from('net_worth_snapshots').upsert(
        {
          user_id: userId,
          snapshot_date: getToday(),
          net_worth: netWorth,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          checking_balance: breakdown.checking,
          savings_balance: breakdown.savings,
          investment_balance: breakdown.investment,
          credit_card_balance: breakdown.creditCard,
          loan_balance: breakdown.loan,
          account_count: accounts.length,
        },
        { onConflict: 'user_id,snapshot_date' }
      )
    } catch (error) {
      console.error(`Error calculating net worth for user ${userId}:`, error)
    }
  }

  console.log(`   ✅ Net worth calculated for ${userIds.length} users`)
}

/**
 * Helper: Get date N days ago in YYYY-MM-DD format
 */
function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

/**
 * Helper: Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0]
}



