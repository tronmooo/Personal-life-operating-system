import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdvisor } from '@/lib/ai/specialized-advisors'
import type { Domain } from '@/types/domains'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Specialized AI Advisor API
 * 
 * Get domain-specific advice from specialized AI advisors
 * 
 * POST /api/ai-advisor
 * Body: {
 *   domain: Domain
 *   question: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, question } = body

    if (!domain || !question) {
      return NextResponse.json(
        { error: 'Domain and question are required' },
        { status: 400 }
      )
    }

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch domain data for context
    const { data: entries } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(20)

    const context = {
      userId: user.id,
      domain,
      items: entries || [],
    }

    // Get specialized advisor
    const advisor = getAdvisor(domain as Domain, process.env.OPENAI_API_KEY)
    
    // Get advice
    const advice = await advisor.ask(question, context)

    return NextResponse.json({
      success: true,
      advice,
      advisor: domain,
    })
  } catch (error: any) {
    console.error('AI advisor error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get advice',
        details: error.message,
      },
      { status: 500 }
    )
  }
}




































