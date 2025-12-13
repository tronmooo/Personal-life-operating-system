'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

// Types
export type ProviderCategory = 'insurance' | 'utilities' | 'telecom' | 'financial' | 'subscriptions' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type DocumentType = 'contract' | 'policy' | 'bill' | 'receipt' | 'other'

export interface ServiceProvider {
  id: string
  user_id: string
  provider_name: string
  category: ProviderCategory
  subcategory: string | null
  account_number: string | null
  phone: string | null
  website: string | null
  monthly_amount: number
  billing_day: number | null
  auto_pay_enabled: boolean
  status: 'active' | 'inactive' | 'cancelled'
  icon_color: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ServicePayment {
  id: string
  provider_id: string
  user_id: string
  amount: number
  due_date: string
  status: PaymentStatus
  paid_date: string | null
  notes: string | null
  transaction_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  provider_name?: string
  category?: ProviderCategory
  subcategory?: string
}

export interface ServiceDocument {
  id: string
  provider_id: string
  user_id: string
  document_name: string
  document_type: DocumentType
  file_url: string | null
  file_name: string | null
  file_size: number | null
  upload_date: string
  expiry_date: string | null
  created_at: string
  // Joined fields
  provider_name?: string
  category?: ProviderCategory
}

export interface ProviderAnalytics {
  monthly_total: number
  active_providers: number
  pending_payments: number
  expiring_soon: number
  spending_by_category: {
    category: ProviderCategory
    count: number
    amount: number
  }[]
  upcoming_payments: ServicePayment[]
}

export interface CreateProviderInput {
  provider_name: string
  category: ProviderCategory
  subcategory?: string
  account_number?: string
  phone?: string
  website?: string
  monthly_amount: number
  billing_day?: number
  auto_pay_enabled?: boolean
  notes?: string
}

export interface CreatePaymentInput {
  provider_id: string
  amount: number
  due_date: string
  status?: PaymentStatus
  notes?: string
}

export interface CreateDocumentInput {
  provider_id: string
  document_name: string
  document_type: DocumentType
  file_url?: string
  file_name?: string
  file_size?: number
  expiry_date?: string
}

export function useServiceProviders() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [documents, setDocuments] = useState<ServiceDocument[]>([])
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  // Fetch all providers
  const fetchProviders = useCallback(async () => {
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('provider_name')

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }, [supabase])

  // Fetch all payments with provider info
  const fetchPayments = useCallback(async () => {
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('service_payments')
        .select(`
          *,
          service_providers!inner (
            provider_name,
            category,
            subcategory
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      
      // Flatten the joined data
      const flatPayments = (data || []).map((p: any) => ({
        ...p,
        provider_name: p.service_providers?.provider_name,
        category: p.service_providers?.category,
        subcategory: p.service_providers?.subcategory,
      }))
      
      setPayments(flatPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }, [supabase])

  // Fetch all documents with provider info
  const fetchDocuments = useCallback(async () => {
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('service_documents')
        .select(`
          *,
          service_providers!inner (
            provider_name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false })

      if (error) throw error
      
      // Flatten the joined data
      const flatDocs = (data || []).map((d: any) => ({
        ...d,
        provider_name: d.service_providers?.provider_name,
        category: d.service_providers?.category,
      }))
      
      setDocuments(flatDocs)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }, [supabase])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!supabase) return
    
    setAnalyticsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get active providers
      const { data: providerData } = await supabase
        .from('service_providers')
        .select('id, category, monthly_amount')
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Get pending payments
      const { data: pendingPayments } = await supabase
        .from('service_payments')
        .select(`
          *,
          service_providers!inner (
            provider_name,
            category,
            subcategory
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date')

      // Get expiring documents count
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { count: expiringCount } = await supabase
        .from('service_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])

      // Calculate analytics
      const activeProviders = providerData || []
      const monthlyTotal = activeProviders.reduce((sum, p) => sum + (p.monthly_amount || 0), 0)
      
      // Group by category
      const categoryMap = new Map<ProviderCategory, { count: number; amount: number }>()
      activeProviders.forEach((p: any) => {
        const existing = categoryMap.get(p.category as ProviderCategory) || { count: 0, amount: 0 }
        categoryMap.set(p.category as ProviderCategory, {
          count: existing.count + 1,
          amount: existing.amount + (p.monthly_amount || 0)
        })
      })

      const spendingByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data
      })).sort((a, b) => b.amount - a.amount)

      // Format upcoming payments
      const upcomingPayments = (pendingPayments || []).map((p: any) => ({
        ...p,
        provider_name: p.service_providers?.provider_name,
        category: p.service_providers?.category,
        subcategory: p.service_providers?.subcategory,
      }))

      setAnalytics({
        monthly_total: monthlyTotal,
        active_providers: activeProviders.length,
        pending_payments: (pendingPayments || []).length,
        expiring_soon: expiringCount || 0,
        spending_by_category: spendingByCategory,
        upcoming_payments: upcomingPayments
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [supabase])

  // Create provider
  const createProvider = useCallback(async (input: CreateProviderInput) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to add service providers', {
          action: {
            label: 'Sign In',
            onClick: () => window.location.href = '/auth/signin'
          }
        })
        throw new Error('Please sign in to add service providers')
      }

      const { data, error } = await supabase
        .from('service_providers')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single()

      if (error) throw error

      // If billing_day is set, create initial payment
      if (input.billing_day && input.monthly_amount > 0) {
        const today = new Date()
        const nextDue = new Date(today.getFullYear(), today.getMonth(), input.billing_day)
        if (nextDue < today) {
          nextDue.setMonth(nextDue.getMonth() + 1)
        }

        await supabase.from('service_payments').insert({
          user_id: user.id,
          provider_id: data.id,
          amount: input.monthly_amount,
          due_date: nextDue.toISOString().split('T')[0],
          status: 'pending'
        })
      }

      toast.success(`${input.provider_name} added successfully`)
      await fetchProviders()
      await fetchPayments()
      await fetchAnalytics()
      
      return data
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to add provider'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchProviders, fetchPayments, fetchAnalytics])

  // Update provider
  const updateProvider = useCallback(async (id: string, updates: Partial<CreateProviderInput>) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { error } = await supabase
        .from('service_providers')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast.success('Provider updated')
      await fetchProviders()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to update provider'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchProviders, fetchAnalytics])

  // Delete provider
  const deleteProvider = useCallback(async (id: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Provider deleted')
      await fetchProviders()
      await fetchPayments()
      await fetchDocuments()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to delete provider'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchProviders, fetchPayments, fetchDocuments, fetchAnalytics])

  // Create payment
  const createPayment = useCallback(async (input: CreatePaymentInput) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to add payments', {
          action: { label: 'Sign In', onClick: () => window.location.href = '/auth/signin' }
        })
        throw new Error('Please sign in to add payments')
      }

      const { error } = await supabase
        .from('service_payments')
        .insert({
          user_id: user.id,
          ...input
        })

      if (error) throw error

      toast.success('Payment added')
      await fetchPayments()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to add payment'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchPayments, fetchAnalytics])

  // Mark payment as paid
  const markPaymentPaid = useCallback(async (paymentId: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { error } = await supabase
        .from('service_payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Payment marked as paid')
      await fetchPayments()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to update payment'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchPayments, fetchAnalytics])

  // Create document
  const createDocument = useCallback(async (input: CreateDocumentInput) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to upload documents', {
          action: { label: 'Sign In', onClick: () => window.location.href = '/auth/signin' }
        })
        throw new Error('Please sign in to upload documents')
      }

      const { error } = await supabase
        .from('service_documents')
        .insert({
          user_id: user.id,
          ...input
        })

      if (error) throw error

      toast.success('Document added')
      await fetchDocuments()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to add document'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchDocuments, fetchAnalytics])

  // Delete document
  const deleteDocument = useCallback(async (id: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { error } = await supabase
        .from('service_documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Document deleted')
      await fetchDocuments()
      await fetchAnalytics()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to delete document'
      toast.error(errMsg)
      throw error
    }
  }, [supabase, fetchDocuments, fetchAnalytics])

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        fetchProviders(),
        fetchPayments(),
        fetchDocuments(),
        fetchAnalytics()
      ])
      setLoading(false)
    }
    loadAll()
  }, [fetchProviders, fetchPayments, fetchDocuments, fetchAnalytics])

  return {
    // Data
    providers,
    payments,
    documents,
    analytics,
    
    // Loading states
    loading,
    analyticsLoading,
    
    // Provider operations
    createProvider,
    updateProvider,
    deleteProvider,
    
    // Payment operations
    createPayment,
    markPaymentPaid,
    
    // Document operations
    createDocument,
    deleteDocument,
    
    // Refresh
    refresh: async () => {
      await Promise.all([
        fetchProviders(),
        fetchPayments(),
        fetchDocuments(),
        fetchAnalytics()
      ])
    }
  }
}
