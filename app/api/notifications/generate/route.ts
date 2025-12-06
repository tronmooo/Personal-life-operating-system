import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NotificationGenerator } from '@/lib/notifications/notification-generator'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/notifications/generate
 * Generate notifications by scanning all domains
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔔 Generating notifications for user:', session.user.id)

    // Generate notifications (pass server supabase client)
    // Use service role for read-only domain entries, writes constrained by RLS to user_id
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const generator = new NotificationGenerator(admin)
    const notifications = await generator.generateNotifications(session.user.id)

    // Cleanup old dismissed notifications (older than 30 days)
    await generator.cleanupOldNotifications(session.user.id)

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error: any) {
    console.error('❌ Error generating notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate notifications' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/generate
 * Get current notifications (without generating new ones)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: notifications?.length || 0,
      notifications: notifications || [],
    })
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
























