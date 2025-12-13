import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch single subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Build update object (only include provided fields)
    const updateData: any = {}
    
    if (body.service_name !== undefined) updateData.service_name = body.service_name
    if (body.category !== undefined) updateData.category = body.category
    if (body.cost !== undefined) updateData.cost = parseFloat(body.cost)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.status !== undefined) updateData.status = body.status
    if (body.next_due_date !== undefined) updateData.next_due_date = body.next_due_date
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.trial_end_date !== undefined) updateData.trial_end_date = body.trial_end_date
    if (body.cancellation_date !== undefined) updateData.cancellation_date = body.cancellation_date
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method
    if (body.last_four !== undefined) updateData.last_four = body.last_four
    if (body.account_url !== undefined) updateData.account_url = body.account_url
    if (body.account_email !== undefined) updateData.account_email = body.account_email
    if (body.auto_renew !== undefined) updateData.auto_renew = body.auto_renew
    if (body.reminder_enabled !== undefined) updateData.reminder_enabled = body.reminder_enabled
    if (body.reminder_days_before !== undefined) updateData.reminder_days_before = body.reminder_days_before
    if (body.icon_color !== undefined) updateData.icon_color = body.icon_color
    if (body.icon_letter !== undefined) updateData.icon_letter = body.icon_letter
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




