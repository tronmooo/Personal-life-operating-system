import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { planCallTask } from '@/lib/services/call-ai-helper'

/**
 * POST /api/call-tasks
 * 
 * Create a new call task
 * - Parses raw instruction using AI
 * - Extracts constraints and preferences
 * - Determines if clarification is needed
 * - Stores task with initial status
 */
export async function POST(request: NextRequest) {
  try {
    const {
      raw_instruction,
      contact_id,
      phone_number,
      max_price,
      tone,
      priority
    } = await request.json()

    if (!raw_instruction || typeof raw_instruction !== 'string') {
      return NextResponse.json(
        { error: 'raw_instruction is required and must be a string' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user profile and contacts for context
    const [userProfileResult, contactsResult] = await Promise.all([
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .limit(50) // Recent contacts for AI context
    ])

    const userProfile = userProfileResult.data
    const existingContacts = contactsResult.data || []

    console.log('🤖 Parsing call task with AI:', raw_instruction)

    // Use AI to parse and plan the call task
    const aiPlan = await planCallTask(
      raw_instruction,
      userProfile,
      existingContacts
    )

    console.log('✅ AI Plan generated:', JSON.stringify(aiPlan, null, 2))

    // Generate a title from the raw instruction (first 50 chars or goal)
    const title = aiPlan.goal.substring(0, 100) || raw_instruction.substring(0, 100)

    // Determine initial status
    let status: string
    if (aiPlan.missingInfo.length > 0 || aiPlan.requiresClarification) {
      status = 'waiting_for_user'
    } else {
      status = 'ready_to_call'
    }

    // Determine target phone number
    let targetPhone = phone_number
    if (!targetPhone && aiPlan.contactInfo?.phone) {
      targetPhone = aiPlan.contactInfo.phone
    }

    // Insert call task
    const { data: callTask, error: insertError } = await supabase
      .from('call_tasks')
      .insert({
        user_id: user.id,
        title,
        raw_instruction,
        status,
        priority: priority || 'normal',
        contact_id: contact_id || null,
        target_phone_number: targetPhone || null,
        tone: tone || aiPlan.tone || null,
        max_price: max_price !== undefined ? max_price : aiPlan.maxPrice,
        hard_constraints: aiPlan.hardConstraints || {},
        soft_preferences: aiPlan.softPreferences || {},
        needs_user_confirmation: aiPlan.requiresClarification,
        ai_plan: {
          goal: aiPlan.goal,
          steps: aiPlan.steps,
          questionsToAsk: aiPlan.questionsToAsk,
          missingInfo: aiPlan.missingInfo,
          contactInfo: aiPlan.contactInfo
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to create call task:', insertError)
      return NextResponse.json(
        { error: 'Failed to create call task', details: insertError.message },
        { status: 500 }
      )
    }

    // If clarification needed, create notification
    if (status === 'waiting_for_user') {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'call_needs_clarification',
        payload: {
          call_task_id: callTask.id,
          title: callTask.title,
          missing_info: aiPlan.missingInfo,
          questions: aiPlan.questionsToAsk
        },
        is_read: false
      })
    }

    console.log('✅ Call task created:', callTask.id, 'Status:', status)

    return NextResponse.json({
      success: true,
      call_task: callTask,
      ai_plan: aiPlan,
      status,
      requires_clarification: status === 'waiting_for_user',
      missing_info: aiPlan.missingInfo
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating call task:', error)
    return NextResponse.json({
      error: 'Failed to create call task',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/call-tasks
 * 
 * List call tasks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('call_tasks')
      .select(`
        *,
        contact:contacts(id, name, company_name, phone_number)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('❌ Failed to fetch call tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch call tasks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('❌ Error fetching call tasks:', error)
    return NextResponse.json({
      error: 'Failed to fetch call tasks',
      message: error.message
    }, { status: 500 })
  }
}




























