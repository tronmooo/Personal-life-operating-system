/**
 * Enhanced AI Assistant API
 * Provides advanced features: personality, learning, follow-ups, and digest
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { 
  AIPersonality, 
  DEFAULT_PERSONALITY, 
  buildPersonalityPrompt, 
  generateFollowUps, 
  generateQuickActions,
  getPersonalityPreset,
  type AIResponseEnhanced
} from '@/lib/ai/enhanced-ai-personality'
import {
  UserPattern,
  DEFAULT_USER_PATTERN,
  learnFromCommand,
  learnEntities,
  buildLearningContext,
  getSmartSuggestions,
  createInitialLearningData,
  type UserLearningData
} from '@/lib/ai/user-learning-system'
import {
  generateWeeklyDigest,
  formatDigestAsText,
  formatDigestAsHTML,
  type DigestGenerationInput
} from '@/lib/ai/weekly-digest-generator'
import { generateProactiveInsights, type InsightContext } from '@/lib/ai/proactive-insights-engine'

// ============================================
// GET: Retrieve enhanced AI features
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'personality':
        return await getPersonality(supabase, user.id)
      
      case 'learning':
        return await getLearningData(supabase, user.id)
      
      case 'suggestions':
        return await getSmartSuggestionsForUser(supabase, user.id)
      
      case 'insights':
        return await getProactiveInsights(supabase, user.id)
      
      case 'digest':
        const format = searchParams.get('format') || 'json'
        return await getWeeklyDigest(supabase, user.id, format)
      
      case 'presets':
        return NextResponse.json({
          presets: [
            { id: 'productivity-coach', name: 'Productivity Coach', description: 'Focused on tasks and career' },
            { id: 'wellness-guide', name: 'Wellness Guide', description: 'Health and mindfulness focused' },
            { id: 'finance-advisor', name: 'Finance Advisor', description: 'Professional financial guidance' },
            { id: 'life-organizer', name: 'Life Organizer', description: 'General life management' },
            { id: 'minimal-assistant', name: 'Minimal Assistant', description: 'Brief, to-the-point responses' }
          ]
        })
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          availableActions: ['personality', 'learning', 'suggestions', 'insights', 'digest', 'presets']
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('❌ Enhanced AI GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================
// POST: Update settings or learn from interactions
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-personality':
        return await updatePersonality(supabase, user.id, body.personality)
      
      case 'apply-preset':
        return await applyPersonalityPreset(supabase, user.id, body.presetId)
      
      case 'learn-command':
        return await recordCommandLearning(supabase, user.id, body.command, body.domain, body.success)
      
      case 'learn-entity':
        return await recordEntityLearning(supabase, user.id, body.message, body.domain)
      
      case 'get-follow-ups':
        return await getFollowUpSuggestions(body.action, body.domain, body.data)
      
      case 'get-quick-actions':
        return await getQuickActionsForDomain(body.domain)
      
      case 'generate-digest':
        return await generateAndSaveDigest(supabase, user.id)
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          availableActions: [
            'update-personality', 'apply-preset', 'learn-command', 
            'learn-entity', 'get-follow-ups', 'get-quick-actions', 'generate-digest'
          ]
        }, { status: 400 })
    }
  } catch (error: any) {
    console.error('❌ Enhanced AI POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================
// PERSONALITY FUNCTIONS
// ============================================

async function getPersonality(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const personality: AIPersonality = data?.settings?.aiPersonality || DEFAULT_PERSONALITY
  const prompt = buildPersonalityPrompt(personality)

  return NextResponse.json({
    personality,
    generatedPrompt: prompt
  })
}

async function updatePersonality(supabase: any, userId: string, personalityUpdate: Partial<AIPersonality>) {
  // Get current settings
  const { data: currentData } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const currentSettings = currentData?.settings || {}
  const currentPersonality: AIPersonality = currentSettings.aiPersonality || DEFAULT_PERSONALITY

  // Merge updates
  const updatedPersonality: AIPersonality = {
    ...currentPersonality,
    ...personalityUpdate
  }

  // Save
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: {
        ...currentSettings,
        aiPersonality: updatedPersonality
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating personality:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    personality: updatedPersonality,
    message: `AI personality updated to ${updatedPersonality.name} with ${updatedPersonality.voiceStyle} style`
  })
}

async function applyPersonalityPreset(supabase: any, userId: string, presetId: string) {
  const personality = getPersonalityPreset(presetId)
  return await updatePersonality(supabase, userId, personality)
}

// ============================================
// LEARNING FUNCTIONS
// ============================================

async function getLearningData(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const learningData: UserLearningData = data?.settings?.learningData || createInitialLearningData(userId)

  return NextResponse.json({
    learningData,
    topPatterns: learningData.patterns.commonCommands.slice(0, 10),
    knownEntities: learningData.patterns.knownEntities.slice(0, 20),
    domainEngagement: learningData.patterns.domainEngagement
  })
}

async function recordCommandLearning(
  supabase: any, 
  userId: string, 
  command: string, 
  domain: string, 
  success: boolean
) {
  // Get current learning data
  const { data: currentData } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const currentSettings = currentData?.settings || {}
  let learningData: UserLearningData = currentSettings.learningData || createInitialLearningData(userId)

  // Learn from command
  learningData.patterns = learnFromCommand(learningData.patterns, command, domain, success)
  learningData.lastUpdated = new Date().toISOString()

  // Save
  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: {
        ...currentSettings,
        learningData
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  return NextResponse.json({
    success: true,
    message: 'Command pattern recorded',
    patternsCount: learningData.patterns.commonCommands.length
  })
}

async function recordEntityLearning(supabase: any, userId: string, message: string, domain: string) {
  // Get current learning data
  const { data: currentData } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const currentSettings = currentData?.settings || {}
  let learningData: UserLearningData = currentSettings.learningData || createInitialLearningData(userId)

  // Learn entities
  learningData.patterns = learnEntities(learningData.patterns, message, domain)
  learningData.lastUpdated = new Date().toISOString()

  // Save
  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: {
        ...currentSettings,
        learningData
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  return NextResponse.json({
    success: true,
    entitiesCount: learningData.patterns.knownEntities.length
  })
}

async function getSmartSuggestionsForUser(supabase: any, userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  const learningData: UserLearningData = data?.settings?.learningData || createInitialLearningData(userId)
  const suggestions = getSmartSuggestions(learningData.patterns)

  return NextResponse.json({ suggestions })
}

// ============================================
// FOLLOW-UP & QUICK ACTIONS
// ============================================

async function getFollowUpSuggestions(action: string, domain: string, data: any) {
  const followUps = generateFollowUps(action, domain, data)
  return NextResponse.json({ followUps })
}

async function getQuickActionsForDomain(domain: string) {
  const quickActions = generateQuickActions(domain)
  return NextResponse.json({ quickActions })
}

// ============================================
// INSIGHTS & DIGEST
// ============================================

async function getProactiveInsights(supabase: any, userId: string) {
  // Fetch user data for insights
  const [
    { data: domainEntries },
    { data: tasks },
    { data: habits },
    { data: bills },
    { data: goals }
  ] = await Promise.all([
    supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('domain', 'goals')
  ])

  // Group entries by domain
  const domains: Record<string, any[]> = {}
  ;(domainEntries || []).forEach((entry: any) => {
    if (!domains[entry.domain]) domains[entry.domain] = []
    domains[entry.domain].push(entry)
  })

  const context: InsightContext = {
    userId,
    domains,
    tasks: tasks || [],
    habits: habits || [],
    bills: bills || [],
    events: [],
    goals: goals || []
  }

  const insights = generateProactiveInsights(context)

  return NextResponse.json({
    insights,
    highPriority: insights.filter(i => i.priority === 'high'),
    celebrations: insights.filter(i => i.type === 'celebration'),
    suggestions: insights.filter(i => i.type === 'suggestion')
  })
}

async function getWeeklyDigest(supabase: any, userId: string, format: string) {
  // Fetch all required data
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: currentEntries },
    { data: previousEntries },
    { data: tasks },
    { data: habits },
    { data: bills },
    { data: goals }
  ] = await Promise.all([
    supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo),
    supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twoWeeksAgo)
      .lt('created_at', weekAgo),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('domain', 'goals')
  ])

  // Group entries by domain
  const domainEntries: Record<string, any[]> = {}
  ;(currentEntries || []).forEach((entry: any) => {
    if (!domainEntries[entry.domain]) domainEntries[entry.domain] = []
    domainEntries[entry.domain].push(entry)
  })

  const previousWeekEntries: Record<string, any[]> = {}
  ;(previousEntries || []).forEach((entry: any) => {
    if (!previousWeekEntries[entry.domain]) previousWeekEntries[entry.domain] = []
    previousWeekEntries[entry.domain].push(entry)
  })

  const input: DigestGenerationInput = {
    userId,
    domainEntries,
    tasks: tasks || [],
    habits: habits || [],
    bills: bills || [],
    goals: goals || [],
    events: [],
    previousWeekEntries
  }

  const digest = generateWeeklyDigest(input)

  // Return in requested format
  switch (format) {
    case 'text':
      return new NextResponse(formatDigestAsText(digest), {
        headers: { 'Content-Type': 'text/plain' }
      })
    case 'html':
      return new NextResponse(formatDigestAsHTML(digest), {
        headers: { 'Content-Type': 'text/html' }
      })
    default:
      return NextResponse.json(digest)
  }
}

async function generateAndSaveDigest(supabase: any, userId: string) {
  const digestResponse = await getWeeklyDigest(supabase, userId, 'json')
  const digest = await digestResponse.json()

  // Save digest to database for history
  await supabase
    .from('domain_entries')
    .insert({
      user_id: userId,
      domain: 'mindfulness',
      title: `Weekly Digest - ${new Date(digest.weekStart).toLocaleDateString()}`,
      description: `Life Score: ${digest.summary.overallScore}/100 | ${digest.summary.headline}`,
      metadata: {
        type: 'weekly_digest',
        digest,
        generatedAt: new Date().toISOString()
      }
    })

  return NextResponse.json({
    success: true,
    digest,
    message: 'Weekly digest generated and saved'
  })
}



