/**
 * Plaid Banking Integration Library
 * Handles all Plaid API interactions for bank account and transaction syncing
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'
const PLAID_CLIENT_ID = process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''

export interface PlaidAccount {
  account_id: string
  name: string
  mask: string
  type: string
  subtype: string
  balances: {
    available: number | null
    current: number | null
    limit: number | null
    currency: string
  }
}

export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  authorized_date: string | null
  name: string
  merchant_name: string | null
  pending: boolean
  category: string[]
  category_id: string | null
  payment_channel: string
  location: {
    city: string | null
    region: string | null
    country: string | null
  }
}

export interface LinkedAccount {
  id: string
  user_id: string
  plaid_item_id: string
  plaid_account_id: string
  institution_name: string
  account_name: string
  account_type: string
  account_subtype: string
  account_mask: string
  current_balance: number
  available_balance: number
  is_active: boolean
  last_synced_at: string
}

export class PlaidBankingService {
  private supabase = createClientComponentClient()

  /**
   * Create a Link token for Plaid Link initialization
   */
  async createLinkToken(userId: string): Promise<{ link_token: string; expiration: string }> {
    const response = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to create link token')
    }

    return {
      link_token: data.link_token,
      expiration: data.expiration,
    }
  }

  /**
   * Exchange public token for access token after successful Plaid Link
   */
  async exchangePublicToken(
    publicToken: string,
    metadata: any
  ): Promise<{
    access_token: string
    item_id: string
    accounts: PlaidAccount[]
  }> {
    const response = await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token: publicToken, metadata }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to exchange token')
    }

    return {
      access_token: data.access_token,
      item_id: data.item_id,
      accounts: data.accounts || [],
    }
  }

  /**
   * Store linked accounts in database
   */
  async storeLinkedAccounts(
    userId: string,
    itemId: string,
    accessToken: string,
    institutionName: string,
    accounts: PlaidAccount[]
  ): Promise<void> {
    // Note: Access token encryption is now handled server-side in /api/plaid/exchange-token
    // This method is deprecated - use the API route instead
    const accountsToInsert = accounts.map((account) => ({
      user_id: userId,
      plaid_item_id: itemId,
      plaid_account_id: account.account_id,
      plaid_access_token: accessToken, // Encrypted by API route before storage
      institution_name: institutionName,
      account_name: account.name,
      account_type: account.type,
      account_subtype: account.subtype || '',
      account_mask: account.mask || '',
      current_balance: account.balances.current || 0,
      available_balance: account.balances.available || 0,
      currency_code: account.balances.currency || 'USD',
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }))

    // Insert accounts
    const { error } = await this.supabase
      .from('linked_accounts')
      .upsert(accountsToInsert, {
        onConflict: 'plaid_item_id,plaid_account_id',
      })

    if (error) {
      console.error('Error storing linked accounts:', error)
      throw new Error('Failed to store linked accounts')
    }

    // Store Plaid item
    await this.supabase.from('plaid_items').upsert({
      user_id: userId,
      plaid_item_id: itemId,
      plaid_access_token: accessToken,
      institution_name: institutionName,
      is_active: true,
    }, {
      onConflict: 'plaid_item_id'
    })

    console.log(`✅ Stored ${accounts.length} linked accounts`)
  }

  /**
   * Get user's linked accounts
   */
  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const { data, error } = await this.supabase
      .from('linked_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching linked accounts:', error)
      return []
    }

    return data || []
  }

  /**
   * Update account balances
   */
  async updateAccountBalances(accounts: Array<{
    account_id: string
    current: number
    available: number
  }>): Promise<void> {
    for (const account of accounts) {
      await this.supabase
        .from('linked_accounts')
        .update({
          current_balance: account.current,
          available_balance: account.available,
          last_synced_at: new Date().toISOString(),
        })
        .eq('plaid_account_id', account.account_id)
    }
  }

  /**
   * Sync transactions for an account
   * @param userId - User ID
   * @param accountId - Account ID (unused, kept for backwards compatibility)
   * @param itemIdOrAccessToken - Plaid item ID (preferred) or encrypted access token
   * @param startDate - Start date for transactions
   * @param endDate - End date for transactions
   */
  async syncTransactions(
    userId: string,
    accountId: string,
    itemIdOrAccessToken: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ added: number; modified: number; removed: number }> {
    // Prefer sending item_id so server can fetch and decrypt the token
    const requestBody: any = {
      start_date: startDate || this.getDateDaysAgo(90),
      end_date: endDate || this.getToday(),
    }

    // Check if it's an item_id (starts with 'item-') or an access token
    if (itemIdOrAccessToken.startsWith('item-')) {
      requestBody.item_id = itemIdOrAccessToken
    } else {
      requestBody.access_token = itemIdOrAccessToken
    }

    const response = await fetch('/api/plaid/sync-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to sync transactions')
    }

    // Store transactions
    if (data.transactions && data.transactions.length > 0) {
      await this.storeTransactions(userId, accountId, data.transactions)
    }

    // Remove deleted transactions
    if (data.removed && data.removed.length > 0) {
      await this.removeTransactions(data.removed)
    }

    return {
      added: data.transactions?.length || 0,
      modified: data.modified?.length || 0,
      removed: data.removed?.length || 0,
    }
  }

  /**
   * Store transactions in database
   */
  private async storeTransactions(
    userId: string,
    accountId: string,
    transactions: PlaidTransaction[]
  ): Promise<void> {
    const transactionsToInsert = transactions.map((tx) => ({
      user_id: userId,
      account_id: accountId,
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

    const { error } = await this.supabase
      .from('transactions')
      .upsert(transactionsToInsert, {
        onConflict: 'plaid_transaction_id',
      })

    if (error) {
      console.error('Error storing transactions:', error)
      throw new Error('Failed to store transactions')
    }

    console.log(`✅ Stored ${transactions.length} transactions`)
  }

  /**
   * Remove deleted transactions
   */
  private async removeTransactions(transactionIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .in('plaid_transaction_id', transactionIds)

    if (error) {
      console.error('Error removing transactions:', error)
    }
  }

  /**
   * Get user's transactions
   */
  async getTransactions(
    userId: string,
    options: {
      accountId?: string
      startDate?: string
      endDate?: string
      limit?: number
    } = {}
  ): Promise<any[]> {
    let query = this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (options.accountId) {
      query = query.eq('account_id', options.accountId)
    }

    if (options.startDate) {
      query = query.gte('date', options.startDate)
    }

    if (options.endDate) {
      query = query.lte('date', options.endDate)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }

    return data || []
  }

  /**
   * Calculate net worth from all linked accounts
   */
  async calculateNetWorth(userId: string): Promise<{
    netWorth: number
    totalAssets: number
    totalLiabilities: number
    breakdown: any
  }> {
    const accounts = await this.getLinkedAccounts(userId)

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
    await this.storeNetWorthSnapshot(userId, {
      netWorth,
      totalAssets,
      totalLiabilities,
      breakdown,
      accountCount: accounts.length,
    })

    return { netWorth, totalAssets, totalLiabilities, breakdown }
  }

  /**
   * Store net worth snapshot
   */
  private async storeNetWorthSnapshot(
    userId: string,
    data: {
      netWorth: number
      totalAssets: number
      totalLiabilities: number
      breakdown: any
      accountCount: number
    }
  ): Promise<void> {
    await this.supabase.from('net_worth_snapshots').upsert(
      {
        user_id: userId,
        snapshot_date: this.getToday(),
        net_worth: data.netWorth,
        total_assets: data.totalAssets,
        total_liabilities: data.totalLiabilities,
        checking_balance: data.breakdown.checking,
        savings_balance: data.breakdown.savings,
        investment_balance: data.breakdown.investment,
        credit_card_balance: data.breakdown.creditCard,
        loan_balance: data.breakdown.loan,
        account_count: data.accountCount,
      },
      { onConflict: 'user_id,snapshot_date' }
    )
  }

  /**
   * Disconnect (deactivate) a linked account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('linked_accounts')
      .update({ is_active: false })
      .eq('id', accountId)

    if (error) {
      throw new Error('Failed to disconnect account')
    }
  }

  /**
   * Helper: Get date N days ago in YYYY-MM-DD format
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  /**
   * Helper: Get today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Singleton instance
 */
export const plaidBankingService = new PlaidBankingService()



