'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  Info, 
  Clock, 
  Calendar,
  Moon,
  Mail,
  Smartphone,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { cn } from '@/lib/utils'

interface NotificationSettingsData {
  push_enabled: boolean
  push_subscription?: any
  critical_enabled: boolean
  important_enabled: boolean
  info_enabled: boolean
  daily_digest_time: string
  weekly_summary_day: number
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  email_notifications?: boolean
  mobile_notifications?: boolean
}

const DEFAULT_SETTINGS: NotificationSettingsData = {
  push_enabled: false,
  critical_enabled: true,
  important_enabled: true,
  info_enabled: true,
  daily_digest_time: '08:00',
  weekly_summary_day: 1, // Monday
  quiet_hours_start: null,
  quiet_hours_end: null,
  email_notifications: false,
  mobile_notifications: true,
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

export function NotificationsTab() {
  const supabase = createClientComponentClient()
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    critical: 0,
  })

  // Check push notification support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true)
      setPermissionStatus(Notification.permission)
    }
  }, [])

  // Load settings
  useEffect(() => {
    loadSettings()
    loadNotificationStats()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings({
          push_enabled: data.push_enabled ?? false,
          push_subscription: data.push_subscription,
          critical_enabled: data.critical_enabled ?? true,
          important_enabled: data.important_enabled ?? true,
          info_enabled: data.info_enabled ?? true,
          daily_digest_time: data.daily_digest_time ?? '08:00',
          weekly_summary_day: data.weekly_summary_day ?? 1,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        })
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotificationStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('id, read, priority')
        .eq('user_id', user.id)
        .eq('dismissed', false)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.read).length || 0,
        critical: data?.filter(n => n.priority === 'critical').length || 0,
      }
      setNotificationStats(stats)
    } catch (error) {
      console.error('Failed to load notification stats:', error)
    }
  }

  const updateSetting = <K extends keyof NotificationSettingsData>(
    key: K, 
    value: NotificationSettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          push_enabled: settings.push_enabled,
          critical_enabled: settings.critical_enabled,
          important_enabled: settings.important_enabled,
          info_enabled: settings.info_enabled,
          daily_digest_time: settings.daily_digest_time,
          weekly_summary_day: settings.weekly_summary_day,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const requestPushPermission = async () => {
    if (!pushSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      
      if (permission === 'granted') {
        updateSetting('push_enabled', true)
      }
    } catch (error) {
      console.error('Failed to request push permission:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{notificationStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Active</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{notificationStats.unread}</div>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{notificationStats.critical}</div>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Push Notifications */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            Push Notifications
          </CardTitle>
          <CardDescription>Receive notifications on your device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Push notifications are not supported in this browser
              </p>
            </div>
          ) : permissionStatus === 'denied' ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Push notifications are blocked
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Please enable notifications in your browser settings
              </p>
            </div>
          ) : permissionStatus === 'granted' ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-medium">Push Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    You'll receive browser notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.push_enabled}
                onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
              />
            </div>
          ) : (
            <Button onClick={requestPushPermission} className="w-full">
              <BellRing className="w-4 h-4 mr-2" />
              Enable Push Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Types
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critical */}
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="font-medium">Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Urgent issues requiring immediate attention
                </p>
              </div>
            </div>
            <Switch
              checked={settings.critical_enabled}
              onCheckedChange={(checked) => updateSetting('critical_enabled', checked)}
            />
          </div>

          {/* Important */}
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="font-medium">Important Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Bills due, appointments, deadlines
                </p>
              </div>
            </div>
            <Switch
              checked={settings.important_enabled}
              onCheckedChange={(checked) => updateSetting('important_enabled', checked)}
            />
          </div>

          {/* Info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="font-medium">Informational</Label>
                <p className="text-sm text-muted-foreground">
                  Tips, suggestions, and general updates
                </p>
              </div>
            </div>
            <Switch
              checked={settings.info_enabled}
              onCheckedChange={(checked) => updateSetting('info_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Digest & Summary
          </CardTitle>
          <CardDescription>Configure daily digest and weekly summary times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily Digest */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <Label className="font-medium">Daily Digest Time</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of your day's notifications
                </p>
              </div>
            </div>
            <Input
              type="time"
              value={settings.daily_digest_time}
              onChange={(e) => updateSetting('daily_digest_time', e.target.value)}
              className="w-32"
            />
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <Label className="font-medium">Weekly Summary Day</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly overview of important items
                </p>
              </div>
            </div>
            <select
              value={settings.weekly_summary_day}
              onChange={(e) => updateSetting('weekly_summary_day', parseInt(e.target.value))}
              className="w-32 px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Pause non-critical notifications during specific times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={settings.quiet_hours_start || ''}
                onChange={(e) => updateSetting('quiet_hours_start', e.target.value || null)}
                placeholder="22:00"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={settings.quiet_hours_end || ''}
                onChange={(e) => updateSetting('quiet_hours_end', e.target.value || null)}
                placeholder="07:00"
              />
            </div>
          </div>
          
          {settings.quiet_hours_start && settings.quiet_hours_end && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                ✓ Quiet hours active from <strong>{settings.quiet_hours_start}</strong> to <strong>{settings.quiet_hours_end}</strong>
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              updateSetting('quiet_hours_start', null)
              updateSetting('quiet_hours_end', null)
            }}
            disabled={!settings.quiet_hours_start && !settings.quiet_hours_end}
          >
            Clear Quiet Hours
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4">
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  You have unsaved notification settings
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={loadSettings}
                    disabled={isSaving}
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}









