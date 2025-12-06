import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, createHash, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'

const PLAID_CLIENT_ID = process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'
const PLAID_WEBHOOK_VERIFICATION_KEY = process.env.PLAID_WEBHOOK_VERIFICATION_KEY || ''

// Use service role key for webhook (bypasses RLS)
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
 * Verify Plaid webhook signature
 * Plaid signs webhooks with JWT - validate the signature
 */
function verifyPlaidSignature(requestBody: string, signedJwt: string): boolean {
  try {
    // If no verification key is configured, log warning but allow (for development)
    if (!PLAID_WEBHOOK_VERIFICATION_KEY) {
      console.warn('⚠️  WARNING: PLAID_WEBHOOK_VERIFICATION_KEY not set - webhook signature verification disabled')
      console.warn('⚠️  This is a SECURITY RISK in production!')
      return true // Allow in development, but log warning
    }

    // Parse JWT header and payload
    const [headerB64, payloadB64, signatureB64] = signedJwt.split('.')
    
    // Verify signature using PLAID_WEBHOOK_VERIFICATION_KEY
    const message = `${headerB64}.${payloadB64}`
    const expectedSignature = createHmac('sha256', PLAID_WEBHOOK_VERIFICATION_KEY)
      .update(message)
      .digest('base64url')
    
    if (signatureB64 !== expectedSignature) {
      console.error('❌ Invalid Plaid webhook signature')
      return false
    }

    // Verify payload matches request body
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    const bodyHash = createHash('sha256').update(requestBody).digest('hex')
    
    if (payload.request_body_sha256 !== bodyHash) {
      console.error('❌ Webhook body hash mismatch')
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error)
    return false
  }
}

/**
 * POST /api/plaid/webhook
 * Handle Plaid webhook events for automatic transaction updates
 * 
 * Webhook types:
 * - TRANSACTIONS: New, modified, or removed transactions
 * - ITEM: Item errors, pending expiration
 * - AUTH: Account ownership verification
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signedJwt = request.headers.get('plaid-verification') || ''

    // 🚨 SECURITY: Verify webhook signature
    if (!verifyPlaidSignature(rawBody, signedJwt)) {
      console.error('❌ Unauthorized webhook request - invalid signature')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const webhook = JSON.parse(rawBody)
    const { webhook_type, webhook_code, item_id } = webhook

    console.log(`📨 Plaid webhook received: ${webhook_type} - ${webhook_code}`)
    console.log('   ✅ Signature verified')

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhook)
        break
      
      case 'ITEM':
        await handleItemWebhook(webhook)
        break
      
      case 'AUTH':
        console.log('Auth webhook received:', webhook)
        break
      
      default:
        console.log('Unhandled webhook type:', webhook_type)
    }

    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Handle TRANSACTIONS webhooks
 */
async function handleTransactionsWebhook(webhook: any) {
  const { webhook_code, item_id, new_transactions, removed_transactions } = webhook

  // Get the Plaid item and user
  const { data: plaidItem } = await supabase
    .from('plaid_items')
    .select('*')
    .eq('plaid_item_id', item_id)
    .single()

  if (!plaidItem) {
    console.error('Plaid item not found:', item_id)
    return
  }

  console.log(`   User: ${plaidItem.user_id}`)
  console.log(`   New transactions: ${new_transactions}`)
  console.log(`   Removed transactions: ${removed_transactions?.length || 0}`)

  switch (webhook_code) {
    case 'INITIAL_UPDATE':
    case 'HISTORICAL_UPDATE':
    case 'DEFAULT_UPDATE':
      // Fetch and store new transactions
      if (new_transactions > 0) {
        await syncTransactionsForItem(plaidItem)
      }
      break
    
    case 'TRANSACTIONS_REMOVED':
      // Remove deleted transactions
      if (removed_transactions && removed_transactions.length > 0) {
        await removeTransactions(removed_transactions)
      }
      break
    
    default:
      console.log('Unhandled transactions webhook code:', webhook_code)
  }
}

/**
 * Handle ITEM webhooks
 */
async function handleItemWebhook(webhook: any) {
  const { webhook_code, item_id, error } = webhook

  console.log(`   Item webhook code: ${webhook_code}`)

  switch (webhook_code) {
    case 'ERROR':
      // Item has an error (e.g., user needs to re-authenticate)
      await supabase
        .from('plaid_items')
        .update({
          is_active: false,
          error_code: error?.error_code,
          error_message: error?.error_message,
        })
        .eq('plaid_item_id', item_id)
      
      console.log(`   Item error: ${error?.error_message}`)
      break
    
    case 'PENDING_EXPIRATION':
      // User's consent is about to expire
      console.log('   Item consent expiring soon')
      break
    
    case 'USER_PERMISSION_REVOKED':
      // User revoked access
      await supabase
        .from('plaid_items')
        .update({ is_active: false })
        .eq('plaid_item_id', item_id)
      break
    
    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      console.log('   Webhook URL updated')
      break
    
    default:
      console.log('Unhandled item webhook code:', webhook_code)
  }
}

/**
 * Sync transactions for a Plaid item
 */
async function syncTransactionsForItem(plaidItem: any) {
  try {
    const startDate = getDateDaysAgo(90)
    const endDate = getToday()

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: plaidItem.plaid_access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset: 0,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`   Fetched ${data.transactions.length} transactions`)

    // Get linked accounts for this item
    const { data: linkedAccounts } = await supabase
      .from('linked_accounts')
      .select('id, plaid_account_id')
      .eq('plaid_item_id', plaidItem.plaid_item_id)

    if (!linkedAccounts || linkedAccounts.length === 0) {
      console.error('No linked accounts found for item:', plaidItem.plaid_item_id)
      return
    }

    // Create account ID map
    const accountMap = new Map(
      linkedAccounts.map(acc => [acc.plaid_account_id, acc.id])
    )

    // Store transactions
    const transactionsToInsert = data.transactions.map((tx: any) => ({
      user_id: plaidItem.user_id,
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
      console.error('Error storing transactions:', error)
    } else {
      console.log(`✅ Stored ${transactionsToInsert.length} transactions`)
    }

    // Log sync
    await supabase.from('transaction_sync_log').insert({
      user_id: plaidItem.user_id,
      sync_type: 'webhook',
      status: 'success',
      transactions_added: transactionsToInsert.length,
    })
  } catch (error: any) {
    console.error('Error syncing transactions:', error)
    
    await supabase.from('transaction_sync_log').insert({
      user_id: plaidItem.user_id,
      sync_type: 'webhook',
      status: 'failed',
      error_message: error.message,
    })
  }
}

/**
 * Remove deleted transactions
 */
async function removeTransactions(transactionIds: string[]) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('plaid_transaction_id', transactionIds)

  if (error) {
    console.error('Error removing transactions:', error)
  } else {
    console.log(`✅ Removed ${transactionIds.length} transactions`)
  }
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



