/**
 * Gmail Suggestions API Endpoint
 * 
 * Get pending email suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get pending suggestions
    const { data: suggestions, error } = await supabase
      .from('processed_emails')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('email_date', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || []
    })
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}






























