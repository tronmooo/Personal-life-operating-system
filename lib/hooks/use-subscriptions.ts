import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

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

// Empty analytics for when there's no data
const getEmptyAnalytics = (): SubscriptionAnalytics => ({
  summary: {
    monthly_total: 0,
    daily_total: 0,
    weekly_total: 0,
    yearly_total: 0,
    total_subscriptions: 0,
    active_count: 0,
    trial_count: 0,
    paused_count: 0,
    cancelled_count: 0,
  },
  category_breakdown: [],
  upcoming_renewals: [],
  due_this_week: [],
  monthly_trend: [],
  old_subscriptions: [],
})

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

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (options.status) params.append('status', options.status)
      if (options.category) params.append('category', options.category)
      if (options.search) params.append('search', options.search)

      const response = await fetch(`/api/subscriptions?${params}`)
      
      // Handle unauthorized - silently return empty for guests
      if (response.status === 401) {
        setSubscriptions([])
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }

      const data = await response.json()
      // Set real data (even if empty array)
      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Failed to load subscriptions')
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [options.status, options.category, options.search])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch('/api/subscriptions/analytics')
      
      // Handle unauthorized - silently return empty for guests
      if (response.status === 401) {
        setAnalytics(getEmptyAnalytics())
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
      // Set empty analytics instead of demo data
      setAnalytics(getEmptyAnalytics())
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Create subscription
  const createSubscription = async (data: Partial<Subscription>) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      const result = await response.json()
      toast.success('Subscription added successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
      
      return result.subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add subscription')
      throw error
    }
  }

  // Update subscription
  const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update subscription')
      }

      const result = await response.json()
      toast.success('Subscription updated successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
      
      return result.subscription
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription')
      throw error
    }
  }

  // Delete subscription
  const deleteSubscription = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete subscription')
      }

      toast.success('Subscription deleted successfully')
      
      // Refresh data
      await Promise.all([fetchSubscriptions(), fetchAnalytics()])
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete subscription')
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
    createSubscription,
    updateSubscription,
    deleteSubscription,
    refresh: () => Promise.all([fetchSubscriptions(), fetchAnalytics()])
  }
}



