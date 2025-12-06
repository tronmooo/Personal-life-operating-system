'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Clock, ExternalLink } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Notification, NotificationPriority } from '@/lib/types/notification-types'
import { useRouter } from 'next/navigation'

export function NotificationHub() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Load notifications
  useEffect(() => {
    loadNotifications()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Silently skip if not authenticated
        setNotifications([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      // Only log errors if they're not auth-related
      if (error && !String(error).includes('JWT') && !String(error).includes('401')) {
        console.error('Error loading notifications:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const dismissNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', id)

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const snoozeNotification = async (id: string) => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)

      await supabase
        .from('notifications')
        .update({ 
          snoozed_until: tomorrow.toISOString(),
          dismissed: true 
        })
        .eq('id', id)

      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error snoozing notification:', error)
    }
  }

  const handleAction = async (notification: Notification) => {
    await markAsRead(notification.id)
    if (notification.action_url) {
      router.push(notification.action_url)
      setOpen(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Group notifications by priority
  const groupedNotifications = {
    critical: notifications.filter(n => n.priority === 'critical'),
    important: notifications.filter(n => n.priority === 'important'),
    info: notifications.filter(n => n.priority === 'info'),
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700'
      case 'important':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
    }
  }

  const getPriorityLabel = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critical', icon: '🔴' }
      case 'important':
        return { label: 'Important', icon: '🟡' }
      case 'info':
        return { label: 'Info', icon: '🟢' }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No notifications</p>
                  <p className="text-sm text-gray-400 mt-2">You're all caught up! 🎉</p>
                </div>
              ) : (
                <>
                  {/* Critical Notifications */}
                  {groupedNotifications.critical.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🔴</span>
                        <h3 className="font-semibold text-red-600 dark:text-red-400">
                          Critical ({groupedNotifications.critical.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {groupedNotifications.critical.map(notif => (
                          <NotificationCard
                            key={notif.id}
                            notification={notif}
                            onRead={markAsRead}
                            onDismiss={dismissNotification}
                            onSnooze={snoozeNotification}
                            onAction={handleAction}
                            formatTime={formatTime}
                            getPriorityColor={getPriorityColor}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Notifications */}
                  {groupedNotifications.important.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🟡</span>
                        <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                          Important ({groupedNotifications.important.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {groupedNotifications.important.map(notif => (
                          <NotificationCard
                            key={notif.id}
                            notification={notif}
                            onRead={markAsRead}
                            onDismiss={dismissNotification}
                            onSnooze={snoozeNotification}
                            onAction={handleAction}
                            formatTime={formatTime}
                            getPriorityColor={getPriorityColor}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Notifications */}
                  {groupedNotifications.info.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🟢</span>
                        <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                          Info ({groupedNotifications.info.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {groupedNotifications.info.map(notif => (
                          <NotificationCard
                            key={notif.id}
                            notification={notif}
                            onRead={markAsRead}
                            onDismiss={dismissNotification}
                            onSnooze={snoozeNotification}
                            onAction={handleAction}
                            formatTime={formatTime}
                            getPriorityColor={getPriorityColor}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

interface NotificationCardProps {
  notification: Notification
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  onSnooze: (id: string) => void
  onAction: (notification: Notification) => void
  formatTime: (date: string) => string
  getPriorityColor: (priority: NotificationPriority) => string
}

function NotificationCard({
  notification,
  onRead,
  onDismiss,
  onSnooze,
  onAction,
  formatTime,
  getPriorityColor,
}: NotificationCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${getPriorityColor(notification.priority)} ${
        !notification.read ? 'border-l-4' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {notification.icon && <span className="text-lg">{notification.icon}</span>}
            <h4 className="font-semibold">{notification.title}</h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500">{formatTime(notification.created_at)}</p>
        </div>
        
        {!notification.read && (
          <button
            onClick={() => onRead(notification.id)}
            className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        {notification.action_url && (
          <button
            onClick={() => onAction(notification)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {notification.action_label || 'View'}
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => onSnooze(notification.id)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
          title="Remind me tomorrow"
        >
          <Clock className="w-3 h-3" />
          Snooze
        </button>
        <button
          onClick={() => onDismiss(notification.id)}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}






























