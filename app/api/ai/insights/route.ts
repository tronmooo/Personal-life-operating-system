import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// AI Settings interface
interface AISettings {
  aiName: string
  responseStyle: 'concise' | 'detailed' | 'conversational'
  proactiveInsights: boolean
  tone: 'professional' | 'friendly' | 'casual'
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
  modelVersion: 'gpt-4' | 'gpt-3.5' | 'claude-3'
  maxTokens: number
  temperature: number
  focusAreas: string[]
  priorityDomains: string[]
}

const DEFAULT_AI_SETTINGS: AISettings = {
  aiName: 'AI Assistant',
  responseStyle: 'conversational',
  proactiveInsights: true,
  tone: 'friendly',
  expertiseLevel: 'intermediate',
  modelVersion: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  focusAreas: ['Financial Health', 'Physical Health', 'Productivity'],
  priorityDomains: ['financial', 'health', 'career']
}

async function getUserAISettings(supabase: any, userId: string): Promise<AISettings> {
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.settings) {
      return { ...DEFAULT_AI_SETTINGS, ...data.settings }
    }
  } catch (error) {
    console.error('Error fetching AI settings:', error)
  }
  return DEFAULT_AI_SETTINGS
}

function buildInsightsPrompt(prompt: string, settings: AISettings): string {
  const toneMap = {
    professional: 'formal and precise',
    friendly: 'warm and encouraging',
    casual: 'relaxed and conversational'
  }

  const expertiseMap = {
    beginner: 'simple explanations without jargon',
    intermediate: 'balanced explanations with some technical detail',
    advanced: 'detailed technical analysis'
  }

  return `You are ${settings.aiName}, an AI assistant providing insights.

Communication Style: Use a ${toneMap[settings.tone]} tone with ${expertiseMap[settings.expertiseLevel]}.

Focus Areas: ${settings.focusAreas.join(', ')}
Priority Domains: ${settings.priorityDomains.join(', ')}

${prompt}

When generating insights, prioritize those related to the user's focus areas and priority domains.`
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, data } = await request.json()

    // Fetch user's AI settings
    const aiSettings = await getUserAISettings(supabase, user.id)

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('Gemini API key not configured, using fallback insights')
      return NextResponse.json({
        success: true,
        insights: getFallbackInsights(data, aiSettings),
        source: 'fallback',
        aiName: aiSettings.aiName
      })
    }

    // Build enhanced prompt with user settings
    const enhancedPrompt = buildInsightsPrompt(prompt, aiSettings)

    // Generate insights using Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: aiSettings.temperature,
        maxOutputTokens: aiSettings.maxTokens
      }
    })

    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          success: true,
          insights,
          source: 'ai',
          aiName: aiSettings.aiName
        })
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }

    // Fallback if parsing fails
    return NextResponse.json({
      success: true,
      insights: getFallbackInsights(data, aiSettings),
      source: 'fallback',
      aiName: aiSettings.aiName
    })
  } catch (error: any) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

function getFallbackInsights(data: any, settings: AISettings) {
  const insights: any[] = []

  // Generate insights based on user's focus areas
  const isFocusedOnFinance = settings.focusAreas.includes('Financial Health') || settings.priorityDomains.includes('financial')
  const isFocusedOnHealth = settings.focusAreas.includes('Physical Health') || settings.priorityDomains.includes('health')
  const isFocusedOnProductivity = settings.focusAreas.includes('Productivity') || settings.priorityDomains.includes('career')

  if (isFocusedOnFinance) {
    if (data.financialHealth >= 80) {
      insights.push({
        type: 'celebration',
        title: 'Excellent Financial Health',
        message: `Your financial health score of ${data.financialHealth} is outstanding!`,
        priority: 'low',
        actionable: false,
      })
    } else if (data.financialHealth < 60) {
      insights.push({
        type: 'warning',
        title: 'Financial Health Needs Attention',
        message: 'Consider reviewing unpaid bills and setting up automated payments.',
        priority: 'high',
        actionable: true,
        actionLabel: 'View Bills',
      })
    }
  }

  if (data.lifeBalance < 50) {
    insights.push({
      type: 'recommendation',
      title: 'Expand Your Life Balance',
      message: 'Try exploring more domains to get a complete picture of your life.',
      priority: 'medium',
      actionable: true,
      actionLabel: 'Explore Domains',
    })
  }

  if (isFocusedOnProductivity && data.productivity > 80) {
    insights.push({
      type: 'celebration',
      title: 'Productivity Champion',
      message: 'Amazing! Your task completion rate shows you\'re crushing your goals.',
      priority: 'low',
      actionable: false,
    })
  }

  if (isFocusedOnHealth && data.healthScore !== undefined) {
    if (data.healthScore >= 80) {
      insights.push({
        type: 'celebration',
        title: 'Health Goals On Track',
        message: 'Your health tracking shows great progress. Keep up the momentum!',
        priority: 'low',
        actionable: false,
      })
    } else if (data.healthScore < 50) {
      insights.push({
        type: 'recommendation',
        title: 'Health Check-in Recommended',
        message: 'Consider logging more health data to get personalized insights.',
        priority: 'medium',
        actionable: true,
        actionLabel: 'Log Health Data',
      })
    }
  }

  return insights
}
