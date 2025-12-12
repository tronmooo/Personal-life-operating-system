import { Subscription, SubscriptionAnalytics } from '@/lib/hooks/use-subscriptions'

// Helper to build ISO date N days from today
function daysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Demo subscriptions closely matching the provided screenshots
export function getDemoSubscriptions(): Subscription[] {
  const now = new Date().toISOString()
  const userId = 'demo-user'

  return [
    {
      id: 'demo-spotify',
      user_id: userId,
      service_name: 'Spotify',
      category: 'streaming',
      cost: 10.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(2),
      start_date: daysFromNow(-800),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#1DB954',
      icon_letter: 'S',
      notes: 'Music streaming',
      tags: ['music'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-chatgpt',
      user_id: userId,
      service_name: 'ChatGPT Plus',
      category: 'ai_tools',
      cost: 20,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(6),
      start_date: daysFromNow(-300),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#10B981',
      icon_letter: 'C',
      notes: 'AI assistant',
      tags: ['ai'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-netflix',
      user_id: userId,
      service_name: 'Netflix',
      category: 'streaming',
      cost: 15.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(9),
      start_date: daysFromNow(-1500),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#E50914',
      icon_letter: 'N',
      notes: 'Streaming',
      tags: ['tv'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-disney',
      user_id: userId,
      service_name: 'Disney+',
      category: 'streaming',
      cost: 13.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(12),
      start_date: daysFromNow(-700),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#113CCF',
      icon_letter: 'D',
      notes: 'Streaming',
      tags: ['tv'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-icloud',
      user_id: userId,
      service_name: 'iCloud+',
      category: 'cloud_storage',
      cost: 2.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(14),
      start_date: daysFromNow(-900),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#007AFF',
      icon_letter: 'i',
      notes: 'Cloud storage',
      tags: ['storage'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-adobe',
      user_id: userId,
      service_name: 'Adobe Creative Cloud',
      category: 'software',
      cost: 49.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(73),
      start_date: daysFromNow(-2400),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#FF0000',
      icon_letter: 'A',
      notes: 'Design tools',
      tags: ['design'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-setapp',
      user_id: userId,
      service_name: 'Setapp',
      category: 'software',
      cost: 20.33,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(30),
      start_date: daysFromNow(-400),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#8B5CF6',
      icon_letter: 'S',
      notes: 'Software bundle',
      tags: ['software'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-github',
      user_id: userId,
      service_name: 'GitHub Copilot',
      category: 'ai_tools',
      cost: 10,
      currency: 'USD',
      frequency: 'monthly',
      status: 'trial',
      next_due_date: daysFromNow(4),
      start_date: daysFromNow(-20),
      trial_end_date: daysFromNow(4),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#181717',
      icon_letter: 'G',
      notes: 'Developer AI',
      tags: ['ai', 'dev'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-perplexity',
      user_id: userId,
      service_name: 'Perplexity Pro',
      category: 'ai_tools',
      cost: 10,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(15),
      start_date: daysFromNow(-120),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#0EA5E9',
      icon_letter: 'P',
      notes: 'Research AI',
      tags: ['ai'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-notion',
      user_id: userId,
      service_name: 'Notion',
      category: 'productivity',
      cost: 8,
      currency: 'USD',
      frequency: 'monthly',
      status: 'active',
      next_due_date: daysFromNow(25),
      start_date: daysFromNow(-1000),
      auto_renew: true,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#000000',
      icon_letter: 'N',
      notes: 'Workspace',
      tags: ['productivity'],
      created_at: now,
      updated_at: now,
    },
    // Non-active examples for health counts
    {
      id: 'demo-hulu',
      user_id: userId,
      service_name: 'Hulu',
      category: 'streaming',
      cost: 7.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'paused',
      next_due_date: daysFromNow(60),
      start_date: daysFromNow(-600),
      auto_renew: false,
      reminder_enabled: true,
      reminder_days_before: 3,
      icon_color: '#1CE783',
      icon_letter: 'H',
      notes: 'Paused plan',
      tags: ['tv'],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-hbo',
      user_id: userId,
      service_name: 'HBO Max',
      category: 'streaming',
      cost: 15.99,
      currency: 'USD',
      frequency: 'monthly',
      status: 'cancelled',
      next_due_date: daysFromNow(-30),
      start_date: daysFromNow(-800),
      cancellation_date: daysFromNow(-5),
      auto_renew: false,
      reminder_enabled: false,
      reminder_days_before: 3,
      icon_color: '#8B5CF6',
      icon_letter: 'H',
      notes: 'Cancelled',
      tags: ['tv'],
      created_at: now,
      updated_at: now,
    },
  ]
}

export function getDemoAnalytics(subscriptions: Subscription[]): SubscriptionAnalytics {
  const activeOrTrial = subscriptions.filter(s => s.status === 'active' || s.status === 'trial')

  const monthlyTotals = activeOrTrial.reduce((sum, s) => sum + s.cost, 0)
  const yearlyTotal = monthlyTotals * 12

  const categoryMap = new Map<string, number>()
  activeOrTrial.forEach(s => {
    categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + s.cost)
  })

  const category_breakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: monthlyTotals > 0 ? (amount / monthlyTotals) * 100 : 0,
  }))

  // Upcoming renewals within 30 days
  const today = new Date()
  const within30 = activeOrTrial
    .map(s => {
      const due = new Date(s.next_due_date)
      const days_until_due = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...s,
        days_until_due,
        monthly_cost: s.cost,
      }
    })
    .filter(s => s.days_until_due >= 0 && s.days_until_due <= 30)
    .sort((a, b) => a.days_until_due - b.days_until_due)

  const due_this_week = within30.filter(s => s.days_until_due <= 7)

  // Monthly trend: flat line of current total for last 7 months
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan']
  const monthly_trend = months.map(m => ({ month: m, amount: monthlyTotals }))

  // Old subscriptions (> 2 years)
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2
  const old_subscriptions = activeOrTrial
    .filter(s => {
      const start = s.start_date ? new Date(s.start_date).getTime() : 0
      return start > 0 && (Date.now() - start) >= twoYears
    })
    .map(s => ({
      ...s,
      monthly_cost: s.cost,
      age_in_years: Math.floor((Date.now() - new Date(s.start_date || s.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)),
    }))
    .sort((a, b) => b.monthly_cost - a.monthly_cost)

  const active_count = subscriptions.filter(s => s.status === 'active').length
  const trial_count = subscriptions.filter(s => s.status === 'trial').length
  const paused_count = subscriptions.filter(s => s.status === 'paused').length
  const cancelled_count = subscriptions.filter(s => s.status === 'cancelled').length

  return {
    summary: {
      monthly_total: parseFloat(monthlyTotals.toFixed(2)),
      daily_total: parseFloat((monthlyTotals / 30).toFixed(2)),
      weekly_total: parseFloat(((monthlyTotals * 4.33) / 4).toFixed(2)),
      yearly_total: parseFloat(yearlyTotal.toFixed(0)),
      total_subscriptions: subscriptions.length,
      active_count,
      trial_count,
      paused_count,
      cancelled_count,
    },
    category_breakdown,
    upcoming_renewals: within30,
    due_this_week,
    monthly_trend,
    old_subscriptions,
  }
}

