/**
 * Weekly Digest Generator
 * Generates personalized weekly summaries and insights for users
 */

import type { Domain } from '@/types/domains'
import { generateProactiveInsights, type InsightContext, type ProactiveInsight } from './proactive-insights-engine'

// ============================================
// TYPES
// ============================================

export interface WeeklyDigest {
  userId: string
  weekStart: string
  weekEnd: string
  generatedAt: string
  
  // Overall summary
  summary: DigestSummary
  
  // Domain-specific highlights
  domainHighlights: DomainHighlight[]
  
  // Achievements and wins
  wins: DigestWin[]
  
  // Areas needing attention
  needsAttention: AttentionItem[]
  
  // AI-powered insights
  insights: ProactiveInsight[]
  
  // Recommendations for next week
  recommendations: WeeklyRecommendation[]
  
  // Goals progress
  goalsProgress: GoalProgress[]
  
  // Streak updates
  streakUpdates: StreakUpdate[]
  
  // Comparison to previous week
  weekOverWeek: WeekOverWeekComparison
}

export interface DigestSummary {
  headline: string
  overallScore: number  // 0-100 life management score
  topDomain: string
  totalEntriesLogged: number
  tasksCompleted: number
  habitsTracked: number
  moodSummary?: string
}

export interface DomainHighlight {
  domain: Domain
  icon: string
  title: string
  metric: string
  value: string | number
  change?: {
    direction: 'up' | 'down' | 'stable'
    amount: string
    isPositive: boolean
  }
  insight?: string
}

export interface DigestWin {
  id: string
  title: string
  description: string
  domain?: Domain
  icon: string
  timestamp?: string
}

export interface AttentionItem {
  id: string
  title: string
  description: string
  domain?: Domain
  priority: 'high' | 'medium' | 'low'
  actionLabel?: string
  actionPath?: string
}

export interface WeeklyRecommendation {
  id: string
  title: string
  description: string
  domain?: Domain
  impact: string
  effort: 'low' | 'medium' | 'high'
}

export interface GoalProgress {
  goalId: string
  goalTitle: string
  domain: Domain
  progressPercent: number
  changeThisWeek: number
  onTrack: boolean
  dueDate?: string
}

export interface StreakUpdate {
  habitId: string
  habitName: string
  currentStreak: number
  bestStreak: number
  status: 'growing' | 'maintained' | 'broken' | 'started'
  icon: string
}

export interface WeekOverWeekComparison {
  entriesLogged: { current: number; previous: number; change: number }
  tasksCompleted: { current: number; previous: number; change: number }
  habitsCompleted: { current: number; previous: number; change: number }
  domainsUpdated: { current: number; previous: number; change: number }
  averageRating?: { current: number; previous: number; change: number }
}

// ============================================
// DIGEST GENERATION
// ============================================

export interface DigestGenerationInput {
  userId: string
  
  // Current week data
  domainEntries: Record<string, any[]>
  tasks: any[]
  habits: any[]
  bills: any[]
  goals: any[]
  events: any[]
  
  // Previous week data for comparison
  previousWeekEntries?: Record<string, any[]>
  previousWeekTasks?: any[]
  previousWeekHabits?: any[]
}

export function generateWeeklyDigest(input: DigestGenerationInput): WeeklyDigest {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const weekEnd = getWeekEnd(now)

  // Generate insights using existing engine
  const insightContext: InsightContext = {
    userId: input.userId,
    domains: input.domainEntries,
    tasks: input.tasks,
    habits: input.habits,
    bills: input.bills,
    events: input.events,
    goals: input.goals
  }
  const insights = generateProactiveInsights(insightContext)

  // Calculate summary
  const summary = generateSummary(input)
  
  // Get domain highlights
  const domainHighlights = generateDomainHighlights(input)
  
  // Find wins
  const wins = findWins(input, insights)
  
  // Find items needing attention
  const needsAttention = findAttentionItems(input, insights)
  
  // Generate recommendations
  const recommendations = generateRecommendations(input, insights)
  
  // Calculate goals progress
  const goalsProgress = calculateGoalsProgress(input.goals)
  
  // Get streak updates
  const streakUpdates = getStreakUpdates(input.habits)
  
  // Week over week comparison
  const weekOverWeek = calculateWeekOverWeek(input)

  return {
    userId: input.userId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    generatedAt: now.toISOString(),
    summary,
    domainHighlights,
    wins,
    needsAttention,
    insights: insights.slice(0, 5),  // Top 5 insights
    recommendations,
    goalsProgress,
    streakUpdates,
    weekOverWeek
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)  // Monday
  return new Date(d.setDate(diff))
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)  // Sunday
}

function generateSummary(input: DigestGenerationInput): DigestSummary {
  // Count total entries
  const totalEntries = Object.values(input.domainEntries)
    .reduce((sum, entries) => sum + entries.length, 0)

  // Tasks completion
  const completedTasks = input.tasks.filter(t => t.completed).length

  // Habits tracked
  const habitsTracked = input.habits.filter(h => h.current_streak > 0).length

  // Find top domain
  const domainCounts = Object.entries(input.domainEntries)
    .map(([domain, entries]) => ({ domain, count: entries.length }))
    .sort((a, b) => b.count - a.count)
  
  const topDomain = domainCounts[0]?.domain || 'none'

  // Calculate overall score (simplified)
  let score = 50  // Base score
  
  if (totalEntries > 10) score += 10
  if (totalEntries > 20) score += 10
  if (completedTasks > 5) score += 10
  if (completedTasks > 10) score += 10
  if (habitsTracked > 3) score += 10
  
  score = Math.min(100, score)

  // Generate headline
  const headlines = [
    score >= 80 ? '🌟 Outstanding week! You\'re crushing it!' :
    score >= 60 ? '👍 Great progress this week!' :
    score >= 40 ? '📈 Building momentum - keep going!' :
    '💪 Every step counts - let\'s grow together!'
  ]

  return {
    headline: headlines[0],
    overallScore: score,
    topDomain,
    totalEntriesLogged: totalEntries,
    tasksCompleted: completedTasks,
    habitsTracked
  }
}

function generateDomainHighlights(input: DigestGenerationInput): DomainHighlight[] {
  const highlights: DomainHighlight[] = []

  // Financial highlight
  const financialEntries = input.domainEntries.financial || []
  if (financialEntries.length > 0) {
    const expenses = financialEntries
      .filter(e => e.metadata?.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.metadata?.amount || 0), 0)
    
    highlights.push({
      domain: 'financial' as Domain,
      icon: '💰',
      title: 'Financial Tracking',
      metric: 'Total Expenses',
      value: `$${expenses.toFixed(2)}`,
      insight: expenses > 1000 ? 'Higher spending this week - review your purchases' : undefined
    })
  }

  // Health highlight
  const healthEntries = input.domainEntries.health || []
  if (healthEntries.length > 0) {
    const weightLogs = healthEntries.filter(e => e.metadata?.weight || e.metadata?.logType === 'weight')
    if (weightLogs.length > 0) {
      const latestWeight = parseFloat(weightLogs[weightLogs.length - 1]?.metadata?.weight || 0)
      highlights.push({
        domain: 'health' as Domain,
        icon: '❤️',
        title: 'Health Tracking',
        metric: 'Latest Weight',
        value: `${latestWeight} lbs`,
        insight: weightLogs.length >= 3 ? 'Great consistency with weight tracking!' : undefined
      })
    }
  }

  // Fitness highlight
  const fitnessEntries = input.domainEntries.fitness || []
  if (fitnessEntries.length > 0) {
    const workouts = fitnessEntries.filter(e => 
      e.metadata?.workout_type || e.metadata?.type === 'workout'
    )
    highlights.push({
      domain: 'fitness' as Domain,
      icon: '💪',
      title: 'Fitness Activity',
      metric: 'Workouts This Week',
      value: workouts.length,
      insight: workouts.length >= 4 ? '🔥 Fantastic workout consistency!' : undefined
    })
  }

  // Nutrition highlight
  const nutritionEntries = input.domainEntries.nutrition || []
  if (nutritionEntries.length > 0) {
    const meals = nutritionEntries.filter(e => e.metadata?.type === 'meal')
    highlights.push({
      domain: 'nutrition' as Domain,
      icon: '🍽️',
      title: 'Nutrition Logging',
      metric: 'Meals Tracked',
      value: meals.length
    })
  }

  return highlights.slice(0, 4)  // Max 4 highlights
}

function findWins(input: DigestGenerationInput, insights: ProactiveInsight[]): DigestWin[] {
  const wins: DigestWin[] = []

  // Celebration insights are wins
  insights
    .filter(i => i.type === 'celebration')
    .slice(0, 3)
    .forEach(insight => {
      wins.push({
        id: insight.id,
        title: insight.title,
        description: insight.message,
        domain: insight.domain,
        icon: '🎉'
      })
    })

  // Completed tasks
  const completedTasks = input.tasks.filter(t => t.completed)
  if (completedTasks.length >= 5) {
    wins.push({
      id: 'win-tasks',
      title: `${completedTasks.length} Tasks Completed!`,
      description: 'You\'re making great progress on your to-do list.',
      icon: '✅'
    })
  }

  // Habit streaks
  const longStreaks = input.habits.filter(h => h.current_streak >= 7)
  longStreaks.slice(0, 2).forEach(habit => {
    wins.push({
      id: `win-streak-${habit.id}`,
      title: `${habit.current_streak}-Day Streak!`,
      description: `"${habit.name}" habit is going strong.`,
      icon: '🔥'
    })
  })

  return wins.slice(0, 5)  // Max 5 wins
}

function findAttentionItems(input: DigestGenerationInput, insights: ProactiveInsight[]): AttentionItem[] {
  const items: AttentionItem[] = []

  // High priority insights need attention
  insights
    .filter(i => i.priority === 'high' && i.type !== 'celebration')
    .slice(0, 3)
    .forEach(insight => {
      items.push({
        id: insight.id,
        title: insight.title,
        description: insight.message,
        domain: insight.domain,
        priority: 'high',
        actionLabel: insight.actionLabel,
        actionPath: insight.actionPath
      })
    })

  // Overdue tasks
  const overdueTasks = input.tasks.filter(t => 
    !t.completed && t.due_date && new Date(t.due_date) < new Date()
  )
  if (overdueTasks.length > 0) {
    items.push({
      id: 'attention-overdue-tasks',
      title: `${overdueTasks.length} Overdue Tasks`,
      description: 'These tasks need your attention or deadline adjustment.',
      priority: 'high',
      actionLabel: 'View Tasks',
      actionPath: '/tasks'
    })
  }

  // Broken habit streaks
  const brokenStreaks = input.habits.filter(h => 
    h.active && h.current_streak === 0 && h.best_streak > 3
  )
  if (brokenStreaks.length > 0) {
    items.push({
      id: 'attention-habits',
      title: 'Habits Need Restart',
      description: `${brokenStreaks.length} habit(s) lost their streak. Today is a great day to restart!`,
      priority: 'medium',
      actionLabel: 'View Habits',
      actionPath: '/habits'
    })
  }

  return items.slice(0, 4)  // Max 4 attention items
}

function generateRecommendations(input: DigestGenerationInput, insights: ProactiveInsight[]): WeeklyRecommendation[] {
  const recommendations: WeeklyRecommendation[] = []

  // Suggestions from insights
  insights
    .filter(i => i.type === 'suggestion')
    .slice(0, 2)
    .forEach(insight => {
      recommendations.push({
        id: insight.id,
        title: insight.title,
        description: insight.message,
        domain: insight.domain,
        impact: 'Improved tracking and awareness',
        effort: 'low'
      })
    })

  // Domain-specific recommendations
  const domainCounts = Object.entries(input.domainEntries)
    .map(([domain, entries]) => ({ domain, count: entries.length }))
  
  // Recommend tracking underused domains
  const lowActivityDomains = domainCounts.filter(d => d.count < 3)
  if (lowActivityDomains.length > 0) {
    const domain = lowActivityDomains[0].domain as Domain
    recommendations.push({
      id: 'rec-domain-activity',
      title: `Track More in ${domain}`,
      description: `You have few entries in ${domain}. Regular tracking provides better insights.`,
      domain,
      impact: 'Better understanding of your patterns',
      effort: 'low'
    })
  }

  // General recommendations
  if (input.habits.length === 0) {
    recommendations.push({
      id: 'rec-start-habits',
      title: 'Start Building Habits',
      description: 'Create your first habit to build consistent routines.',
      impact: 'Build positive daily routines',
      effort: 'low'
    })
  }

  if (input.goals.length === 0) {
    recommendations.push({
      id: 'rec-set-goals',
      title: 'Set Some Goals',
      description: 'Define what you want to achieve to stay motivated and focused.',
      impact: 'Clear direction and motivation',
      effort: 'medium'
    })
  }

  return recommendations.slice(0, 4)  // Max 4 recommendations
}

function calculateGoalsProgress(goals: any[]): GoalProgress[] {
  return goals
    .filter(g => g.metadata?.progress !== undefined)
    .slice(0, 5)
    .map(g => ({
      goalId: g.id,
      goalTitle: g.title,
      domain: g.domain as Domain,
      progressPercent: parseFloat(g.metadata?.progress || 0),
      changeThisWeek: 0,  // Would need historical data
      onTrack: parseFloat(g.metadata?.progress || 0) >= 50,
      dueDate: g.metadata?.deadline || g.metadata?.target_date
    }))
}

function getStreakUpdates(habits: any[]): StreakUpdate[] {
  return habits
    .filter(h => h.active)
    .slice(0, 5)
    .map(h => ({
      habitId: h.id,
      habitName: h.name,
      currentStreak: h.current_streak || 0,
      bestStreak: h.best_streak || 0,
      status: h.current_streak > 0 
        ? (h.current_streak >= h.best_streak ? 'growing' : 'maintained')
        : (h.best_streak > 0 ? 'broken' : 'started'),
      icon: h.icon || '✨'
    }))
}

function calculateWeekOverWeek(input: DigestGenerationInput): WeekOverWeekComparison {
  const currentEntries = Object.values(input.domainEntries)
    .reduce((sum, entries) => sum + entries.length, 0)
  
  const previousEntries = input.previousWeekEntries 
    ? Object.values(input.previousWeekEntries).reduce((sum, entries) => sum + entries.length, 0)
    : 0

  const currentTasks = input.tasks.filter(t => t.completed).length
  const previousTasks = input.previousWeekTasks?.filter(t => t.completed).length || 0

  const currentHabits = input.habits.filter(h => h.current_streak > 0).length
  const previousHabits = input.previousWeekHabits?.filter(h => h.current_streak > 0).length || 0

  const currentDomains = Object.keys(input.domainEntries).filter(
    d => (input.domainEntries[d]?.length || 0) > 0
  ).length
  const previousDomains = input.previousWeekEntries 
    ? Object.keys(input.previousWeekEntries).filter(
        d => (input.previousWeekEntries![d]?.length || 0) > 0
      ).length
    : 0

  return {
    entriesLogged: { 
      current: currentEntries, 
      previous: previousEntries, 
      change: previousEntries > 0 ? Math.round(((currentEntries - previousEntries) / previousEntries) * 100) : 0 
    },
    tasksCompleted: { 
      current: currentTasks, 
      previous: previousTasks, 
      change: previousTasks > 0 ? Math.round(((currentTasks - previousTasks) / previousTasks) * 100) : 0 
    },
    habitsCompleted: { 
      current: currentHabits, 
      previous: previousHabits, 
      change: previousHabits > 0 ? Math.round(((currentHabits - previousHabits) / previousHabits) * 100) : 0 
    },
    domainsUpdated: { 
      current: currentDomains, 
      previous: previousDomains, 
      change: previousDomains > 0 ? Math.round(((currentDomains - previousDomains) / previousDomains) * 100) : 0 
    }
  }
}

// ============================================
// DIGEST FORMATTING
// ============================================

/**
 * Format digest as readable text (for email or display)
 */
export function formatDigestAsText(digest: WeeklyDigest): string {
  let text = `# 📊 Your Week in Review\n`
  text += `*${new Date(digest.weekStart).toLocaleDateString()} - ${new Date(digest.weekEnd).toLocaleDateString()}*\n\n`

  // Summary
  text += `## ${digest.summary.headline}\n\n`
  text += `**Life Score:** ${digest.summary.overallScore}/100\n`
  text += `**Entries Logged:** ${digest.summary.totalEntriesLogged}\n`
  text += `**Tasks Completed:** ${digest.summary.tasksCompleted}\n`
  text += `**Habits Tracked:** ${digest.summary.habitsTracked}\n\n`

  // Wins
  if (digest.wins.length > 0) {
    text += `## 🎉 Wins This Week\n\n`
    digest.wins.forEach(win => {
      text += `${win.icon} **${win.title}**\n${win.description}\n\n`
    })
  }

  // Needs Attention
  if (digest.needsAttention.length > 0) {
    text += `## ⚠️ Needs Attention\n\n`
    digest.needsAttention.forEach(item => {
      text += `• **${item.title}**: ${item.description}\n`
    })
    text += '\n'
  }

  // Domain Highlights
  if (digest.domainHighlights.length > 0) {
    text += `## 📈 Domain Highlights\n\n`
    digest.domainHighlights.forEach(h => {
      text += `${h.icon} **${h.title}**: ${h.metric} = ${h.value}\n`
      if (h.insight) text += `   _${h.insight}_\n`
    })
    text += '\n'
  }

  // Streak Updates
  if (digest.streakUpdates.length > 0) {
    text += `## 🔥 Habit Streaks\n\n`
    digest.streakUpdates.forEach(s => {
      text += `${s.icon} **${s.habitName}**: ${s.currentStreak} days (best: ${s.bestStreak})\n`
    })
    text += '\n'
  }

  // Recommendations
  if (digest.recommendations.length > 0) {
    text += `## 💡 Recommendations for Next Week\n\n`
    digest.recommendations.forEach(rec => {
      text += `• **${rec.title}**: ${rec.description}\n`
    })
    text += '\n'
  }

  // Week over week
  const wow = digest.weekOverWeek
  text += `## 📊 Week Over Week\n\n`
  text += `• Entries: ${wow.entriesLogged.current} (${wow.entriesLogged.change >= 0 ? '+' : ''}${wow.entriesLogged.change}%)\n`
  text += `• Tasks: ${wow.tasksCompleted.current} (${wow.tasksCompleted.change >= 0 ? '+' : ''}${wow.tasksCompleted.change}%)\n`
  text += `• Active Habits: ${wow.habitsCompleted.current} (${wow.habitsCompleted.change >= 0 ? '+' : ''}${wow.habitsCompleted.change}%)\n`

  return text
}

/**
 * Format digest as HTML (for email)
 */
export function formatDigestAsHTML(digest: WeeklyDigest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a2e; }
    h2 { color: #16213e; border-bottom: 2px solid #e94560; padding-bottom: 8px; }
    .score { font-size: 48px; font-weight: bold; color: #e94560; }
    .win { background: #d4edda; padding: 12px; border-radius: 8px; margin: 8px 0; }
    .attention { background: #fff3cd; padding: 12px; border-radius: 8px; margin: 8px 0; }
    .highlight { display: inline-block; background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 4px; }
    .streak { background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 8px 12px; border-radius: 16px; display: inline-block; margin: 4px; }
    .recommendation { border-left: 3px solid #e94560; padding-left: 12px; margin: 12px 0; }
    .stats { display: flex; justify-content: space-between; background: #f8f9fa; padding: 16px; border-radius: 8px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1a1a2e; }
    .stat-label { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>📊 Your Week in Review</h1>
  <p style="color: #666;">${new Date(digest.weekStart).toLocaleDateString()} - ${new Date(digest.weekEnd).toLocaleDateString()}</p>
  
  <div style="text-align: center; margin: 24px 0;">
    <div class="score">${digest.summary.overallScore}</div>
    <div style="color: #666;">Life Score</div>
    <h2 style="border: none; margin-top: 16px;">${digest.summary.headline}</h2>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${digest.summary.totalEntriesLogged}</div>
      <div class="stat-label">Entries</div>
    </div>
    <div class="stat">
      <div class="stat-value">${digest.summary.tasksCompleted}</div>
      <div class="stat-label">Tasks Done</div>
    </div>
    <div class="stat">
      <div class="stat-value">${digest.summary.habitsTracked}</div>
      <div class="stat-label">Habits</div>
    </div>
  </div>

  ${digest.wins.length > 0 ? `
    <h2>🎉 Wins This Week</h2>
    ${digest.wins.map(w => `<div class="win"><strong>${w.icon} ${w.title}</strong><br/>${w.description}</div>`).join('')}
  ` : ''}

  ${digest.needsAttention.length > 0 ? `
    <h2>⚠️ Needs Attention</h2>
    ${digest.needsAttention.map(a => `<div class="attention"><strong>${a.title}</strong><br/>${a.description}</div>`).join('')}
  ` : ''}

  ${digest.domainHighlights.length > 0 ? `
    <h2>📈 Highlights</h2>
    <div>${digest.domainHighlights.map(h => `<div class="highlight">${h.icon} <strong>${h.title}</strong><br/>${h.metric}: ${h.value}</div>`).join('')}</div>
  ` : ''}

  ${digest.streakUpdates.length > 0 ? `
    <h2>🔥 Habit Streaks</h2>
    <div>${digest.streakUpdates.map(s => `<span class="streak">${s.icon} ${s.habitName}: ${s.currentStreak} days</span>`).join('')}</div>
  ` : ''}

  ${digest.recommendations.length > 0 ? `
    <h2>💡 For Next Week</h2>
    ${digest.recommendations.map(r => `<div class="recommendation"><strong>${r.title}</strong><br/>${r.description}</div>`).join('')}
  ` : ''}

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
  <p style="color: #666; font-size: 12px; text-align: center;">
    Generated by LifeHub AI • ${new Date(digest.generatedAt).toLocaleDateString()}
  </p>
</body>
</html>
  `
}



