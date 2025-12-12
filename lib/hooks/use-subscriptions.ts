import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getDemoAnalytics, getDemoSubscriptions } from '@/lib/demo/subscriptions-demo'

export interface Subscription {
  id: string
  user_id: string
  service_name: string
  category: string
  cost: number
  currency: string
  frequency: string
  status: string
  next_due_date: string
  start_date?: string
  trial_end_date?: string
  cancellation_date?: string
  payment_method?: string
  last_four?: string
  account_url?: string
  account_email?: string
  auto_renew: boolean
  reminder_enabled: boolean
  reminder_days_before: number
  icon_color?: string
  icon_letter?: string
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface SubscriptionAnalytics {
  summary: {
    monthly_total: number
    daily_total: number
    weekly_total: number
    yearly_total: number
    total_subscriptions: number
    active_count: number
    trial_count: number
    paused_count: number
    cancelled_count: number
  }
  category_breakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  upcoming_renewals: Array<Subscription & { days_until_due: number; monthly_cost: number }>
  due_this_week: Array<Subscription & { days_until_due: number; monthly_cost: number }>
  monthly_trend: Array<{ month: string; amount: number }>
  old_subscriptions: Array<Subscription & { monthly_cost: number; age_in_years: number }>
}

interface UseSubscriptionsOptions {
  status?: string
  category?: string
  search?: string
}

export function useSubscriptions(options: UseSubscriptionsOptions = {}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (options.status) params.append('status', options.status)
      if (options.category) params.append('category', options.category)
      if (options.search) params.append('search', options.search)

      const response = await fetch(`/api/subscriptions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }

      const data = await response.json()

      if (data.subscriptions && data.subscriptions.length > 0) {
        setSubscriptions(data.subscriptions)
        setIsDemo(false)
      } else {
        // Fallback to demo data when no real data is returned
        const demoSubs = getDemoSubscriptions()
        setSubscriptions(demoSubs)
        setAnalytics(getDemoAnalytics(demoSubs))
        setIsDemo(true)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Failed to load subscriptions. Showing demo data.')
      const demoSubs = getDemoSubscriptions()
      setSubscriptions(demoSubs)
      setAnalytics(getDemoAnalytics(demoSubs))
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [options.status, options.category, options.search])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch('/api/subscriptions/analytics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
      setIsDemo(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // If we are already in demo mode, keep demo analytics
      if (!isDemo) {
        toast.error('Failed to load analytics. Showing demo data.')
        const demoSubs = subscriptions.length ? subscriptions : getDemoSubscriptions()
        setAnalytics(getDemoAnalytics(demoSubs))
        setIsDemo(true)
      }
    } finally {
      setAnalyticsLoading(false)
    }
  }, [isDemo, subscriptions])

  // Create subscription
  const createSubscription = async (data: Partial<Subscription>) => {
    if (isDemo) {
      toast.info('Demo data only. Connect to Supabase to save subscriptions.')
      return null
    }
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const result = await response.json()
      toast.success('Subscription added successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
      
      return result.subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error('Failed to add subscription')
      throw error
    }
  }

  // Update subscription
  const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    if (isDemo) {
      toast.info('Demo data only. Connect to Supabase to save subscriptions.')
      return null
    }
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const result = await response.json()
      toast.success('Subscription updated successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
      
      return result.subscription
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast.error('Failed to update subscription')
      throw error
    }
  }

  // Delete subscription
  const deleteSubscription = async (id: string) => {
    if (isDemo) {
      toast.info('Demo data only. Connect to Supabase to delete subscriptions.')
      return
    }
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete subscription')
      }

      toast.success('Subscription deleted successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error('Failed to delete subscription')
      throw error
    }
  }

  // Initial load
  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    subscriptions,
    analytics,
    loading,
    analyticsLoading,
    isDemo,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    refresh: () => Promise.all([fetchSubscriptions(), fetchAnalytics()])
  }
}


