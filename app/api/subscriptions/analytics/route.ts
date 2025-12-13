import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper function to calculate monthly cost
function calculateMonthlyCost(cost: number, frequency: string): number {
  switch (frequency) {
    case 'monthly':
      return cost
    case 'yearly':
      return cost / 12
    case 'quarterly':
      return cost / 3
    case 'weekly':
      return cost * 4.33
    case 'daily':
      return cost * 30
    default:
      return cost
  }
}

// GET - Fetch subscription analytics
export async function GET(_request: NextRequest) {
  try {
    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] GET request started')
    // #endregion
    
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] Auth result:', { hasUser: !!user, userId: user?.id, authError: authError?.message || null })
    // #endregion

    if (authError || !user) {
      // #region agent log
      console.log('📊 [SUBSCRIPTIONS/ANALYTICS] Returning 401 - auth failed')
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch subscriptions from dedicated subscriptions table
    const { data: subscriptionsTable, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] Query result from subscriptions table:', { count: subscriptionsTable?.length || 0, subsError: subsError?.message || null, firstFew: subscriptionsTable?.slice(0, 3).map(s => ({ id: s.id, name: s.service_name, cost: s.cost })) })
    // #endregion

    // 🔧 FIX: Also fetch subscriptions from domain_entries table (where SubscriptionsTab stores data)
    const { data: digitalDomainEntries, error: deError } = await supabase
      .from('domain_entries')
      .select('id, title, metadata, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('domain', 'digital')
    
    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] domain_entries with domain=digital:', { 
      count: digitalDomainEntries?.length || 0, 
      error: deError?.message || null,
      entries: digitalDomainEntries?.slice(0, 5).map(e => {
        const meta = e.metadata?.metadata ?? e.metadata ?? {}
        return { id: e.id, title: e.title, type: meta.type, monthlyCost: meta.monthlyCost, hasNestedMeta: !!e.metadata?.metadata }
      })
    })
    // #endregion

    if (subsError && deError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 })
    }

    // 🔧 FIX: Convert domain_entries subscriptions to match subscriptions table format
    // Handle nested metadata structure (metadata.metadata) if present
    const domainEntrySubs = (digitalDomainEntries || [])
      .filter(e => {
        const meta = e.metadata?.metadata ?? e.metadata ?? {}
        return meta.type === 'subscription'
      })
      .map(e => {
        // Handle nested metadata structure
        const meta = e.metadata?.metadata ?? e.metadata ?? {}
        // Map billing cycle to frequency
        const billingCycle = (meta.billingCycle || 'Monthly').toLowerCase()
        let frequency = 'monthly'
        if (billingCycle.includes('year') || billingCycle.includes('annual')) frequency = 'yearly'
        else if (billingCycle.includes('quarter')) frequency = 'quarterly'
        else if (billingCycle.includes('week')) frequency = 'weekly'
        
        // Map status
        const statusRaw = (meta.status || 'Active').toLowerCase()
        let status = 'active'
        if (statusRaw.includes('cancel')) status = 'cancelled'
        else if (statusRaw.includes('trial')) status = 'trial'
        else if (statusRaw.includes('pause')) status = 'paused'

        return {
          id: e.id,
          user_id: user.id,
          service_name: meta.serviceName || e.title || 'Unknown',
          category: meta.category || 'other',
          cost: parseFloat(String(meta.monthlyCost || meta.cost || 0)),
          currency: 'USD',
          frequency,
          status,
          next_due_date: meta.renewalDate || meta.nextBilling || null,
          start_date: e.created_at,
          auto_renew: true,
          reminder_enabled: true,
          reminder_days_before: 3,
          icon_color: meta.iconColor || null,
          icon_letter: (meta.serviceName || e.title || 'S').charAt(0).toUpperCase(),
          created_at: e.created_at,
          updated_at: e.updated_at,
          _source: 'domain_entries' // Track source for debugging
        }
      })

    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] Converted domain_entries subscriptions:', { 
      count: domainEntrySubs.length,
      subs: domainEntrySubs.map(s => ({ name: s.service_name, cost: s.cost, status: s.status }))
    })
    // #endregion

    // 🔧 FIX: Merge both sources, avoiding duplicates by service name
    const subscriptionsTableList = subscriptionsTable || []
    const existingNames = new Set(subscriptionsTableList.map(s => s.service_name?.toLowerCase()))
    const uniqueDomainEntrySubs = domainEntrySubs.filter(s => !existingNames.has(s.service_name?.toLowerCase()))
    
    const subscriptions = [...subscriptionsTableList, ...uniqueDomainEntrySubs]
    
    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] MERGED subscriptions:', { 
      fromTable: subscriptionsTableList.length,
      fromDomainEntries: uniqueDomainEntrySubs.length,
      total: subscriptions.length
    })
    // #endregion

    const activeSubscriptions = subscriptions.filter(
      s => s.status === 'active' || s.status === 'trial'
    )

    // Calculate totals
    let monthlyTotal = 0
    const categoryBreakdown: Record<string, number> = {}

    activeSubscriptions.forEach(sub => {
      const monthlyCost = calculateMonthlyCost(sub.cost, sub.frequency)
      monthlyTotal += monthlyCost

      if (!categoryBreakdown[sub.category]) {
        categoryBreakdown[sub.category] = 0
      }
      categoryBreakdown[sub.category] += monthlyCost
    })

    const dailyTotal = monthlyTotal / 30
    const weeklyTotal = monthlyTotal * 4.33 / 4
    const yearlyTotal = monthlyTotal * 12

    // Count by status
    const statusCounts = {
      active: subscriptions?.filter(s => s.status === 'active').length || 0,
      trial: subscriptions?.filter(s => s.status === 'trial').length || 0,
      paused: subscriptions?.filter(s => s.status === 'paused').length || 0,
      cancelled: subscriptions?.filter(s => s.status === 'cancelled').length || 0,
    }

    // Upcoming renewals (next 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const upcomingRenewals = activeSubscriptions
      .filter(sub => {
        const dueDate = new Date(sub.next_due_date)
        return dueDate >= today && dueDate <= thirtyDaysFromNow
      })
      .map(sub => ({
        ...sub,
        days_until_due: Math.ceil(
          (new Date(sub.next_due_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        ),
        monthly_cost: calculateMonthlyCost(sub.cost, sub.frequency)
      }))
      .sort((a, b) => a.days_until_due - b.days_until_due)

    // Due this week (next 7 days)
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dueThisWeek = upcomingRenewals.filter(sub => {
      const dueDate = new Date(sub.next_due_date)
      return dueDate <= sevenDaysFromNow
    })

    // Monthly spending trend (last 6 months)
    const monthlyTrend: Array<{ month: string; amount: number }> = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleString('default', { month: 'short' })
      monthlyTrend.push({
        month: monthName,
        amount: monthlyTotal // Simplified - in production, track historical data
      })
    }

    // Old subscriptions to review (started > 2 years ago)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    
    const oldSubscriptions = activeSubscriptions
      .filter(sub => {
        const startDate = new Date(sub.start_date || sub.created_at)
        return startDate <= twoYearsAgo
      })
      .map(sub => ({
        ...sub,
        monthly_cost: calculateMonthlyCost(sub.cost, sub.frequency),
        age_in_years: Math.floor(
          (today.getTime() - new Date(sub.start_date || sub.created_at).getTime()) / 
          (365 * 24 * 60 * 60 * 1000)
        )
      }))
      .sort((a, b) => b.monthly_cost - a.monthly_cost)

    // #region agent log
    console.log('📊 [SUBSCRIPTIONS/ANALYTICS] Success - computed analytics for', subscriptions?.length || 0, 'subscriptions, monthlyTotal:', monthlyTotal)
    // #endregion

    return NextResponse.json({
      summary: {
        monthly_total: monthlyTotal || 0,
        daily_total: dailyTotal || 0,
        weekly_total: weeklyTotal || 0,
        yearly_total: yearlyTotal || 0,
        total_subscriptions: subscriptions?.length || 0,
        active_count: statusCounts.active,
        trial_count: statusCounts.trial,
        paused_count: statusCounts.paused,
        cancelled_count: statusCounts.cancelled,
      },
      category_breakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({
        category,
        amount,
        percentage: monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0
      })).sort((a, b) => b.amount - a.amount),
      upcoming_renewals: upcomingRenewals,
      due_this_week: dueThisWeek,
      monthly_trend: monthlyTrend,
      old_subscriptions: oldSubscriptions,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
