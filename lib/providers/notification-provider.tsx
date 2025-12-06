'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppNotification, Reminder } from '@/types/notifications'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { mapDbPriorityToApp } from '@/types/notifications'

interface NotificationContextType {
  notifications: AppNotification[]
  reminders: Reminder[]
  unreadCount: number
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead' | 'isCompleted'>) => void
  markAsRead: (id: string) => void
  markAsCompleted: (id: string) => void
  deleteNotification: (id: string) => void
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>) => void
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  completeReminder: (id: string) => void
  deleteReminder: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const supabase = createClientComponentClient()

  // Load notifications from Supabase and subscribe to changes
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (isMounted) setNotifications([])
          return
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        const mapped: AppNotification[] = (data || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          // Map DB types to app categories as best-effort
          category: (n.related_domain || 'alert') as any,
          priority: mapDbPriorityToApp(n.priority),
          domain: n.related_domain || undefined,
          itemId: n.related_id || undefined,
          dueDate: n.metadata?.dueDate ? new Date(n.metadata.dueDate) : undefined,
          isRead: !!n.read,
          isCompleted: !!n.dismissed,
          createdAt: new Date(n.created_at),
          completedAt: n.updated_at && n.dismissed ? new Date(n.updated_at) : undefined,
        }))

        if (isMounted) setNotifications(mapped)
      } catch (e) {
        // Only log errors if they're not auth-related
        if (e && !String(e).includes('JWT') && !String(e).includes('401')) {
          console.error('Failed to load notifications from Supabase:', e)
        }
      }
    }

    load()

    // Realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        load()
      })
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Persist reminders locally (still local feature)
  useEffect(() => {
    const persistReminders = async () => {
      try {
        const { idbSet } = await import('@/lib/utils/idb-cache')
        await idbSet('lifehub-reminders', reminders)
      } catch (error) {
        console.error('Failed to persist reminders:', error)
      }
    }
    persistReminders()
  }, [reminders])

  // Check reminders and create notifications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      reminders.forEach((reminder) => {
        if (reminder.isCompleted) return

        const dueDate = new Date(reminder.dueDate)
        const offsetMinutes = reminder.notificationOffset || 60 // default 1 hour before
        const notificationTime = new Date(dueDate.getTime() - offsetMinutes * 60000)

        // Check if it's time to notify
        if (now >= notificationTime && now < dueDate) {
          // Check if notification already exists
          const existingNotification = notifications.find(
            (n) => n.itemId === reminder.id && !n.isCompleted
          )

          if (!existingNotification) {
            addNotification({
              title: reminder.title,
              message: reminder.description || `Due ${dueDate.toLocaleString()}`,
              category: reminder.category,
              priority: reminder.priority,
              domain: reminder.domain,
              itemId: reminder.id,
              dueDate: reminder.dueDate,
            })
          }
        }
      })
    }

    // Check every minute
    const interval = setInterval(checkReminders, 60000)
    checkReminders() // Check immediately

    return () => clearInterval(interval)
  }, [reminders, notifications])

  const addNotification = (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead' | 'isCompleted'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false,
      isCompleted: false,
    }
    setNotifications((prev) => [newNotification, ...prev])

    // Browser notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
      })
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    // Best-effort: update Supabase if this is a DB-backed notification (UUID-like)
    if (!id.startsWith('notif-')) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id)
      } catch (e) {
        console.warn('Failed to update read state in Supabase:', e)
      }
    }
  }

  const markAsCompleted = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isCompleted: true, completedAt: new Date() } : n)))
    if (!id.startsWith('notif-')) {
      try {
        await supabase.from('notifications').update({ dismissed: true }).eq('id', id)
      } catch (e) {
        console.warn('Failed to dismiss notification in Supabase:', e)
      }
    }
  }

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (!id.startsWith('notif-')) {
      try {
        await supabase.from('notifications').update({ dismissed: true }).eq('id', id)
      } catch (e) {
        console.warn('Failed to delete (dismiss) notification in Supabase:', e)
      }
    }
  }

  const addReminder = (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isCompleted: false,
    }
    setReminders((prev) => [...prev, newReminder])
  }

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const completeReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isCompleted: true, completedAt: new Date() } : r
      )
    )
  }

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.isRead && !n.isCompleted).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        reminders,
        unreadCount,
        addNotification,
        markAsRead,
        markAsCompleted,
        deleteNotification,
        addReminder,
        updateReminder,
        completeReminder,
        deleteReminder,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

