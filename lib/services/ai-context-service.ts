/**
 * AI Context Service
 * Comprehensive context builder for all AI features
 * Aggregates user data across all 21 domains with AI settings
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Domain } from '@/types/domains'

// All domains in LifeHub (matching the Domain type)
export const ALL_DOMAINS: Domain[] = [
  'financial', 'health', 'insurance', 'home', 'vehicles', 'appliances',
  'pets', 'relationships', 'digital', 'mindfulness', 'fitness',
  'nutrition', 'services', 'miscellaneous'
]

export interface AISettings {
  aiName: string
  responseStyle: 'concise' | 'detailed' | 'conversational'
  proactiveInsights: boolean
  learningMode: boolean
  tone: 'professional' | 'friendly' | 'casual'
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
  modelVersion: 'gpt-4' | 'gpt-3.5' | 'claude-3'
  maxTokens: number
  temperature: number
  contextWindow: number
  focusAreas: string[]
  priorityDomains: string[]
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netWorth: number
  savingsRate: number
  topCategories: { category: string; amount: number }[]
  recentTransactions: number
  upcomingBills: { name: string; amount: number; dueDate: string }[]
}

export interface HealthSummary {
  latestWeight?: number
  weightTrend: 'increasing' | 'decreasing' | 'stable'
  workoutsThisWeek: number
  workoutsThisMonth: number
  caloriesAverage?: number
  sleepAverage?: number
  healthLogs: number
}

export interface GoalsSummary {
  totalGoals: number
  completedGoals: number
  inProgressGoals: number
  behindSchedule: number
  goals: {
    id: string
    title: string
    domain: string
    progress: number
    target: any
    deadline?: string
  }[]
}

export interface ComprehensiveAIContext {
  // User identity
  user: {
    id: string
    name: string
    email: string
    memberSince?: string
  }
  
  // AI personalization
  aiSettings: AISettings
  
  // Location
  location?: {
    city: string
    state: string
    timezone: string
  }
  
  // Domain data (all 21 domains)
  domains: Partial<Record<Domain, any[]>>
  domainCounts: Partial<Record<Domain, number>>
  
  // Aggregated summaries
  financialSummary: FinancialSummary
  healthSummary: HealthSummary
  goalsSummary: GoalsSummary
  
  // Activity data
  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
    upcoming: any[]
  }
  
  habits: {
    total: number
    active: number
    streaks: { name: string; streak: number }[]
  }
  
  bills: {
    total: number
    unpaid: number
    upcomingTotal: number
    upcoming: any[]
  }
  
  events: {
    total: number
    upcoming: any[]
    thisWeek: number
  }
  
  // Metadata
  dataCompleteness: number // 0-100 percentage
  lastActivity?: string
  activeDomains: Domain[]
}

const DEFAULT_AI_SETTINGS: AISettings = {
  aiName: 'AI Assistant',
  responseStyle: 'conversational',
  proactiveInsights: true,
  learningMode: true,
  tone: 'friendly',
  expertiseLevel: 'intermediate',
  modelVersion: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  contextWindow: 8000,
  focusAreas: ['Financial Health', 'Physical Health', 'Productivity'],
  priorityDomains: ['financial', 'health', 'career']
}

export class AIContextService {
  private supabase: SupabaseClient
  private cache: Map<string, { data: ComprehensiveAIContext; timestamp: number }> = new Map()
  private CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Build complete AI context for a user
   */
  async buildContext(userId: string, options?: { 
    useCache?: boolean
    focusDomains?: Domain[]
  }): Promise<ComprehensiveAIContext> {
    const cacheKey = `${userId}-${options?.focusDomains?.join(',') || 'all'}`
    
    // Check cache
    if (options?.useCache !== false) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data
      }
    }

    // Build context in parallel
    const [
      userProfile,
      aiSettings,
      domainData,
      tasks,
      habits,
      bills,
      events
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getAISettings(userId),
      this.getAllDomainData(userId, options?.focusDomains),
      this.getTasks(userId),
      this.getHabits(userId),
      this.getBills(userId),
      this.getEvents(userId)
    ])

    // Calculate summaries
    const financialSummary = this.calculateFinancialSummary(domainData.financial || [], bills)
    const healthSummary = this.calculateHealthSummary(domainData.health || [], domainData.fitness || [])
    const goalsSummary = this.calculateGoalsSummary((domainData as any).goals || [], domainData)

    // Calculate domain counts and active domains
    const domainCounts: Partial<Record<Domain, number>> = {}
    const activeDomains: Domain[] = []
    for (const [domain, items] of Object.entries(domainData)) {
      const count = (items as any[])?.length || 0
      domainCounts[domain as Domain] = count
      if (count > 0) {
        activeDomains.push(domain as Domain)
      }
    }

    // Calculate data completeness
    const totalDomains = ALL_DOMAINS.length
    const dataCompleteness = Math.round((activeDomains.length / totalDomains) * 100)

    const context: ComprehensiveAIContext = {
      user: userProfile,
      aiSettings,
      location: userProfile.location,
      domains: domainData,
      domainCounts,
      financialSummary,
      healthSummary,
      goalsSummary,
      tasks,
      habits,
      bills: {
        total: bills.length,
        unpaid: bills.filter(b => b.status !== 'paid').length,
        upcomingTotal: bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.amount || 0), 0),
        upcoming: bills.slice(0, 5)
      },
      events,
      dataCompleteness,
      activeDomains,
      lastActivity: domainData._lastActivity
    }

    // Cache the context
    this.cache.set(cacheKey, { data: context, timestamp: Date.now() })

    return context
  }

  /**
   * Generate a token-optimized summary for AI prompts
   */
  generatePromptSummary(context: ComprehensiveAIContext): string {
    const parts: string[] = []

    // User info
    parts.push(`User: ${context.user.name}`)
    if (context.location) {
      parts.push(`Location: ${context.location.city}, ${context.location.state}`)
    }

    // Data overview
    parts.push(`\nDATA OVERVIEW:`)
    parts.push(`Active domains: ${context.activeDomains.join(', ')} (${context.dataCompleteness}% complete)`)

    // Financial summary
    if (context.financialSummary.totalExpenses > 0 || context.financialSummary.totalIncome > 0) {
      parts.push(`\nFINANCIAL:`)
      parts.push(`Income: $${context.financialSummary.totalIncome.toLocaleString()}`)
      parts.push(`Expenses: $${context.financialSummary.totalExpenses.toLocaleString()}`)
      parts.push(`Net: $${context.financialSummary.netWorth.toLocaleString()}`)
      parts.push(`Savings rate: ${context.financialSummary.savingsRate.toFixed(1)}%`)
      if (context.financialSummary.topCategories.length > 0) {
        parts.push(`Top spending: ${context.financialSummary.topCategories.slice(0, 3).map(c => `${c.category}: $${c.amount}`).join(', ')}`)
      }
    }

    // Health summary
    if (context.healthSummary.healthLogs > 0) {
      parts.push(`\nHEALTH:`)
      if (context.healthSummary.latestWeight) {
        parts.push(`Weight: ${context.healthSummary.latestWeight} lbs (${context.healthSummary.weightTrend})`)
      }
      parts.push(`Workouts this week: ${context.healthSummary.workoutsThisWeek}`)
      parts.push(`Workouts this month: ${context.healthSummary.workoutsThisMonth}`)
    }

    // Goals
    if (context.goalsSummary.totalGoals > 0) {
      parts.push(`\nGOALS:`)
      parts.push(`Total: ${context.goalsSummary.totalGoals} (${context.goalsSummary.completedGoals} completed, ${context.goalsSummary.behindSchedule} behind)`)
      context.goalsSummary.goals.slice(0, 3).forEach(g => {
        parts.push(`- ${g.title}: ${g.progress}% complete`)
      })
    }

    // Tasks
    if (context.tasks.total > 0) {
      parts.push(`\nTASKS:`)
      parts.push(`Pending: ${context.tasks.pending}, Overdue: ${context.tasks.overdue}`)
    }

    // Bills
    if (context.bills.unpaid > 0) {
      parts.push(`\nBILLS:`)
      parts.push(`Unpaid: ${context.bills.unpaid} ($${context.bills.upcomingTotal.toFixed(2)} total)`)
    }

    // Habits
    if (context.habits.total > 0) {
      parts.push(`\nHABITS:`)
      parts.push(`Active: ${context.habits.active}/${context.habits.total}`)
      if (context.habits.streaks.length > 0) {
        parts.push(`Streaks: ${context.habits.streaks.slice(0, 3).map(s => `${s.name}: ${s.streak} days`).join(', ')}`)
      }
    }

    // Domain data counts
    const domainSummary = Object.entries(context.domainCounts)
      .filter(([_, count]) => (count as number) > 0)
      .map(([domain, count]) => `${domain}: ${count}`)
      .join(', ')
    if (domainSummary) {
      parts.push(`\nDOMAIN ITEMS: ${domainSummary}`)
    }

    return parts.join('\n')
  }

  /**
   * Generate system prompt with user context and AI settings
   */
  generateSystemPrompt(context: ComprehensiveAIContext, additionalInstructions?: string): string {
    const { aiSettings } = context
    const summary = this.generatePromptSummary(context)

    const toneInstructions = {
      professional: 'Be formal, precise, and business-like in your responses.',
      friendly: 'Be warm, approachable, and conversational while remaining helpful.',
      casual: 'Be relaxed and informal, like chatting with a friend.'
    }

    const expertiseInstructions = {
      beginner: 'Explain concepts simply and avoid jargon. Provide step-by-step guidance.',
      intermediate: 'Use balanced explanations with some technical detail when relevant.',
      advanced: 'You can use technical language and assume familiarity with concepts.'
    }

    const styleInstructions = {
      concise: 'Keep responses brief and to the point. Use bullet points when listing items.',
      detailed: 'Provide comprehensive explanations with context and examples.',
      conversational: 'Engage naturally in dialogue, asking clarifying questions when needed.'
    }

    let prompt = `You are ${aiSettings.aiName}, a personal AI assistant for LifeHub - a comprehensive life management application.

COMMUNICATION STYLE:
${toneInstructions[aiSettings.tone]}
${expertiseInstructions[aiSettings.expertiseLevel]}
${styleInstructions[aiSettings.responseStyle]}

USER CONTEXT:
${summary}

FOCUS AREAS: ${aiSettings.focusAreas.join(', ')}
PRIORITY DOMAINS: ${aiSettings.priorityDomains.join(', ')}

YOUR CAPABILITIES:
- Answer questions about the user's data across all life domains
- Provide personalized insights and recommendations
- Help with goal setting and tracking
- Offer financial, health, and lifestyle advice
- Analyze patterns and trends in user data
- Create action plans and suggestions

GUIDELINES:
- Always base your responses on the user's actual data when available
- Be proactive in offering relevant insights when ${aiSettings.proactiveInsights ? 'enabled' : 'disabled'}
- Reference specific data points to support your recommendations
- Suggest actionable next steps when appropriate
`

    if (additionalInstructions) {
      prompt += `\nADDITIONAL INSTRUCTIONS:\n${additionalInstructions}`
    }

    return prompt
  }

  // Private methods for data fetching

  private async getUserProfile(userId: string) {
    const { data: settings } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: { user } } = await this.supabase.auth.getUser()

    return {
      id: userId,
      name: settings?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      memberSince: user?.created_at,
      location: settings?.city ? {
        city: settings.city,
        state: settings.state || '',
        timezone: settings.timezone || 'America/Los_Angeles'
      } : undefined
    }
  }

  private async getAISettings(userId: string): Promise<AISettings> {
    const { data } = await this.supabase
      .from('user_settings')
      .select('aiAssistantSettings')
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.aiAssistantSettings && typeof data.aiAssistantSettings === 'object') {
      return { ...DEFAULT_AI_SETTINGS, ...data.aiAssistantSettings }
    }

    return DEFAULT_AI_SETTINGS
  }

  private async getAllDomainData(userId: string, focusDomains?: Domain[]) {
    let query = this.supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (focusDomains && focusDomains.length > 0) {
      query = query.in('domain', focusDomains)
    }

    const { data } = await query.limit(500)

    const domains: Partial<Record<Domain, any[]>> & { _lastActivity?: string } = {}
    let lastActivity: string | undefined

    for (const entry of data || []) {
      const domain = entry.domain as Domain
      if (!domains[domain]) {
        domains[domain] = []
      }
      domains[domain]!.push({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        metadata: entry.metadata,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      })

      if (!lastActivity || entry.updated_at > lastActivity) {
        lastActivity = entry.updated_at
      }
    }

    domains._lastActivity = lastActivity

    return domains
  }

  private async getTasks(userId: string) {
    const { data, count } = await this.supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    const tasks = data || []
    const now = new Date()
    const completed = tasks.filter(t => t.completed)
    const pending = tasks.filter(t => !t.completed)
    const overdue = pending.filter(t => t.due_date && new Date(t.due_date) < now)

    return {
      total: count || tasks.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      upcoming: pending
        .filter(t => t.due_date)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5)
    }
  }

  private async getHabits(userId: string) {
    const { data } = await this.supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)

    const habits = data || []
    const active = habits.filter(h => h.active)
    const streaks = active
      .filter(h => h.current_streak > 0)
      .map(h => ({ name: h.name, streak: h.current_streak }))
      .sort((a, b) => b.streak - a.streak)

    return {
      total: habits.length,
      active: active.length,
      streaks
    }
  }

  private async getBills(userId: string) {
    const { data } = await this.supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .limit(20)

    return data || []
  }

  private async getEvents(userId: string) {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data, count } = await this.supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('date', now.toISOString())
      .order('date', { ascending: true })
      .limit(10)

    const events = data || []
    const thisWeek = events.filter(e => new Date(e.date) <= weekFromNow)

    return {
      total: count || events.length,
      upcoming: events.slice(0, 5),
      thisWeek: thisWeek.length
    }
  }

  private calculateFinancialSummary(financialData: any[], bills: any[]): FinancialSummary {
    let totalIncome = 0
    let totalExpenses = 0
    const categoryTotals: Record<string, number> = {}

    for (const item of financialData) {
      const meta = item.metadata || {}
      const amount = parseFloat(meta.amount || 0)
      const type = meta.type || item.type
      const category = meta.category || 'Uncategorized'

      if (type === 'income') {
        totalIncome += amount
      } else if (type === 'expense') {
        totalExpenses += amount
        categoryTotals[category] = (categoryTotals[category] || 0) + amount
      }
    }

    const netWorth = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const upcomingBills = bills
      .filter(b => b.status !== 'paid')
      .slice(0, 5)
      .map(b => ({
        name: b.name,
        amount: b.amount,
        dueDate: b.due_date
      }))

    return {
      totalIncome,
      totalExpenses,
      netWorth,
      savingsRate,
      topCategories,
      recentTransactions: financialData.length,
      upcomingBills
    }
  }

  private calculateHealthSummary(healthData: any[], fitnessData: any[]): HealthSummary {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Weight tracking
    const weightLogs = healthData
      .filter(h => h.metadata?.weight || h.metadata?.logType === 'weight')
      .map(h => ({
        weight: parseFloat(h.metadata?.weight || h.metadata?.value || 0),
        date: new Date(h.createdAt)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    const latestWeight = weightLogs[0]?.weight
    let weightTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    
    if (weightLogs.length >= 3) {
      const recent = weightLogs.slice(0, 3).reduce((sum, w) => sum + w.weight, 0) / 3
      const older = weightLogs.slice(-3).reduce((sum, w) => sum + w.weight, 0) / 3
      const diff = ((recent - older) / older) * 100
      if (diff > 2) weightTrend = 'increasing'
      else if (diff < -2) weightTrend = 'decreasing'
    }

    // Workout tracking
    const workouts = [...healthData, ...fitnessData].filter(h => 
      h.metadata?.workout_type || h.metadata?.activity || h.metadata?.type === 'workout'
    )

    const workoutsThisWeek = workouts.filter(w => new Date(w.createdAt) >= weekAgo).length
    const workoutsThisMonth = workouts.filter(w => new Date(w.createdAt) >= monthAgo).length

    return {
      latestWeight,
      weightTrend,
      workoutsThisWeek,
      workoutsThisMonth,
      healthLogs: healthData.length + fitnessData.length
    }
  }

  private calculateGoalsSummary(goalsData: any[], allDomains: Partial<Record<Domain, any[]>>): GoalsSummary {
    // Goals can be in the goals domain or marked with type: 'goal' in other domains
    const allGoals: any[] = [...goalsData]

    // Check other domains for goal-type entries
    for (const [_, items] of Object.entries(allDomains)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.metadata?.type === 'goal' || item.metadata?.isGoal) {
            allGoals.push(item)
          }
        }
      }
    }

    const completedGoals = allGoals.filter(g => 
      g.metadata?.completed || g.metadata?.progress >= 100 || g.metadata?.status === 'completed'
    )

    const inProgressGoals = allGoals.filter(g => {
      const progress = g.metadata?.progress || 0
      return progress > 0 && progress < 100 && !g.metadata?.completed
    })

    const behindSchedule = allGoals.filter(g => {
      const deadline = g.metadata?.deadline || g.metadata?.target_date
      if (!deadline) return false
      const progress = g.metadata?.progress || 0
      const daysRemaining = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      const expectedProgress = 100 - (daysRemaining / 30) * 100 // Assume 30-day goals
      return progress < expectedProgress && progress < 100
    })

    const goals = allGoals.slice(0, 10).map(g => ({
      id: g.id,
      title: g.title,
      domain: g.domain || g.metadata?.domain || 'goals',
      progress: g.metadata?.progress || 0,
      target: g.metadata?.target,
      deadline: g.metadata?.deadline || g.metadata?.target_date
    }))

    return {
      totalGoals: allGoals.length,
      completedGoals: completedGoals.length,
      inProgressGoals: inProgressGoals.length,
      behindSchedule: behindSchedule.length,
      goals
    }
  }

  /**
   * Clear the cache for a user
   */
  clearCache(userId?: string) {
    if (userId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}

/**
 * Create an AI context service instance
 */
export function createAIContextService(supabase: SupabaseClient): AIContextService {
  return new AIContextService(supabase)
}

