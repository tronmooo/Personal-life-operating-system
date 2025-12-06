'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Bell, BellOff, Clock, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { pushNotificationManager } from '@/lib/notifications/push-notifications'

interface NotificationSettings {
  push_enabled: boolean
  critical_enabled: boolean
  important_enabled: boolean
  info_enabled: boolean
  daily_digest_time: string
  weekly_summary_day: number
  quiet_hours_start?: string
  quiet_hours_end?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function NotificationSettings() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: false,
    critical_enabled: true,
    important_enabled: true,
    info_enabled: true,
    daily_digest_time: '08:00:00',
    weekly_summary_day: 1,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '07:00:00',
  })

  const [pushSupported] = useState(pushNotificationManager.isSupported())
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    loadSettings()
    if (pushSupported) {
      setPushPermission(pushNotificationManager.getPermissionStatus())
    }
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        // Create default settings if they don't exist
        if (error.code === 'PGRST116') {
          await supabase.from('notification_settings').insert({
            user_id: session.user.id,
            ...settings,
          })
        }
      } else if (data) {
        setSettings({
          push_enabled: data.push_enabled,
          critical_enabled: data.critical_enabled,
          important_enabled: data.important_enabled,
          info_enabled: data.info_enabled,
          daily_digest_time: data.daily_digest_time,
          weekly_summary_day: data.weekly_summary_day,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        })
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updates: Partial<NotificationSettings>) => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const newSettings = { ...settings, ...updates }
      setSettings(newSettings)

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: session.user.id,
          ...newSettings,
        })

      if (error) throw error

      console.log('✅ Settings saved')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission and subscribe
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const success = await pushNotificationManager.subscribe(session.user.id)
      if (success) {
        await saveSettings({ push_enabled: true })
        setPushPermission('granted')
      } else {
        alert('Failed to enable push notifications. Please check your browser settings.')
      }
    } else {
      // Unsubscribe
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await pushNotificationManager.unsubscribe(session.user.id)
      await saveSettings({ push_enabled: false })
    }
  }

  const testNotification = async () => {
    await pushNotificationManager.showLocalNotification(
      'Test Notification',
      {
        body: 'This is a test notification from LifeHub!',
        icon: '/icon-192x192.png',
      }
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading settings...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive real-time notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Push notifications are not supported in your browser.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Get notified about critical alerts instantly
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings.push_enabled}
                  onCheckedChange={handlePushToggle}
                  disabled={saving || pushPermission === 'denied'}
                />
              </div>

              {pushPermission === 'denied' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Push notifications are blocked. Please enable them in your browser settings.
                  </p>
                </div>
              )}

              {settings.push_enabled && (
                <Button onClick={testNotification} variant="outline" size="sm">
                  Send Test Notification
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Priorities */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="critical-enabled" className="flex items-center gap-2">
                <span className="text-lg">🔴</span>
                Critical Notifications
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Urgent items requiring immediate action
              </p>
            </div>
            <Switch
              id="critical-enabled"
              checked={settings.critical_enabled}
              onCheckedChange={(checked) => saveSettings({ critical_enabled: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="important-enabled" className="flex items-center gap-2">
                <span className="text-lg">🟡</span>
                Important Notifications
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Items that need attention soon
              </p>
            </div>
            <Switch
              id="important-enabled"
              checked={settings.important_enabled}
              onCheckedChange={(checked) => saveSettings({ important_enabled: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="info-enabled" className="flex items-center gap-2">
                <span className="text-lg">🟢</span>
                Info Notifications
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Nice-to-know updates and achievements
              </p>
            </div>
            <Switch
              id="info-enabled"
              checked={settings.info_enabled}
              onCheckedChange={(checked) => saveSettings({ info_enabled: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timing Preferences
          </CardTitle>
          <CardDescription>
            Control when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="daily-digest">Daily Digest Time</Label>
            <p className="text-sm text-gray-500 mb-2">
              Time for your daily notification summary
            </p>
            <Input
              id="daily-digest"
              type="time"
              value={settings.daily_digest_time?.substring(0, 5) || '08:00'}
              onChange={(e) => saveSettings({ daily_digest_time: e.target.value + ':00' })}
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="weekly-summary">Weekly Summary Day</Label>
            <p className="text-sm text-gray-500 mb-2">
              Day of the week for your weekly summary
            </p>
            <select
              id="weekly-summary"
              value={settings.weekly_summary_day}
              onChange={(e) => saveSettings({ weekly_summary_day: parseInt(e.target.value) })}
              disabled={saving}
              className="w-full p-2 border rounded-lg"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause non-critical notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={settings.quiet_hours_start?.substring(0, 5) || '22:00'}
                onChange={(e) => saveSettings({ quiet_hours_start: e.target.value + ':00' })}
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={settings.quiet_hours_end?.substring(0, 5) || '07:00'}
                onChange={(e) => saveSettings({ quiet_hours_end: e.target.value + ':00' })}
                disabled={saving}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Critical notifications will still be delivered during quiet hours
          </p>
        </CardContent>
      </Card>
    </div>
  )
}



