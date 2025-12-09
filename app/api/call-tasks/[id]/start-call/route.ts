import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { createTwilioService } from '@/lib/services/twilio-voice-service'
import { generateCallScript } from '@/lib/services/call-ai-helper'

/**
 * POST /api/call-tasks/:id/start-call
 * 
 * Initiates an actual phone call for a call task
 * 
 * Preconditions:
 * - call_task.status must be 'ready_to_call'
 * - Must have target phone number or contact
 * 
 * Process:
 * 1. Fetch call task, user, assistant settings, contact
 * 2. Generate AI call script plan
 * 3. Initiate call via Twilio
 * 4. Create call_session record
 * 5. Update call_task status to 'in_progress'
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

    // Fetch call task with contact
    const { data: callTask, error: taskError } = await supabase
      .from('call_tasks')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (taskError || !callTask) {
      return NextResponse.json(
        { error: 'Call task not found' },
        { status: 404 }
      )
    }

    // Validate status
    if (callTask.status !== 'ready_to_call') {
      return NextResponse.json({
        error: 'Call task is not ready',
        current_status: callTask.status,
        message: 'Task must be in ready_to_call status to initiate call'
      }, { status: 400 })
    }

    // Get phone number
    let phoneNumber: string | null = null
    let contactName: string | null = null

    if (callTask.contact) {
      phoneNumber = callTask.contact.phone_number
      contactName = callTask.contact.company_name || callTask.contact.name
    } else if (callTask.target_phone_number) {
      phoneNumber = callTask.target_phone_number
      contactName = 'Unknown'
    }

    if (!phoneNumber) {
      return NextResponse.json({
        error: 'No phone number available',
        message: 'Call task must have either a contact or target_phone_number'
      }, { status: 400 })
    }

    // Fetch user settings and assistant settings
    const [userSettingsResult, assistantSettingsResult] = await Promise.all([
      supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('assistant_settings').select('*').eq('user_id', user.id).maybeSingle()
    ])

    const userSettings = userSettingsResult.data
    const assistantSettings = assistantSettingsResult.data

    // Build user profile for AI
    const userProfile = {
      id: user.id,
      name: userSettings?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      phone: userSettings?.phone,
      timezone: userSettings?.timezone || 'America/Los_Angeles'
    }

    // Determine call tone
    const tone = callTask.tone || assistantSettings?.default_call_tone || 'friendly'

    // Get AI plan from call task
    const aiPlan = callTask.ai_plan as any

    console.log('🤖 Generating call script for task:', callTask.title)

    // Generate call script using AI
    const callScript = await generateCallScript(
      aiPlan || { goal: callTask.title, steps: [], questionsToAsk: [], missingInfo: [], requiresClarification: false, hardConstraints: callTask.hard_constraints || {}, softPreferences: callTask.soft_preferences || {} },
      userProfile,
      callTask.contact ? 'business' : 'person'
    )

    console.log('✅ Call script generated')

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Twilio not configured',
        message: 'Voice calling requires Twilio credentials in environment variables',
        simulation: true
      }, { status: 500 })
    }

    // Initiate call via Twilio
    console.log('📞 Initiating Twilio call to:', phoneNumber)
    
    const twilioService = createTwilioService()
    
    const call = await twilioService.makeCall({
      to: phoneNumber,
      businessName: contactName || 'Contact',
      userRequest: aiPlan?.goal || callTask.raw_instruction,
      category: 'task',
      context: {
        userId: user.id,
        businessName: contactName || 'Contact',
        businessPhone: phoneNumber,
        userRequest: aiPlan?.goal || callTask.raw_instruction,
        category: 'task',
        userLocation: undefined,
        userData: {
          name: userProfile.name,
          phone: userProfile.phone,
          email: userProfile.email,
          constraints: callTask.hard_constraints,
          preferences: callTask.soft_preferences,
          maxPrice: callTask.max_price
        } as any
      }
    })

    console.log('✅ Twilio call initiated. SID:', call.callSid)

    // Create call session record
    const { data: callSession, error: sessionError } = await supabase
      .from('call_sessions')
      .insert({
        call_task_id: callTask.id,
        user_id: user.id,
        call_provider_call_id: call.callSid,
        status: 'initiated',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Failed to create call session:', sessionError)
      // Continue anyway - the call is initiated
    }

    // Create transcript record
    if (callSession) {
      await supabase.from('call_transcripts').insert({
        call_session_id: callSession.id,
        full_text: ''
      })
    }

    // Update call task status
    const { error: updateError } = await supabase
      .from('call_tasks')
      .update({ status: 'in_progress' })
      .eq('id', callTask.id)

    if (updateError) {
      console.error('❌ Failed to update call task status:', updateError)
    }

    console.log('✅ Call session created and task status updated to in_progress')

    return NextResponse.json({
      success: true,
      call_session: callSession,
      call_sid: call.callSid,
      status: call.status,
      message: 'Call initiated successfully',
      phone_number: phoneNumber,
      contact_name: contactName,
      call_script: callScript
    })

  } catch (error: any) {
    console.error('❌ Error starting call:', error)
    return NextResponse.json({
      error: 'Failed to start call',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}





















