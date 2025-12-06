export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotificationGenerator } from '@/lib/notifications/notification-generator'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

/**
 * GET /api/notifications/cron
 * Cron job endpoint to generate notifications for all users
 * 
 * Set up a cron job to call this endpoint:
 * - Every day at 6am: Check for critical notifications
 * - Every day at 8am: Send daily digest
 * - Every Monday at 8am: Send weekly summary
 * 
 * With Vercel Cron:
 * - Add to vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/notifications/cron",
 *       "schedule": "0 6 * * *"
 *     }]
 *   }
 * 
 * Security: Use Authorization header with secret token
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase admin client (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin access
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`🔔 Cron job: Generating notifications for ${users.users.length} users`)

    let totalNotifications = 0
    const errors: string[] = []

    // Generate notifications for each user
    for (const user of users.users) {
      try {
        const generator = new NotificationGenerator(supabase)
        const notifications = await generator.generateNotifications(user.id)
        totalNotifications += notifications.length
        
        console.log(`✅ Generated ${notifications.length} notifications for user ${user.id}`)

        // Send push notifications for critical items
        await sendCriticalPushNotifications(user.id, notifications)
      } catch (error: any) {
        console.error(`❌ Error generating notifications for user ${user.id}:`, error)
        errors.push(`User ${user.id}: ${error.message}`)
      }
    }

    // Send daily digest (if it's 8am)
    const hour = new Date().getHours()
    if (hour === 8) {
      await sendDailyDigests(supabase)
    }

    // Send weekly summary (if it's Monday at 8am)
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 1 && hour === 8) {
      await sendWeeklySummaries(supabase)
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications generated successfully',
      stats: {
        usersProcessed: users.users.length,
        totalNotifications,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate notifications',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Send push notifications for critical alerts
 */
async function sendCriticalPushNotifications(
  userId: string,
  notifications: any[]
): Promise<void> {
  const criticalNotifications = notifications.filter(n => n.priority === 'critical')
  
  if (criticalNotifications.length === 0) return

  // Send push notification via API
  for (const notification of criticalNotifications) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          userId,
          notification,
        }),
      })
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }
}

/**
 * Send daily digest emails
 */
async function sendDailyDigests(supabase: any): Promise<void> {
  console.log('📧 Sending daily digests...')
  
  // Get users who have important/info notifications
  const { data: users } = await supabase
    .from('notification_settings')
    .select('user_id, daily_digest_time')
    .eq('important_enabled', true)

  if (!users) return

  for (const user of users) {
    // Check if it's the user's preferred digest time
    const now = new Date()
    const digestTime = user.daily_digest_time?.substring(0, 5) || '08:00'
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    if (currentTime === digestTime) {
      // TODO: Send email with daily summary
      console.log(`📧 Would send daily digest to user ${user.user_id}`)
    }
  }
}

/**
 * Send weekly summary emails
 */
async function sendWeeklySummaries(supabase: any): Promise<void> {
  console.log('📊 Sending weekly summaries...')
  
  // Get users who want weekly summaries
  const { data: users } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('info_enabled', true)

  if (!users) return

  for (const user of users) {
    // TODO: Generate and send weekly summary email
    console.log(`📊 Would send weekly summary to user ${user.user_id}`)
  }
}
