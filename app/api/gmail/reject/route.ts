/**
 * Gmail Suggestion Rejection API Endpoint
 * 
 * Reject a suggestion
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { suggestionId } = body

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID required' },
        { status: 400 }
      )
    }

    // Update suggestion status
    const { error: updateError } = await supabase
      .from('processed_emails')
      .update({
        status: 'rejected',
        action_taken_at: new Date().toISOString()
      })
      .eq('id', suggestionId)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('Error rejecting suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject suggestion' },
      { status: 500 }
    )
  }
}






























