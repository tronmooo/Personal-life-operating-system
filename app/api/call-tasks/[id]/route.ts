import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


/**
 * GET /api/call-tasks/[id]
 * 
 * Get a specific call task with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Fetch call task with related sessions
    const { data: callTask, error } = await supabase
      .from('call_tasks')
      .select(`
        *,
        contact:contacts(id, name, company_name, phone_number, email),
        sessions:call_sessions(
          id,
          status,
          started_at,
          ended_at,
          duration_seconds,
          call_provider_call_id
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ Failed to fetch call task:', error)
      return NextResponse.json(
        { error: 'Call task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      call_task: callTask
    })

  } catch (error: any) {
    console.error('❌ Error fetching call task:', error)
    return NextResponse.json({
      error: 'Failed to fetch call task',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * PATCH /api/call-tasks/[id]
 * 
 * Update call task with clarifications or status changes
 * 
 * Allowed updates:
 * - tone
 * - max_price
 * - hard_constraints
 * - soft_preferences
 * - needs_user_confirmation
 * - status (with validation)
 * - target_phone_number
 * - contact_id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const { id } = params

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch existing task
    const { data: existingTask, error: fetchError } = await supabase
      .from('call_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { error: 'Call task not found' },
        { status: 404 }
      )
    }

    // Validate status transitions
    if (updates.status) {
      const validTransitions: Record<string, string[]> = {
        'pending': ['preparing', 'waiting_for_user', 'ready_to_call', 'cancelled'],
        'preparing': ['waiting_for_user', 'ready_to_call', 'cancelled'],
        'waiting_for_user': ['ready_to_call', 'cancelled'],
        'ready_to_call': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'failed', 'cancelled'],
        'completed': [],
        'failed': ['ready_to_call', 'cancelled'],
        'cancelled': []
      }

      const allowedTransitions = validTransitions[existingTask.status] || []
      
      if (!allowedTransitions.includes(updates.status)) {
        return NextResponse.json({
          error: 'Invalid status transition',
          current_status: existingTask.status,
          attempted_status: updates.status,
          allowed_transitions: allowedTransitions
        }, { status: 400 })
      }
    }

    // Build update object (only allowed fields)
    const allowedUpdates: any = {}
    
    if (updates.tone !== undefined) allowedUpdates.tone = updates.tone
    if (updates.max_price !== undefined) allowedUpdates.max_price = updates.max_price
    if (updates.target_phone_number !== undefined) allowedUpdates.target_phone_number = updates.target_phone_number
    if (updates.contact_id !== undefined) allowedUpdates.contact_id = updates.contact_id
    if (updates.priority !== undefined) allowedUpdates.priority = updates.priority
    if (updates.needs_user_confirmation !== undefined) allowedUpdates.needs_user_confirmation = updates.needs_user_confirmation
    
    // Handle JSONB fields
    if (updates.hard_constraints !== undefined) {
      allowedUpdates.hard_constraints = {
        ...(existingTask.hard_constraints || {}),
        ...updates.hard_constraints
      }
    }
    
    if (updates.soft_preferences !== undefined) {
      allowedUpdates.soft_preferences = {
        ...(existingTask.soft_preferences || {}),
        ...updates.soft_preferences
      }
    }

    // If status is being updated
    if (updates.status) {
      allowedUpdates.status = updates.status
      
      // If moving to ready_to_call, validate required fields
      if (updates.status === 'ready_to_call') {
        if (!allowedUpdates.target_phone_number && !existingTask.target_phone_number && !existingTask.contact_id) {
          return NextResponse.json({
            error: 'Cannot mark as ready_to_call: missing target phone number or contact'
          }, { status: 400 })
        }
      }
    }

    // Check if we have all required info to auto-transition to ready_to_call
    if (existingTask.status === 'waiting_for_user') {
      const aiPlan = existingTask.ai_plan as any
      
      if (aiPlan?.missingInfo && aiPlan.missingInfo.length > 0) {
        // Check if missing info has been filled
        const hasMissingInfo = aiPlan.missingInfo.some((info: string) => {
          if (info.toLowerCase().includes('phone')) {
            return !allowedUpdates.target_phone_number && !existingTask.target_phone_number
          }
          if (info.toLowerCase().includes('price') || info.toLowerCase().includes('budget')) {
            return !allowedUpdates.max_price && !existingTask.max_price
          }
          // Add more checks as needed
          return false
        })

        if (!hasMissingInfo && !updates.status) {
          // Auto-transition to ready_to_call
          allowedUpdates.status = 'ready_to_call'
        }
      }
    }

    // Perform update
    const { data: updatedTask, error: updateError } = await supabase
      .from('call_tasks')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update call task:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call task', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Call task updated:', id, 'New status:', updatedTask.status)

    return NextResponse.json({
      success: true,
      call_task: updatedTask,
      updated_fields: Object.keys(allowedUpdates)
    })

  } catch (error: any) {
    console.error('❌ Error updating call task:', error)
    return NextResponse.json({
      error: 'Failed to update call task',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/call-tasks/[id]
 * 
 * Cancel/delete a call task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if task exists and belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from('call_tasks')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { error: 'Call task not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of in-progress calls
    if (existingTask.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot delete a call that is in progress. Cancel it first.' },
        { status: 400 }
      )
    }

    // Soft delete by marking as cancelled
    const { error: updateError } = await supabase
      .from('call_tasks')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Failed to cancel call task:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel call task' },
        { status: 500 }
      )
    }

    console.log('✅ Call task cancelled:', id)

    return NextResponse.json({
      success: true,
      message: 'Call task cancelled'
    })

  } catch (error: any) {
    console.error('❌ Error deleting call task:', error)
    return NextResponse.json({
      error: 'Failed to delete call task',
      message: error.message
    }, { status: 500 })
  }
}





























