import { useCallback, useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface TransactionInput {
  date: string
  name: string
  amount: number
  merchant_name?: string | null
  user_category?: string | null
  notes?: string | null
  currency_code?: string
  transaction_type?: 'debit' | 'credit' | 'transfer'
}

export interface TransactionRow extends TransactionInput { id: string }

export function useTransactions() {
  const supabase = createClientComponentClient()
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('⚠️ Not authenticated, cannot load transactions')
        setTransactions([])
        return
      }
      
      console.log(`📊 Fetching transactions for user: ${user.id}`)
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, name, amount, merchant_name, user_category, currency_code, transaction_type, detailed_category, notes')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error
      
      console.log(`✅ Loaded ${data?.length || 0} transactions`)
      
      setTransactions((data || []).map((t: any) => ({
        id: t.id,
        date: t.date,
        name: t.name,
        amount: Number(t.amount),
        merchant_name: t.merchant_name || null,
        user_category: t.user_category || null,
        notes: t.notes || null,
        currency_code: t.currency_code || 'USD',
        transaction_type: (t.transaction_type || 'debit') as 'debit' | 'credit' | 'transfer',
      })))
    } catch (err: any) {
      console.error('❌ Failed to load transactions:', err)
      setError(err.message || 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  // 🔄 REALTIME SUBSCRIPTION: Listen for changes to sync all hook instances
  useEffect(() => {
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('🔄 [USE-TRANSACTIONS] Realtime change detected:', payload.eventType)
          // Refetch data to ensure all components stay in sync
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, load])

  const add = useCallback(async (input: TransactionInput) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          date: input.date,
          name: input.name,
          amount: input.amount,
          merchant_name: input.merchant_name ?? null,
          user_category: input.user_category ?? null,
          notes: input.notes ?? null,
          currency_code: input.currency_code ?? 'USD',
          transaction_type: input.transaction_type ?? 'debit',
        })
        .select('id, date, name, amount, merchant_name, user_category, notes, currency_code, transaction_type')
        .single()
      if (error) throw error
      const newTransaction: TransactionRow = {
        id: data.id,
        date: data.date,
        name: data.name,
        amount: Number(data.amount),
        merchant_name: data.merchant_name || null,
        user_category: data.user_category || null,
        notes: data.notes || null,
        currency_code: data.currency_code || 'USD',
        transaction_type: (data.transaction_type || 'debit') as 'debit' | 'credit' | 'transfer',
      }
      setTransactions(prev => [newTransaction, ...prev])
      return newTransaction
    } catch (err: any) {
      console.error('Failed to add transaction:', err)
      setError(err.message || 'Failed to add transaction')
      throw err
    }
  }, [supabase])

  return { transactions, loading, error, reload: load, add }
}









