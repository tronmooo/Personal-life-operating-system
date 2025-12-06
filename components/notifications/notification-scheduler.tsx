'use client'

import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

/**
 * Notification Scheduler - Runs daily to generate notifications
 * This component mounts globally and schedules notification generation
 */
export function NotificationScheduler() {
  const supabase = createClientComponentClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('🔔 Notification Scheduler initialized')

    // Check if user is authenticated
    const checkAndSchedule = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // avoid noisy logs when user is not signed in
        return
      }

      // Check last generation time from user settings
      let lastRun: string | null = null
      try {
        const res = await fetch('/api/user-settings', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          lastRun = json?.settings?.notifications?.lastGeneration || null
        }
      } catch (error) {
        console.error('Failed to fetch notification settings:', error)
        // Treat as first run if we can't fetch settings
      }
      const now = new Date()

      // Generate notifications if:
      // 1. Never run before, OR
      // 2. Last run was more than 6 hours ago
      if (!lastRun || (now.getTime() - new Date(lastRun).getTime()) > 6 * 60 * 60 * 1000) {
        console.log('🔔 Running notification generation...')
        await generateNotifications()
        try {
          await fetch('/api/user-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              notifications: {
                lastGeneration: now.toISOString()
              }
            })
          })
        } catch (error) {
          console.error('Failed to update notification generation timestamp:', error)
          // Non-critical, notifications were still generated
        }
      } else {
        console.log('✅ Notifications up to date (last run:', lastRun, ')')
      }
    }

    // Run immediately
    checkAndSchedule()

    // Set up interval to check every 30 minutes
    intervalRef.current = setInterval(() => {
      checkAndSchedule()
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const generateNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/generate', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate notifications')
      }

      const result = await response.json()
      console.log(`✅ Generated ${result.count} notifications`)
    } catch (error) {
      console.error('❌ Error generating notifications:', error)
    }
  }

  // This component doesn't render anything
  return null
}




















