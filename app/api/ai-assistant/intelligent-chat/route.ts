import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { IntelligentAssistant, type AIContext } from '@/lib/ai/intelligent-assistant'
import type { Domain } from '@/types/domains'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Intelligent AI Assistant Chat API
 * 
 * This endpoint provides true AI-powered responses using GPT-4.
 * Replaces the rule-based assistant with genuine intelligence.
 * 
 * POST /api/ai-assistant/intelligent-chat
 * Body: {
 *   message: string
 *   conversationId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // For Edge runtime, extract session from Supabase auth cookie
    // The cookie name follows the pattern: sb-<project-ref>-auth-token
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    const authCookieName = `sb-${projectRef}-auth-token`
    const authCookie = request.cookies.get(authCookieName)?.value
    
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Parse the auth cookie to extract access token
    let accessToken: string | null = null
    try {
      const parsed = JSON.parse(authCookie)
      // Supabase stores tokens in an array format or object
      accessToken = parsed?.access_token || parsed?.[0]?.access_token || null
    } catch {
      // If not JSON, try using the cookie value directly
      accessToken = authCookie
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Invalid session - Please sign in again' },
        { status: 401 }
      )
    }

    // Create Supabase client with the user's access token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Session expired - Please sign in again' },
        { status: 401 }
      )
    }

    // Fetch user's data for context
    const context = await buildUserContext(supabase, user.id)

    // Initialize AI assistant
    const assistant = new IntelligentAssistant({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
    })

    // Get AI response
    const response = await assistant.chat(message, context, conversationId)

    // Apply data updates if any (user must confirm)
    // For now, we just return them to the client for approval

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error: any) {
    console.error('Intelligent chat error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI request',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Build user context from Supabase data
 */
async function buildUserContext(supabase: any, userId: string): Promise<AIContext> {
  const context: AIContext = {
    userId,
    domainData: {},
    recentActivity: [],
    goals: [],
  }

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      context.userProfile = {
        name: profile.full_name,
        preferences: profile.preferences || {},
      }
    }

    // Fetch domain entries (grouped by domain)
    const { data: entries } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent entries for context size

    if (entries) {
      // Group by domain
      for (const entry of entries) {
        const domain = entry.domain as Domain
        const domainData = context.domainData!
        if (!domainData[domain]) {
          domainData[domain] = []
        }
        domainData[domain]!.push({
          id: entry.id,
          domain: entry.domain,
          title: entry.title,
          description: entry.description,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at,
          metadata: entry.metadata,
        })
      }

      // Extract recent activity
      context.recentActivity = entries.slice(0, 10).map((entry: any) => ({
        domain: entry.domain,
        action: 'created',
        timestamp: entry.created_at,
      }))

      // Extract goals (entries with type: 'goal')
      context.goals = entries
        .filter((e: any) => e.metadata?.type === 'goal')
        .map((entry: any) => ({
          id: entry.id,
          title: entry.title,
          domain: entry.domain,
          target: entry.metadata?.target || {},
          progress: entry.metadata?.progress || 0,
        }))
    }
  } catch (error) {
    console.error('Error building user context:', error)
    // Continue with partial context
  }

  return context
}

/**
 * Stream response (for future implementation)
 * This would allow real-time streaming of AI responses
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to chat with the AI assistant',
    endpoint: '/api/ai-assistant/intelligent-chat',
  })
}



























