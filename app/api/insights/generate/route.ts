import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateProactiveInsights, getDailySummary, type InsightContext } from '@/lib/ai/proactive-insights-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optionally accept context from the request
    const body = await request.json().catch(() => ({}))
    const { includeSummary = false, domains: requestDomains } = body

    // Fetch all user data for insights
    const [
      domainEntriesResult,
      tasksResult,
      billsResult,
      habitsResult,
      eventsResult
    ] = await Promise.all([
      supabase.from('domain_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('bills').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('events').select('*').eq('user_id', user.id).gte('date', new Date().toISOString())
    ])

    // Organize domain data
    const domains: Record<string, any[]> = {}
    for (const entry of domainEntriesResult.data || []) {
      const domain = entry.domain as string
      if (!domains[domain]) {
        domains[domain] = []
      }
      domains[domain].push({
        ...entry,
        metadata: entry.metadata
      })
    }

    // Build context
    const context: InsightContext = {
      userId: user.id,
      domains: domains as InsightContext['domains'],
      tasks: tasksResult.data || [],
      bills: billsResult.data || [],
      habits: habitsResult.data || [],
      events: eventsResult.data || [],
      goals: (domains as any).goals || []
    }

    // Generate insights
    const insights = generateProactiveInsights(context)

    // Optionally filter by requested domains
    let filteredInsights = insights
    if (requestDomains && requestDomains.length > 0) {
      filteredInsights = insights.filter(i => 
        !i.domain || requestDomains.includes(i.domain)
      )
    }

    // Generate summary if requested
    let summary: string | undefined
    if (includeSummary) {
      summary = getDailySummary(filteredInsights)
    }

    return NextResponse.json({
      success: true,
      insights: filteredInsights,
      summary,
      counts: {
        total: filteredInsights.length,
        high: filteredInsights.filter(i => i.priority === 'high').length,
        medium: filteredInsights.filter(i => i.priority === 'medium').length,
        low: filteredInsights.filter(i => i.priority === 'low').length,
        celebrations: filteredInsights.filter(i => i.type === 'celebration').length,
        warnings: filteredInsights.filter(i => i.type === 'anomaly').length,
        reminders: filteredInsights.filter(i => i.type === 'reminder').length
      }
    })

  } catch (error: any) {
    console.error('Generate insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // GET method also supported for simple fetch
  return POST(request)
}
