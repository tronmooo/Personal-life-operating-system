import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Service role key is required for webhooks because:
// 1. Webhooks don't have user session context
// 2. RLS policies would block updates without proper auth
// 3. The anon key fallback would silently fail to update records
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is required for call status webhook. ' +
    'The anon key cannot update call_sessions due to RLS policies. ' +
    'Please configure SUPABASE_SERVICE_ROLE_KEY in your environment.'
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/webhooks/call-status
 * 
 * Webhook for call provider status updates (Twilio)
 * 
 * Handles: initiated, ringing, in-progress, completed, failed, no-answer, busy, cancelled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData() // Twilio sends form data
    
    const callSid = body.get('CallSid') as string
    const callStatus = body.get('CallStatus') as string
    const callDuration = body.get('CallDuration') as string
    const from = body.get('From') as string
    const to = body.get('To') as string
    const answeredBy = body.get('AnsweredBy') as string // For machine detection

    if (!callSid) {
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 })
    }

    console.log('📞 Call status webhook:', { callSid, callStatus, callDuration, answeredBy })

    // Find call session by provider call ID
    const { data: callSession, error: fetchError } = await supabase
      .from('call_sessions')
      .select('*, call_task:call_tasks(*)')
      .eq('call_provider_call_id', callSid)
      .single()

    if (fetchError || !callSession) {
      console.warn('⚠️ Call session not found for SID:', callSid)
      // Return 200 to acknowledge webhook
      return NextResponse.json({ received: true })
    }

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'connected',
      'answered': 'connected',
      'completed': 'completed',
      'busy': 'failed',
      'failed': 'failed',
      'no-answer': 'failed',
      'canceled': 'cancelled',
      'cancelled': 'cancelled'
    }

    const mappedStatus = statusMap[callStatus.toLowerCase()] || 'failed'

    // Prepare update
    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString()
    }

    // Set ended_at and duration for terminal states
    if (['completed', 'failed', 'cancelled'].includes(mappedStatus)) {
      updateData.ended_at = new Date().toISOString()
      
      if (callDuration && parseInt(callDuration) > 0) {
        updateData.duration_seconds = parseInt(callDuration)
      }

      // Set failure reason for failed calls
      if (mappedStatus === 'failed') {
        let failureReason = `Call ${callStatus}`
        if (answeredBy && answeredBy !== 'human') {
          failureReason = `Answered by ${answeredBy}`
        }
        updateData.failure_reason = failureReason
      }
    }

    // Update call session
    const { error: updateError } = await supabase
      .from('call_sessions')
      .update(updateData)
      .eq('id', callSession.id)

    if (updateError) {
      console.error('❌ Failed to update call session:', updateError)
    }

    // Update call task status
    if (callSession.call_task) {
      const callTask = callSession.call_task as any

      if (mappedStatus === 'completed') {
        // Keep task in 'in_progress' until we process the transcript
        // Processing will mark it as 'completed'
        console.log('✅ Call completed, waiting for transcript processing')
      } else if (mappedStatus === 'failed') {
        // Check if we should retry
        const { data: assistantSettings } = await supabase
          .from('assistant_settings')
          .select('auto_retry_failed_calls, max_retry_attempts')
          .eq('user_id', callTask.user_id)
          .single()

        // Count existing failed sessions
        const { count } = await supabase
          .from('call_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('call_task_id', callTask.id)
          .eq('status', 'failed')

        const failedAttempts = count || 0

        if (
          assistantSettings?.auto_retry_failed_calls &&
          failedAttempts < (assistantSettings.max_retry_attempts || 2)
        ) {
          // Mark task as ready_to_call for retry
          await supabase
            .from('call_tasks')
            .update({
              status: 'ready_to_call',
              failure_reason: `Retry attempt ${failedAttempts + 1}`
            })
            .eq('id', callTask.id)
          
          console.log('🔄 Scheduling retry for call task:', callTask.id)
        } else {
          // Mark task as failed
          await supabase
            .from('call_tasks')
            .update({
              status: 'failed',
              failure_reason: updateData.failure_reason || `Call ${callStatus}`
            })
            .eq('id', callTask.id)

          // Create notification
          await supabase.from('notifications').insert({
            user_id: callTask.user_id,
            type: 'call_failed',
            payload: {
              call_task_id: callTask.id,
              title: callTask.title,
              reason: updateData.failure_reason || `Call ${callStatus}`
            },
            is_read: false
          })

          console.log('❌ Call failed, task marked as failed')
        }
      }
    }

    console.log('✅ Call status updated:', mappedStatus)

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Error processing call status webhook:', error)
    // Return 200 to prevent Twilio from retrying
    return NextResponse.json({ received: true, error: error.message })
  }
}























