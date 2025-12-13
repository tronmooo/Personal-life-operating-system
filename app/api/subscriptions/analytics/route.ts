import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/analytics/route.ts:GET:start',message:'Analytics GET started',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/analytics/route.ts:GET:auth',message:'Analytics auth check',data:{hasUser:!!user,userId:user?.id,authError:authError?.message||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
    // #endregion

    if (authError || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/analytics/route.ts:GET:401',message:'Analytics returning 401',data:{authError:authError?.message,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 })
    }

    const activeSubscriptions = subscriptions?.filter(
      s => s.status === 'active' || s.status === 'trial'
    ) || []

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



