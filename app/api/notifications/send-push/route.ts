import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import webPush from 'web-push'

export const runtime = 'nodejs'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@lifehub.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

/**
 * POST /api/notifications/send-push
 * Send a push notification to a user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user (admin/system only for now)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, notification } = body

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'userId and notification are required' },
        { status: 400 }
      )
    }

    // Get user's push subscription
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('push_enabled, push_subscription')
      .eq('user_id', userId)
      .single()

    if (settingsError || !settings?.push_enabled || !settings?.push_subscription) {
      return NextResponse.json(
        { error: 'User does not have push notifications enabled' },
        { status: 400 }
      )
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      message: notification.message,
      icon: notification.icon,
      action_url: notification.action_url,
      priority: notification.priority,
      id: notification.id,
    })

    // Send push notification
    try {
      await webPush.sendNotification(
        settings.push_subscription,
        payload
      )

      console.log(`✅ Push notification sent to user ${userId}`)

      return NextResponse.json({
        success: true,
        message: 'Push notification sent',
      })
    } catch (pushError: any) {
      console.error('Error sending push notification:', pushError)

      // If subscription is invalid, disable it
      if (pushError.statusCode === 410) {
        await supabase
          .from('notification_settings')
          .update({
            push_enabled: false,
            push_subscription: null,
          })
          .eq('user_id', userId)
      }

      return NextResponse.json(
        { error: 'Failed to send push notification' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in send-push:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send push notification' },
      { status: 500 }
    )
  }
}



