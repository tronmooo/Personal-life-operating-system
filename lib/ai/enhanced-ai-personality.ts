/**
 * Enhanced AI Personality & Settings System
 * Provides dynamic personality customization, learning preferences,
 * and adaptive behavior for the LifeHub AI assistant
 */

import type { Domain } from '@/types/domains'

// ============================================
// PERSONALITY SYSTEM
// ============================================

export type AIPersonalityTrait = 'analytical' | 'supportive' | 'motivational' | 'direct' | 'nurturing' | 'humorous'

export type AIVoiceStyle = 
  | 'professional'     // Formal, precise, business-like
  | 'casual'          // Relaxed, friendly, conversational
  | 'motivational'    // Encouraging, empowering, positive
  | 'nurturing'       // Warm, caring, supportive
  | 'analytical'      // Data-driven, logical, methodical
  | 'minimal'         // Brief, to-the-point, efficient

export type AIProactivityLevel = 'high' | 'medium' | 'low' | 'ask-only'

export interface AIPersonality {
  // Core personality
  name: string
  voiceStyle: AIVoiceStyle
  traits: AIPersonalityTrait[]
  
  // Communication preferences
  verbosity: 'concise' | 'balanced' | 'detailed'
  useEmoji: boolean
  encouragementLevel: 'high' | 'medium' | 'low' | 'none'
  proactivity: AIProactivityLevel
  
  // Response formatting
  useStructuredResponses: boolean
  includeReasonings: boolean
  suggestFollowUps: boolean
  
  // Domain-specific behaviors
  priorityDomains: Domain[]
  domainExpertise: Partial<Record<Domain, 'beginner' | 'intermediate' | 'expert'>>
}

export const DEFAULT_PERSONALITY: AIPersonality = {
  name: 'LifeHub AI',
  voiceStyle: 'casual',
  traits: ['supportive', 'analytical'],
  verbosity: 'balanced',
  useEmoji: true,
  encouragementLevel: 'medium',
  proactivity: 'medium',
  useStructuredResponses: true,
  includeReasonings: true,
  suggestFollowUps: true,
  priorityDomains: ['financial', 'health', 'tasks'],
  domainExpertise: {}
}

// Preset personalities for quick selection
export const PERSONALITY_PRESETS: Record<string, Partial<AIPersonality>> = {
  'productivity-coach': {
    name: 'ProductivityPro',
    voiceStyle: 'motivational',
    traits: ['direct', 'motivational'],
    verbosity: 'concise',
    useEmoji: true,
    encouragementLevel: 'high',
    proactivity: 'high',
    priorityDomains: ['tasks', 'career', 'goals']
  },
  'wellness-guide': {
    name: 'WellnessGuide',
    voiceStyle: 'nurturing',
    traits: ['nurturing', 'supportive'],
    verbosity: 'balanced',
    useEmoji: true,
    encouragementLevel: 'high',
    proactivity: 'medium',
    priorityDomains: ['health', 'fitness', 'mindfulness', 'nutrition']
  },
  'finance-advisor': {
    name: 'FinanceAdvisor',
    voiceStyle: 'professional',
    traits: ['analytical', 'direct'],
    verbosity: 'detailed',
    useEmoji: false,
    encouragementLevel: 'low',
    proactivity: 'medium',
    priorityDomains: ['financial', 'insurance', 'property']
  },
  'life-organizer': {
    name: 'LifeOrganizer',
    voiceStyle: 'casual',
    traits: ['supportive', 'analytical'],
    verbosity: 'balanced',
    useEmoji: true,
    encouragementLevel: 'medium',
    proactivity: 'high',
    priorityDomains: ['tasks', 'home', 'vehicles', 'appliances']
  },
  'minimal-assistant': {
    name: 'Assistant',
    voiceStyle: 'minimal',
    traits: ['direct'],
    verbosity: 'concise',
    useEmoji: false,
    encouragementLevel: 'none',
    proactivity: 'ask-only',
    suggestFollowUps: false
  }
}

// ============================================
// PERSONALITY PROMPT BUILDER
// ============================================

export function buildPersonalityPrompt(personality: AIPersonality): string {
  const voiceInstructions: Record<AIVoiceStyle, string> = {
    professional: `Maintain a formal, precise, and business-like tone. Use proper terminology, structured responses, and clear reasoning.`,
    casual: `Be relaxed and conversational, like chatting with a knowledgeable friend. Use natural language and be approachable.`,
    motivational: `Be encouraging, empowering, and positive. Celebrate wins, frame challenges as opportunities, and inspire action.`,
    nurturing: `Be warm, caring, and supportive. Show empathy, validate feelings, and provide gentle guidance.`,
    analytical: `Focus on data, patterns, and logical analysis. Present insights with supporting evidence and clear reasoning.`,
    minimal: `Be brief and efficient. Give only essential information. Skip pleasantries and unnecessary context.`
  }

  const verbosityInstructions: Record<string, string> = {
    concise: `Keep responses short and focused. Aim for 2-3 sentences unless more detail is specifically requested.`,
    balanced: `Provide helpful detail without being overwhelming. 3-5 sentences for simple queries, more for complex topics.`,
    detailed: `Give thorough, comprehensive responses. Include context, examples, and additional relevant information.`
  }

  const traitInstructions: Record<AIPersonalityTrait, string> = {
    analytical: `Analyze patterns and provide data-driven insights.`,
    supportive: `Offer encouragement and validate the user's efforts.`,
    motivational: `Inspire action and celebrate progress.`,
    direct: `Be straightforward and get to the point quickly.`,
    nurturing: `Show care and provide gentle guidance.`,
    humorous: `Use light humor when appropriate to keep interactions enjoyable.`
  }

  let prompt = `You are ${personality.name}, the user's personal AI assistant.\n\n`
  
  // Voice style
  prompt += `**Communication Style:**\n${voiceInstructions[personality.voiceStyle]}\n\n`
  
  // Verbosity
  prompt += `**Response Length:**\n${verbosityInstructions[personality.verbosity]}\n\n`
  
  // Traits
  if (personality.traits.length > 0) {
    prompt += `**Personality Traits:**\n`
    personality.traits.forEach(trait => {
      prompt += `- ${traitInstructions[trait]}\n`
    })
    prompt += '\n'
  }

  // Emoji usage
  if (personality.useEmoji) {
    prompt += `Use relevant emojis to add warmth and visual clarity to your responses.\n`
  } else {
    prompt += `Do NOT use emojis in your responses. Keep text professional and clean.\n`
  }

  // Encouragement
  if (personality.encouragementLevel !== 'none') {
    const encouragementMap = {
      high: `Frequently celebrate achievements and encourage continued progress. Be enthusiastic about wins.`,
      medium: `Acknowledge achievements and offer encouragement when appropriate.`,
      low: `Minimize praise and focus primarily on information delivery.`
    }
    prompt += `${encouragementMap[personality.encouragementLevel]}\n`
  }

  // Proactivity
  if (personality.proactivity !== 'ask-only') {
    const proactivityMap = {
      high: `Proactively offer insights, suggestions, and observations based on user data. Anticipate needs.`,
      medium: `Occasionally offer relevant insights when they naturally connect to the conversation.`,
      low: `Focus on answering what's asked. Only offer suggestions when directly relevant.`
    }
    prompt += `${proactivityMap[personality.proactivity]}\n`
  }

  // Follow-ups
  if (personality.suggestFollowUps) {
    prompt += `\nWhen appropriate, suggest logical next steps or follow-up actions the user might want to take.\n`
  }

  // Priority domains
  if (personality.priorityDomains.length > 0) {
    prompt += `\n**Focus Areas:** When multiple domains are relevant, prioritize ${personality.priorityDomains.join(', ')}.\n`
  }

  return prompt
}

// ============================================
// FOLLOW-UP SUGGESTIONS SYSTEM
// ============================================

export interface FollowUpSuggestion {
  id: string
  label: string
  action: 'command' | 'question' | 'navigation' | 'quick-log'
  value: string  // The command/question/path to execute
  icon?: string
  category?: string
}

export interface AIResponseEnhanced {
  message: string
  followUps?: FollowUpSuggestion[]
  quickActions?: QuickAction[]
  relatedInsights?: string[]
  reasoning?: string
  confidence?: number
  visualizations?: any[]
  metadata?: {
    processingTime?: number
    tokensUsed?: number
    domain?: string
    actionTaken?: string
  }
}

export interface QuickAction {
  id: string
  label: string
  type: 'log' | 'view' | 'create' | 'analyze' | 'export'
  params: Record<string, any>
  icon?: string
}

// Generate contextual follow-up suggestions based on the action taken
export function generateFollowUps(
  action: string,
  domain: string,
  data?: any
): FollowUpSuggestion[] {
  const followUps: FollowUpSuggestion[] = []
  
  // Domain-specific follow-ups
  const domainFollowUps: Record<string, FollowUpSuggestion[]> = {
    financial: [
      { id: 'fin-1', label: 'View my spending this week', action: 'question', value: 'How much did I spend this week?', icon: '💰' },
      { id: 'fin-2', label: 'Log another expense', action: 'command', value: '', icon: '➕' },
      { id: 'fin-3', label: 'See spending by category', action: 'question', value: 'Show my spending by category', icon: '📊' },
      { id: 'fin-4', label: 'Open Finance dashboard', action: 'navigation', value: '/domains/financial', icon: '📈' }
    ],
    health: [
      { id: 'health-1', label: 'View health trends', action: 'question', value: 'Show my health trends this month', icon: '📊' },
      { id: 'health-2', label: 'Log another measurement', action: 'command', value: '', icon: '➕' },
      { id: 'health-3', label: 'See workout history', action: 'question', value: 'What workouts have I done recently?', icon: '💪' },
      { id: 'health-4', label: 'Open Health dashboard', action: 'navigation', value: '/domains/health', icon: '❤️' }
    ],
    fitness: [
      { id: 'fit-1', label: 'View workout stats', action: 'question', value: 'Show my workout stats this week', icon: '📊' },
      { id: 'fit-2', label: 'Log another workout', action: 'command', value: '', icon: '🏋️' },
      { id: 'fit-3', label: 'Compare to last week', action: 'question', value: 'Compare my fitness this week vs last week', icon: '📈' }
    ],
    nutrition: [
      { id: 'nutr-1', label: 'View calorie intake today', action: 'question', value: 'How many calories have I eaten today?', icon: '🍽️' },
      { id: 'nutr-2', label: 'Log another meal', action: 'command', value: '', icon: '➕' },
      { id: 'nutr-3', label: 'See nutrition trends', action: 'question', value: 'Show my nutrition trends this week', icon: '📊' },
      { id: 'nutr-4', label: 'Log water intake', action: 'quick-log', value: 'log 8oz water', icon: '💧' }
    ],
    tasks: [
      { id: 'task-1', label: 'View today\'s tasks', action: 'question', value: 'What tasks are due today?', icon: '📋' },
      { id: 'task-2', label: 'Add another task', action: 'command', value: '', icon: '➕' },
      { id: 'task-3', label: 'Show overdue tasks', action: 'question', value: 'What tasks are overdue?', icon: '⚠️' },
      { id: 'task-4', label: 'View completed tasks', action: 'question', value: 'What did I complete this week?', icon: '✅' }
    ],
    vehicles: [
      { id: 'veh-1', label: 'View maintenance schedule', action: 'question', value: 'When is my next car service due?', icon: '🔧' },
      { id: 'veh-2', label: 'Log fuel expense', action: 'command', value: '', icon: '⛽' },
      { id: 'veh-3', label: 'See vehicle expenses', action: 'question', value: 'How much have I spent on my car?', icon: '💰' }
    ],
    career: [
      { id: 'car-1', label: 'View upcoming interviews', action: 'question', value: 'What interviews do I have scheduled?', icon: '📅' },
      { id: 'car-2', label: 'Log work achievement', action: 'command', value: '', icon: '🏆' },
      { id: 'car-3', label: 'See career progress', action: 'question', value: 'Show my career highlights this year', icon: '📈' }
    ]
  }

  // Action-specific follow-ups
  const actionFollowUps: Record<string, FollowUpSuggestion[]> = {
    create_entry: [
      { id: 'act-1', label: 'Add another entry', action: 'command', value: '', icon: '➕' },
      { id: 'act-2', label: 'View recent entries', action: 'question', value: `Show my recent ${domain} entries`, icon: '📋' }
    ],
    complete_task: [
      { id: 'act-3', label: 'What\'s next?', action: 'question', value: 'What should I work on next?', icon: '➡️' },
      { id: 'act-4', label: 'View remaining tasks', action: 'question', value: 'What tasks are left today?', icon: '📋' }
    ],
    complete_habit: [
      { id: 'act-5', label: 'Check my streaks', action: 'question', value: 'How are my habit streaks?', icon: '🔥' },
      { id: 'act-6', label: 'View habit progress', action: 'navigation', value: '/habits', icon: '📊' }
    ],
    analyze: [
      { id: 'act-7', label: 'Export this data', action: 'command', value: `export ${domain} data as csv`, icon: '📤' },
      { id: 'act-8', label: 'See recommendations', action: 'question', value: 'What do you recommend based on this?', icon: '💡' }
    ],
    query: [
      { id: 'act-9', label: 'Create chart', action: 'command', value: `create chart of ${domain}`, icon: '📊' },
      { id: 'act-10', label: 'Compare time periods', action: 'question', value: `Compare my ${domain} this month vs last month`, icon: '📈' }
    ]
  }

  // Add domain-specific follow-ups (limit to 3)
  if (domainFollowUps[domain]) {
    followUps.push(...domainFollowUps[domain].slice(0, 3))
  }

  // Add action-specific follow-ups (limit to 2)
  if (actionFollowUps[action]) {
    followUps.push(...actionFollowUps[action].slice(0, 2))
  }

  // Add generic follow-ups if we don't have enough
  if (followUps.length < 3) {
    followUps.push(
      { id: 'gen-1', label: 'Ask a question', action: 'command', value: '', icon: '❓' },
      { id: 'gen-2', label: 'View dashboard', action: 'navigation', value: '/dashboard', icon: '🏠' }
    )
  }

  return followUps.slice(0, 4) // Max 4 follow-ups
}

// ============================================
// QUICK ACTIONS GENERATOR
// ============================================

export function generateQuickActions(
  domain: string,
  context?: { lastEntry?: any; userPatterns?: any }
): QuickAction[] {
  const quickActions: QuickAction[] = []

  // Domain-specific quick actions
  switch (domain) {
    case 'financial':
      quickActions.push(
        { id: 'qa-1', label: '+ Expense', type: 'log', params: { domain: 'financial', type: 'expense' }, icon: '💸' },
        { id: 'qa-2', label: '+ Income', type: 'log', params: { domain: 'financial', type: 'income' }, icon: '💰' },
        { id: 'qa-3', label: 'Analyze Spending', type: 'analyze', params: { domain: 'financial', analysis: 'spending' }, icon: '📊' }
      )
      break
    case 'health':
      quickActions.push(
        { id: 'qa-4', label: '+ Weight', type: 'log', params: { domain: 'health', type: 'weight' }, icon: '⚖️' },
        { id: 'qa-5', label: '+ Blood Pressure', type: 'log', params: { domain: 'health', type: 'blood_pressure' }, icon: '❤️' },
        { id: 'qa-6', label: '+ Sleep', type: 'log', params: { domain: 'health', type: 'sleep' }, icon: '😴' }
      )
      break
    case 'nutrition':
      quickActions.push(
        { id: 'qa-7', label: '+ Meal', type: 'log', params: { domain: 'nutrition', type: 'meal' }, icon: '🍽️' },
        { id: 'qa-8', label: '+ Water (8oz)', type: 'log', params: { domain: 'nutrition', type: 'water', amount: 8 }, icon: '💧' },
        { id: 'qa-9', label: 'Daily Summary', type: 'analyze', params: { domain: 'nutrition', analysis: 'daily' }, icon: '📋' }
      )
      break
    case 'fitness':
      quickActions.push(
        { id: 'qa-10', label: '+ Workout', type: 'log', params: { domain: 'fitness', type: 'workout' }, icon: '🏋️' },
        { id: 'qa-11', label: '+ Steps', type: 'log', params: { domain: 'fitness', type: 'steps' }, icon: '👟' },
        { id: 'qa-12', label: 'Weekly Stats', type: 'analyze', params: { domain: 'fitness', analysis: 'weekly' }, icon: '📊' }
      )
      break
    default:
      quickActions.push(
        { id: 'qa-default-1', label: '+ Entry', type: 'log', params: { domain }, icon: '➕' },
        { id: 'qa-default-2', label: 'View Data', type: 'view', params: { domain }, icon: '👁️' }
      )
  }

  return quickActions.slice(0, 3) // Max 3 quick actions
}

// ============================================
// EXPORT PERSONALITY UTILITIES
// ============================================

export function mergePersonality(base: AIPersonality, override: Partial<AIPersonality>): AIPersonality {
  return {
    ...base,
    ...override,
    traits: override.traits || base.traits,
    priorityDomains: override.priorityDomains || base.priorityDomains,
    domainExpertise: { ...base.domainExpertise, ...override.domainExpertise }
  }
}

export function getPersonalityPreset(presetName: string): AIPersonality {
  const preset = PERSONALITY_PRESETS[presetName]
  if (!preset) {
    return DEFAULT_PERSONALITY
  }
  return mergePersonality(DEFAULT_PERSONALITY, preset)
}



