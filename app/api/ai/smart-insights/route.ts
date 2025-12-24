import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as AI from '@/lib/services/ai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface InsightData {
  financial: {
    totalIncome: number
    totalExpenses: number
    expensesByCategory: Record<string, number>
    recentTransactions: any[]
    bills: any[]
    unpaidBillsTotal: number
  }
  health: {
    recentLogs: any[]
    weightTrend: any[]
    exerciseLogs: any[]
    moodLogs: any[]
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    highPriority: number
  }
  habits: {
    total: number
    streaks: { name: string; streak: number }[]
    completedToday: number
  }
  relationships: {
    contacts: number
    upcomingBirthdays: any[]
    recentInteractions: any[]
  }
  travel: {
    upcomingTrips: any[]
    recentBookings: any[]
  }
  vehicles: {
    count: number
    maintenanceDue: any[]
  }
  properties: {
    count: number
    totalValue: number
  }
  documents: {
    expiringSoon: any[]
    recentUploads: number
  }
  pets: {
    count: number
    upcomingVetVisits: any[]
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // Return demo insights for guests
      return NextResponse.json({
        success: true,
        insights: [
          {
            emoji: '🔐',
            title: 'Sign in to unlock',
            message: 'Get personalized AI insights from your data',
            type: 'tip',
            domain: 'general',
            priority: 1
          },
          {
            emoji: '💡',
            title: 'Track your spending',
            message: 'AI analyzes patterns across all expenses',
            type: 'tip',
            domain: 'financial',
            priority: 2
          },
          {
            emoji: '📊',
            title: 'Life at a glance',
            message: 'Cross-domain insights connect health, finance & more',
            type: 'tip',
            domain: 'general',
            priority: 3
          }
        ],
        isGuest: true,
        generatedAt: new Date().toISOString()
      })
    }

    // Gather all user data
    const insightData = await gatherUserData(supabase, user.id)
    
    // Generate AI insights using OpenAI
    const insights = await generateAIInsights(insightData)
    
    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Smart insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

async function gatherUserData(supabase: any, userId: string): Promise<InsightData> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Fetch all domain entries
  const { data: domainEntries } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
  
  // Fetch habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
  
  // Fetch bills
  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
  
  // Categorize domain entries
  const entries = domainEntries || []
  const financialEntries = entries.filter((e: any) => e.domain === 'financial')
  const healthEntries = entries.filter((e: any) => e.domain === 'health')
  const relationshipEntries = entries.filter((e: any) => e.domain === 'relationships')
  const travelEntries = entries.filter((e: any) => e.domain === 'travel')
  const vehicleEntries = entries.filter((e: any) => e.domain === 'vehicles')
  const propertyEntries = entries.filter((e: any) => e.domain === 'properties')
  const petEntries = entries.filter((e: any) => e.domain === 'pets')
  
  // Calculate financial metrics
  const expensesByCategory: Record<string, number> = {}
  let totalIncome = 0
  let totalExpenses = 0
  
  financialEntries.forEach((entry: any) => {
    const amount = parseFloat(entry.metadata?.amount || entry.metadata?.value || 0)
    const type = entry.metadata?.type || entry.metadata?.transactionType || 'expense'
    const category = entry.metadata?.category || 'Other'
    
    if (type === 'income') {
      totalIncome += amount
    } else {
      totalExpenses += Math.abs(amount)
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(amount)
    }
  })
  
  // Calculate bills
  const unpaidBills = (bills || []).filter((b: any) => b.status !== 'paid')
  const unpaidBillsTotal = unpaidBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
  
  // Calculate task metrics
  const taskList = tasks || []
  const completedTasks = taskList.filter((t: any) => t.completed)
  const overdueTasks = taskList.filter((t: any) => {
    if (t.completed || !t.due_date) return false
    return new Date(t.due_date) < now
  })
  const highPriorityTasks = taskList.filter((t: any) => !t.completed && t.priority === 'high')
  
  // Calculate habit metrics
  const habitList = habits || []
  const habitStreaks = habitList
    .filter((h: any) => h.streak && h.streak > 0)
    .map((h: any) => ({ name: h.name, streak: h.streak }))
    .sort((a: any, b: any) => b.streak - a.streak)
  
  // Find expiring documents
  const expiringDocs = entries.filter((entry: any) => {
    const expDate = entry.metadata?.expirationDate || entry.metadata?.expiration_date
    if (!expDate) return false
    const expiration = new Date(expDate)
    const daysUntil = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 30
  })
  
  // Find upcoming birthdays
  const upcomingBirthdays = relationshipEntries.filter((entry: any) => {
    const birthday = entry.metadata?.birthday || entry.metadata?.dateOfBirth
    if (!birthday) return false
    const bday = new Date(birthday)
    const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
    if (thisYearBday < now) {
      thisYearBday.setFullYear(thisYearBday.getFullYear() + 1)
    }
    const daysUntil = Math.ceil((thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30
  })
  
  // Calculate property value
  const totalPropertyValue = propertyEntries.reduce((sum: number, p: any) => {
    return sum + (parseFloat(p.metadata?.value || p.metadata?.estimatedValue || 0))
  }, 0)

  return {
    financial: {
      totalIncome,
      totalExpenses,
      expensesByCategory,
      recentTransactions: financialEntries.slice(0, 20),
      bills: bills || [],
      unpaidBillsTotal
    },
    health: {
      recentLogs: healthEntries.filter((e: any) => new Date(e.created_at) > thirtyDaysAgo),
      weightTrend: healthEntries.filter((e: any) => e.metadata?.type === 'weight'),
      exerciseLogs: healthEntries.filter((e: any) => e.metadata?.type === 'exercise'),
      moodLogs: healthEntries.filter((e: any) => e.metadata?.type === 'mood')
    },
    tasks: {
      total: taskList.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      highPriority: highPriorityTasks.length
    },
    habits: {
      total: habitList.length,
      streaks: habitStreaks.slice(0, 5),
      completedToday: habitList.filter((h: any) => h.completed).length
    },
    relationships: {
      contacts: relationshipEntries.length,
      upcomingBirthdays,
      recentInteractions: relationshipEntries.filter((e: any) => new Date(e.created_at) > sevenDaysAgo)
    },
    travel: {
      upcomingTrips: travelEntries.filter((e: any) => {
        const tripDate = e.metadata?.startDate || e.metadata?.date
        return tripDate && new Date(tripDate) > now
      }),
      recentBookings: travelEntries.slice(0, 5)
    },
    vehicles: {
      count: vehicleEntries.length,
      maintenanceDue: vehicleEntries.filter((v: any) => {
        const nextService = v.metadata?.nextServiceDate || v.metadata?.maintenanceDue
        return nextService && new Date(nextService) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      })
    },
    properties: {
      count: propertyEntries.length,
      totalValue: totalPropertyValue
    },
    documents: {
      expiringSoon: expiringDocs,
      recentUploads: entries.filter((e: any) => new Date(e.created_at) > sevenDaysAgo).length
    },
    pets: {
      count: petEntries.length,
      upcomingVetVisits: petEntries.filter((p: any) => {
        const nextVet = p.metadata?.nextVetVisit || p.metadata?.vetAppointment
        return nextVet && new Date(nextVet) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      })
    }
  }
}

async function generateAIInsights(data: InsightData) {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  
  if (!hasGemini && !hasOpenAI) {
    console.warn('No AI API key configured, using rule-based insights')
    return generateRuleBasedInsights(data)
  }

  try {
    // Build context for AI
    const context = buildDataContext(data)
    
    const systemPrompt = `You are a personal life insights analyst. Generate 3-5 SHORT, MEANINGFUL, and ACTIONABLE insights based on the user's life data.

Rules:
1. Each insight must be 1-2 sentences MAX (under 100 characters preferred)
2. Be specific with numbers when available
3. Focus on patterns, anomalies, and actionable suggestions
4. Use emojis sparingly for visual interest
5. Prioritize urgent items (bills, health, overdue tasks) first
6. Be encouraging but honest
7. Make connections across domains when relevant (e.g., "High dining expenses might be impacting your savings goal")

Output format (JSON object with "insights" array):
{
  "insights": [
    {
      "emoji": "💸",
      "title": "Short Title",
      "message": "Brief insight message",
      "type": "warning" | "success" | "tip" | "alert",
      "domain": "financial" | "health" | "productivity" | "relationships" | "general",
      "priority": 1-5 (1 is highest)
    }
  ]
}`

    const aiResponse = await AI.requestAI({
      prompt: context,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 800
    })

    const response = aiResponse.content
    
    if (response) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const insights = parsed.insights || parsed
          if (Array.isArray(insights)) {
            return insights.sort((a: any, b: any) => (a.priority || 5) - (b.priority || 5)).slice(0, 5)
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
      }
    }
    
    return generateRuleBasedInsights(data)
  } catch (error) {
    console.error('AI insights error:', error)
    return generateRuleBasedInsights(data)
  }
}

function buildDataContext(data: InsightData): string {
  const parts: string[] = []
  
  // Financial context
  if (data.financial.totalExpenses > 0 || data.financial.totalIncome > 0) {
    parts.push(`FINANCES:
- Income: $${data.financial.totalIncome.toFixed(2)}
- Expenses: $${data.financial.totalExpenses.toFixed(2)}
- Net: $${(data.financial.totalIncome - data.financial.totalExpenses).toFixed(2)}
- Top expense categories: ${Object.entries(data.financial.expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([cat, amt]) => `${cat}: $${amt.toFixed(0)}`)
  .join(', ') || 'None tracked'}
- Unpaid bills: $${data.financial.unpaidBillsTotal.toFixed(2)} (${data.financial.bills.filter(b => b.status !== 'paid').length} bills)`)
  }
  
  // Tasks context
  if (data.tasks.total > 0) {
    parts.push(`TASKS:
- Total: ${data.tasks.total}
- Completed: ${data.tasks.completed} (${((data.tasks.completed / data.tasks.total) * 100).toFixed(0)}%)
- Overdue: ${data.tasks.overdue}
- High priority pending: ${data.tasks.highPriority}`)
  }
  
  // Habits context
  if (data.habits.total > 0) {
    parts.push(`HABITS:
- Total: ${data.habits.total}
- Top streaks: ${data.habits.streaks.map(h => `${h.name}: ${h.streak} days`).join(', ') || 'None'}
- Completed today: ${data.habits.completedToday}`)
  }
  
  // Health context
  if (data.health.recentLogs.length > 0) {
    parts.push(`HEALTH:
- Logs this month: ${data.health.recentLogs.length}
- Weight entries: ${data.health.weightTrend.length}
- Exercise logs: ${data.health.exerciseLogs.length}
- Mood logs: ${data.health.moodLogs.length}`)
  }
  
  // Relationships context
  if (data.relationships.contacts > 0 || data.relationships.upcomingBirthdays.length > 0) {
    parts.push(`RELATIONSHIPS:
- Contacts: ${data.relationships.contacts}
- Upcoming birthdays (30 days): ${data.relationships.upcomingBirthdays.length}
- Recent interactions: ${data.relationships.recentInteractions.length}`)
  }
  
  // Documents context
  if (data.documents.expiringSoon.length > 0) {
    parts.push(`DOCUMENTS:
- Expiring in 30 days: ${data.documents.expiringSoon.length}
- Recent uploads: ${data.documents.recentUploads}`)
  }
  
  // Vehicles context
  if (data.vehicles.count > 0) {
    parts.push(`VEHICLES:
- Count: ${data.vehicles.count}
- Maintenance due soon: ${data.vehicles.maintenanceDue.length}`)
  }
  
  // Properties context
  if (data.properties.count > 0) {
    parts.push(`PROPERTIES:
- Count: ${data.properties.count}
- Total estimated value: $${data.properties.totalValue.toLocaleString()}`)
  }
  
  // Pets context
  if (data.pets.count > 0) {
    parts.push(`PETS:
- Count: ${data.pets.count}
- Upcoming vet visits: ${data.pets.upcomingVetVisits.length}`)
  }
  
  // Travel context
  if (data.travel.upcomingTrips.length > 0) {
    parts.push(`TRAVEL:
- Upcoming trips: ${data.travel.upcomingTrips.length}`)
  }
  
  return parts.join('\n\n') || 'No data available yet. User is just getting started.'
}

function generateRuleBasedInsights(data: InsightData) {
  const insights: any[] = []
  
  // Financial insights
  if (data.financial.unpaidBillsTotal > 0) {
    insights.push({
      emoji: '💳',
      title: 'Bills Due',
      message: `$${data.financial.unpaidBillsTotal.toFixed(0)} in unpaid bills`,
      type: 'alert',
      domain: 'financial',
      priority: 1
    })
  }
  
  if (data.financial.totalExpenses > data.financial.totalIncome && data.financial.totalIncome > 0) {
    insights.push({
      emoji: '📉',
      title: 'Spending Alert',
      message: `Expenses exceed income by $${(data.financial.totalExpenses - data.financial.totalIncome).toFixed(0)}`,
      type: 'warning',
      domain: 'financial',
      priority: 1
    })
  }
  
  // Top spending category
  const topCategory = Object.entries(data.financial.expensesByCategory)
    .sort((a, b) => b[1] - a[1])[0]
  if (topCategory && topCategory[1] > 100) {
    const percentage = ((topCategory[1] / data.financial.totalExpenses) * 100).toFixed(0)
    insights.push({
      emoji: '💸',
      title: `Top Spending: ${topCategory[0]}`,
      message: `$${topCategory[1].toFixed(0)} (${percentage}% of expenses)`,
      type: 'tip',
      domain: 'financial',
      priority: 3
    })
  }
  
  // Task insights
  if (data.tasks.overdue > 0) {
    insights.push({
      emoji: '⚠️',
      title: 'Overdue Tasks',
      message: `${data.tasks.overdue} tasks past due date`,
      type: 'alert',
      domain: 'productivity',
      priority: 2
    })
  }
  
  if (data.tasks.highPriority > 0) {
    insights.push({
      emoji: '🎯',
      title: 'High Priority',
      message: `${data.tasks.highPriority} high-priority tasks need attention`,
      type: 'warning',
      domain: 'productivity',
      priority: 2
    })
  }
  
  // Habit streaks
  if (data.habits.streaks.length > 0 && data.habits.streaks[0].streak >= 7) {
    insights.push({
      emoji: '🔥',
      title: 'Great Streak!',
      message: `${data.habits.streaks[0].streak}-day streak on ${data.habits.streaks[0].name}`,
      type: 'success',
      domain: 'productivity',
      priority: 4
    })
  }
  
  // Document expiration
  if (data.documents.expiringSoon.length > 0) {
    insights.push({
      emoji: '📄',
      title: 'Expiring Soon',
      message: `${data.documents.expiringSoon.length} documents expire within 30 days`,
      type: 'warning',
      domain: 'general',
      priority: 2
    })
  }
  
  // Birthday reminder
  if (data.relationships.upcomingBirthdays.length > 0) {
    insights.push({
      emoji: '🎂',
      title: 'Birthdays Coming',
      message: `${data.relationships.upcomingBirthdays.length} birthdays in the next 30 days`,
      type: 'tip',
      domain: 'relationships',
      priority: 3
    })
  }
  
  // Vehicle maintenance
  if (data.vehicles.maintenanceDue.length > 0) {
    insights.push({
      emoji: '🚗',
      title: 'Maintenance Due',
      message: `${data.vehicles.maintenanceDue.length} vehicle(s) need service soon`,
      type: 'warning',
      domain: 'general',
      priority: 2
    })
  }
  
  // Pets vet visits
  if (data.pets.upcomingVetVisits.length > 0) {
    insights.push({
      emoji: '🐾',
      title: 'Vet Visits',
      message: `${data.pets.upcomingVetVisits.length} pet(s) have upcoming appointments`,
      type: 'tip',
      domain: 'general',
      priority: 3
    })
  }
  
  // Task completion rate success
  if (data.tasks.total > 5 && (data.tasks.completed / data.tasks.total) > 0.8) {
    insights.push({
      emoji: '🏆',
      title: 'Productivity Star',
      message: `${((data.tasks.completed / data.tasks.total) * 100).toFixed(0)}% task completion rate!`,
      type: 'success',
      domain: 'productivity',
      priority: 5
    })
  }
  
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5)
}

