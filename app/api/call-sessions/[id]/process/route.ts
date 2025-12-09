import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { summarizeCall } from '@/lib/services/call-ai-helper'

/**
 * POST /api/call-sessions/:id/process
 * 
 * Post-call processing and data extraction
 * 
 * After a call is completed:
 * 1. Fetch full transcript
 * 2. Use AI to summarize and extract structured data
 * 3. Store extracted data (prices, appointments, confirmation numbers, etc.)
 * 4. Update call_task with summary and status
 * 5. Create notification for user
 * 6. Identify if follow-up is needed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch call session with transcript and call task
    const { data: callSession, error: fetchError } = await supabase
      .from('call_sessions')
      .select(`
        *,
        call_task:call_tasks(*),
        transcript:call_transcripts(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !callSession) {
      return NextResponse.json(
        { error: 'Call session not found' },
        { status: 404 }
      )
    }

    // Verify call is completed
    if (callSession.status !== 'completed') {
      return NextResponse.json({
        error: 'Call not completed',
        current_status: callSession.status,
        message: 'Can only process completed calls'
      }, { status: 400 })
    }

    const callTask = callSession.call_task as any
    const transcript = callSession.transcript as any

    if (!transcript || !transcript.full_text || transcript.full_text.trim() === '') {
      return NextResponse.json({
        error: 'No transcript available',
        message: 'Cannot process call without transcript'
      }, { status: 400 })
    }

    console.log('🤖 Processing call transcript with AI...')

    // Get AI plan from call task
    const aiPlan = callTask.ai_plan || {
      goal: callTask.title,
      steps: [],
      questionsToAsk: [],
      missingInfo: [],
      requiresClarification: false,
      hardConstraints: callTask.hard_constraints || {},
      softPreferences: callTask.soft_preferences || {}
    }

    // Use AI to summarize and extract data
    const callSummary = await summarizeCall(transcript.full_text, aiPlan)

    console.log('✅ Call summary generated:', callSummary.goalAchieved ? 'Goal achieved' : 'Goal not achieved')

    // Store extracted data
    const extractedDataPromises: Promise<any>[] = []

    if (callSummary.extractedData) {
      const data = callSummary.extractedData

      // Store prices
      if (data.prices && Array.isArray(data.prices)) {
        for (const price of data.prices) {
          extractedDataPromises.push(
            Promise.resolve(
              supabase
                .from('call_extracted_data')
                .insert({
                  call_session_id: callSession.id,
                  key: 'price',
                  value: price.amount?.toString() || '',
                  value_type: 'number',
                  raw_fragment: JSON.stringify(price)
                })
            )
          )
        }
      }

      // Store appointments
      if (data.appointments && Array.isArray(data.appointments)) {
        for (const apt of data.appointments) {
          extractedDataPromises.push(
            Promise.resolve(
              supabase
                .from('call_extracted_data')
                .insert({
                  call_session_id: callSession.id,
                  key: 'appointment',
                  value: JSON.stringify(apt),
                  value_type: 'json',
                  raw_fragment: `${apt.date} ${apt.time}`
                })
            )
          )
        }
      }

      // Store confirmation numbers
      if (data.confirmationNumbers && Array.isArray(data.confirmationNumbers)) {
        for (const confNum of data.confirmationNumbers) {
          extractedDataPromises.push(
            Promise.resolve(
              supabase
                .from('call_extracted_data')
                .insert({
                  call_session_id: callSession.id,
                  key: 'confirmation_number',
                  value: confNum,
                  value_type: 'string'
                })
            )
          )
        }
      }

      // Store business name
      if (data.businessName) {
        extractedDataPromises.push(
          Promise.resolve(
            supabase
              .from('call_extracted_data')
              .insert({
                call_session_id: callSession.id,
                key: 'business_name',
                value: data.businessName,
                value_type: 'string'
              })
          )
        )
      }

      // Store names
      if (data.names && Array.isArray(data.names)) {
        for (const name of data.names) {
          extractedDataPromises.push(
            Promise.resolve(
              supabase
                .from('call_extracted_data')
                .insert({
                  call_session_id: callSession.id,
                  key: 'contact_name',
                  value: name,
                  value_type: 'string'
                })
            )
          )
        }
      }

      // Store instructions
      if (data.instructions && Array.isArray(data.instructions)) {
        for (const instruction of data.instructions) {
          extractedDataPromises.push(
            Promise.resolve(
              supabase
                .from('call_extracted_data')
                .insert({
                  call_session_id: callSession.id,
                  key: 'instruction',
                  value: instruction,
                  value_type: 'string'
                })
            )
          )
        }
      }
    }

    // Execute all data insertions
    await Promise.all(extractedDataPromises)

    console.log('✅ Extracted data stored')

    // Update call task
    const taskUpdateData: any = {
      summary: callSummary.summary,
      follow_up_required: callSummary.followUpRequired,
      status: callSummary.goalAchieved ? 'completed' : 'failed',
      updated_at: new Date().toISOString()
    }

    if (!callSummary.goalAchieved) {
      taskUpdateData.failure_reason = 'Goal not achieved during call'
    }

    await supabase
      .from('call_tasks')
      .update(taskUpdateData)
      .eq('id', callTask.id)

    console.log('✅ Call task updated:', taskUpdateData.status)

    // Create notification
    const notificationPayload: any = {
      call_task_id: callTask.id,
      call_session_id: callSession.id,
      title: callTask.title,
      summary: callSummary.summary,
      goal_achieved: callSummary.goalAchieved,
      highlights: {}
    }

    // Add highlights to notification
    if (callSummary.extractedData.prices && callSummary.extractedData.prices.length > 0) {
      notificationPayload.highlights.price = callSummary.extractedData.prices[0]
    }
    if (callSummary.extractedData.appointments && callSummary.extractedData.appointments.length > 0) {
      notificationPayload.highlights.appointment = callSummary.extractedData.appointments[0]
    }
    if (callSummary.extractedData.confirmationNumbers && callSummary.extractedData.confirmationNumbers.length > 0) {
      notificationPayload.highlights.confirmation = callSummary.extractedData.confirmationNumbers[0]
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'call_completed',
      payload: notificationPayload,
      is_read: false
    })

    console.log('✅ Notification created')

    // Create follow-up tasks if needed
    if (callSummary.followUpRequired && callSummary.followUpTasks) {
      for (const followUpTask of callSummary.followUpTasks) {
        await supabase.from('call_tasks').insert({
          user_id: user.id,
          title: `Follow-up: ${followUpTask}`,
          raw_instruction: followUpTask,
          status: 'pending',
          priority: 'normal'
        })
      }
      console.log('✅ Follow-up tasks created:', callSummary.followUpTasks.length)
    }

    return NextResponse.json({
      success: true,
      summary: callSummary,
      task_status: taskUpdateData.status,
      extracted_data_count: extractedDataPromises.length,
      follow_up_tasks_created: callSummary.followUpTasks?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Error processing call session:', error)
    return NextResponse.json({
      error: 'Failed to process call session',
      message: error.message
    }, { status: 500 })
  }
}

