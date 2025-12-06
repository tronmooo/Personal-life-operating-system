'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Clock, X, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Notification {
  id: string
  type: 'bill' | 'task' | 'event' | 'document' | 'insight'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  priority: 'low' | 'medium' | 'high'
  domain?: string
}

export function NotificationCenter() {
  const { data, tasks, bills } = useData()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    morningBriefing: true,
    eveningRecap: false,
  })

  // Load notifications
  useEffect(() => {
    loadNotifications()
    
    // Check for new notifications every minute
    const interval = setInterval(() => {
      generateSmartNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Request browser notification permission
  useEffect(() => {
    if (settings.enabled && settings.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [settings.enabled, settings.desktop])

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/user-settings', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        const list = json?.settings?.notifications?.list || []
        setNotifications(list)
      } else {
        generateSmartNotifications()
      }
    } catch {
      generateSmartNotifications()
    }
  }

  const generateSmartNotifications = async () => {
    const newNotifications: Notification[] = []
    const now = new Date()

    // Check bills (3 days before due) from DataProvider
    bills.forEach((bill: any) => {
      if (bill.dueDate) {
        const dueDate = new Date(bill.dueDate)
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil === 3 || daysUntil === 1) {
          newNotifications.push({
            id: `bill-${bill.id}-${daysUntil}`,
            type: 'bill',
            title: `Bill Due ${daysUntil === 1 ? 'Tomorrow' : 'in 3 Days'}`,
            message: `${bill.name}: $${bill.amount}`,
            timestamp: now.toISOString(),
            read: false,
            priority: daysUntil === 1 ? 'high' : 'medium',
            domain: 'financial',
          })
        }
      }
    })

    // Check documents expiring from domain data
    const docDomains = ['insurance', 'legal', 'health', 'vehicles'] as const
    docDomains.forEach((domain) => {
      const domainItems = (data[domain] || []) as any[]
      domainItems.forEach((doc: any) => {
        const exp = doc.metadata?.expiryDate || doc.metadata?.expirationDate
        if (exp) {
          const expDate = new Date(exp)
          const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysUntil === 30 || daysUntil === 7) {
            newNotifications.push({
              id: `doc-${doc.id}-${daysUntil}`,
              type: 'document',
              title: `Document Expiring Soon`,
              message: `${doc.title || doc.metadata?.documentName || 'Document'} expires in ${daysUntil} days`,
              timestamp: now.toISOString(),
              read: false,
              priority: daysUntil === 7 ? 'high' : 'medium',
              domain,
            })
          }
        }
      })
    })

    // Morning briefing (8am)
    if (settings.morningBriefing && now.getHours() === 8) {
      const todayTasks = tasks.filter((t: any) => !t.completed).slice(0, 3)
      
      if (todayTasks.length > 0) {
        newNotifications.push({
          id: `briefing-${now.getTime()}`,
          type: 'insight',
          title: '🌅 Good Morning!',
          message: `You have ${todayTasks.length} tasks for today`,
          timestamp: now.toISOString(),
          read: false,
          priority: 'medium',
        })
      }
    }

    // Save and show via user settings
    if (newNotifications.length > 0) {
      const existing = notifications
      const dedupMap = new Map<string, Notification>()
      ;[...newNotifications, ...existing].forEach(n => {
        if (!dedupMap.has(n.id)) dedupMap.set(n.id, n)
      })
      const merged = Array.from(dedupMap.values()).slice(0, 50)
      setNotifications(merged)
      try {
        await fetch('/api/user-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notifications: { list: merged } })
        })
      } catch (error) {
        console.error('Failed to sync new notifications to settings:', error)
        // Notifications still shown locally
      }

      // Show browser notification for high priority
      newNotifications.forEach(notif => {
        if (notif.priority === 'high' && settings.desktop) {
          showBrowserNotification(notif)
        }
      })
    }
  }

  const showBrowserNotification = (notif: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(notif.title, {
        body: notif.message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notif.id,
      })

      notification.onclick = () => {
        window.focus()
        if (notif.actionUrl) {
          window.location.href = notif.actionUrl
        }
        markAsRead(notif.id)
      }
    }
  }

  const markAsRead = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: { list: updated } })
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Status updated locally
    }
  }

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: { list: updated } })
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      // Status updated locally
    }
  }

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: { list: updated } })
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
      // Notification deleted locally
    }
  }

  const clearAll = async () => {
    setNotifications([])
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: { list: [] } })
      })
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      // Notifications cleared locally
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll notify you about bills, tasks, and more</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onRead={() => markAsRead(notif.id)}
                    onDelete={() => deleteNotification(notif.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="m-0 max-h-96 overflow-y-auto">
            {notifications.filter(n => !n.read).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                <p>All caught up!</p>
                <p className="text-sm">No unread notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.filter(n => !n.read).map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onRead={() => markAsRead(notif.id)}
                    onDelete={() => deleteNotification(notif.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="desktop-notifications">Browser notifications</Label>
                <Switch
                  id="desktop-notifications"
                  checked={settings.desktop}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, desktop: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sound</Label>
                <Switch
                  id="sound"
                  checked={settings.sound}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, sound: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="morning-briefing">Morning briefing (8 AM)</Label>
                <Switch
                  id="morning-briefing"
                  checked={settings.morningBriefing}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, morningBriefing: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="evening-recap">Evening recap (8 PM)</Label>
                <Switch
                  id="evening-recap"
                  checked={settings.eveningRecap}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, eveningRecap: checked })
                  }
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="w-full"
            >
              Clear all notifications
            </Button>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({ 
  notification, 
  onRead, 
  onDelete 
}: { 
  notification: Notification
  onRead: () => void
  onDelete: () => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'bill': return '💰'
      case 'task': return '✓'
      case 'event': return '📅'
      case 'document': return '📄'
      case 'insight': return '✨'
      default: return '🔔'
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-blue-500'
    }
  }

  return (
    <div 
      className={`p-3 border-l-4 ${getPriorityColor()} ${
        !notification.read ? 'bg-accent/50' : ''
      } hover:bg-accent/30 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onRead}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onDelete}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
            </span>
            {notification.domain && (
              <Badge variant="outline" className="text-xs">
                {notification.domain}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}






























