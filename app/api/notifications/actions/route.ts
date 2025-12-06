import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

/**
 * POST /api/notifications/actions
 * Perform actions on notifications (mark as read, snooze, dismiss)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (!action || !notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'action and notificationIds array are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'mark_read':
        updateData = { read: true }
        break
      
      case 'mark_unread':
        updateData = { read: false }
        break
      
      case 'dismiss':
        updateData = { dismissed: true }
        break
      
      case 'snooze':
        // Snooze until tomorrow at 8am
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(8, 0, 0, 0)
        updateData = { 
          snoozed_until: tomorrow.toISOString(),
          dismissed: true 
        }
        break
      
      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    // Update notifications
    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .in('id', notificationIds)
      .eq('user_id', session.user.id) // Security: only update user's own notifications

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Successfully performed ${action} on ${notificationIds.length} notification(s)`,
      count: notificationIds.length,
    })
  } catch (error: any) {
    console.error('Error performing notification action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/actions
 * Get unread/unsnoozed notifications count
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Count unread notifications (excluding snoozed)
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('dismissed', false)
      .eq('read', false)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)

    if (countError) throw countError

    return NextResponse.json({
      success: true,
      unreadCount: unreadCount || 0,
    })
  } catch (error: any) {
    console.error('Error getting notification count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get count' },
      { status: 500 }
    )
  }
}



