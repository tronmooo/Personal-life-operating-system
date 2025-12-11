// Browser Notifications System

// Helper to get Supabase client (dynamic import for SSR safety)
async function getSupabaseClient() {
  const { createClientComponentClient } = await import('@/lib/supabase/browser-client')
  return createClientComponentClient()
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
  }>
}

export class NotificationManager {
  private static instance: NotificationManager
  private permission: NotificationPermission = 'default'

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission === 'granted'
  }

  isGranted(): boolean {
    return this.permission === 'granted'
  }

  async notify(options: NotificationOptions): Promise<void> {
    if (!this.isGranted()) {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn('Notification permission denied')
        return
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        badge: '/icon-192.png',
      })

      // Auto-close after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000)
      }

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  // Specific notification types
  async notifyBillDue(billTitle: string, amount: number, daysUntil: number): Promise<void> {
    const urgency = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `in ${daysUntil} days`
    
    await this.notify({
      title: `💰 Bill Due ${urgency}`,
      body: `${billTitle} - $${amount.toFixed(2)}`,
      tag: 'bill-reminder',
      requireInteraction: daysUntil <= 1,
    })
  }

  async notifyDocumentExpiring(docTitle: string, daysUntil: number): Promise<void> {
    await this.notify({
      title: `📄 Document Expiring Soon`,
      body: `${docTitle} expires in ${daysUntil} days`,
      tag: 'document-expiry',
      requireInteraction: daysUntil <= 7,
    })
  }

  async notifyHabitReminder(habitName: string): Promise<void> {
    await this.notify({
      title: `✨ Habit Reminder`,
      body: `Don't forget your ${habitName} habit today!`,
      tag: 'habit-reminder',
    })
  }

  async notifyEventUpcoming(eventTitle: string, date: string): Promise<void> {
    await this.notify({
      title: `📅 Upcoming Event`,
      body: `${eventTitle} - ${date}`,
      tag: 'event-reminder',
    })
  }

  async notifyStreakMilestone(habitName: string, streak: number): Promise<void> {
    await this.notify({
      title: `🔥 Streak Milestone!`,
      body: `${streak} day streak on ${habitName}! Keep it up!`,
      tag: 'streak-milestone',
      requireInteraction: true,
    })
  }

  async notifyAchievementUnlocked(title: string, description: string): Promise<void> {
    await this.notify({
      title: `🏆 Achievement Unlocked!`,
      body: `${title}: ${description}`,
      tag: 'achievement',
      requireInteraction: true,
    })
  }

  async notifyTaskDue(taskTitle: string): Promise<void> {
    await this.notify({
      title: `✅ Task Due`,
      body: taskTitle,
      tag: 'task-reminder',
    })
  }
}

// Notification scheduler
export class NotificationScheduler {
  private static checkInterval: NodeJS.Timeout | null = null

  static start(): void {
    if (typeof window === 'undefined') return

    // Check every hour for notifications
    this.checkInterval = setInterval(() => {
      this.checkForNotifications()
    }, 60 * 60 * 1000) // Every hour

    // Also check immediately
    this.checkForNotifications()
  }

  static stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private static async checkForNotifications(): Promise<void> {
    const notificationManager = NotificationManager.getInstance()
    if (!notificationManager.isGranted()) return

    try {
      const supabase = await getSupabaseClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user settings to respect preferences
      const { data: settingsRow } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle?.() || { data: null }

      // Fetch unread, not-dismissed notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, title, message, priority, created_at, metadata')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)

      // Respect quiet hours if configured
      const now = new Date()
      const inQuietHours = (() => {
        if (!settingsRow?.quiet_hours_start || !settingsRow?.quiet_hours_end) return false
        const [sh, sm] = settingsRow.quiet_hours_start.split(':').map((n: number) => parseInt(String(n), 10))
        const [eh, em] = settingsRow.quiet_hours_end.split(':').map((n: number) => parseInt(String(n), 10))
        const start = new Date(now); start.setHours(sh || 0, sm || 0, 0, 0)
        const end = new Date(now); end.setHours(eh || 0, em || 0, 0, 0)
        if (end <= start) {
          return now >= start || now <= end
        }
        return now >= start && now <= end
      })()

      if (inQuietHours) return

      for (const n of notifications || []) {
        await notificationManager.notify({
          title: n.title,
          body: n.message,
          requireInteraction: (n.priority === 'critical'),
        })

        // Mark as read after showing (best-effort)
        await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      }
    } catch (error) {
      console.error('Error checking notifications (Supabase):', error)
    }
  }
}

export default NotificationManager








