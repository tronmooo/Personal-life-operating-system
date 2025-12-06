'use client'

import { useEffect, useState } from 'react'
import { QuickAddButton } from './quick-add-button'
import { AchievementsDisplay } from './achievements-display'
import { GlobalSearch } from './global-search'
import { RoutinesManager } from './routines-manager'
import { useKeyboardShortcuts, getDefaultShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { NotificationManager, NotificationScheduler } from '@/lib/notifications'
import { AchievementManager } from '@/lib/achievements'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Bell, Trophy, Search, Target, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function AppEnhancements() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [routinesOpen, setRoutinesOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [newAchievements, setNewAchievements] = useState(0)
  
  const { 
    tasks, habits, bills, documents, events, data,
    addTask, addHabit, addBill, addEvent, addDocument 
  } = useData()

  // Initialize notifications
  useEffect(() => {
    const notificationManager = NotificationManager.getInstance()
    setNotificationsEnabled(notificationManager.isGranted())
    
    // Start notification scheduler
    NotificationScheduler.start()

    return () => {
      NotificationScheduler.stop()
    }
  }, [])

  // Check for achievements when data changes (prefer Supabase when available)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const fromSupabase = await AchievementManager.checkAchievementsFromSupabase()
        if (!cancelled && fromSupabase.length > 0) {
          setNewAchievements(prev => prev + fromSupabase.length)
          const notificationManager = NotificationManager.getInstance()
          fromSupabase.forEach(achievement => {
            notificationManager.notifyAchievementUnlocked(achievement.title, achievement.description)
          })
          return
        }
      } catch (error) {
        console.error('Failed to check Supabase achievements:', error)
        // Continue with local achievement check as fallback
      }

      const locally = await AchievementManager.checkAchievements()
      if (!cancelled && locally.length > 0) {
        setNewAchievements(prev => prev + locally.length)
        const notificationManager = NotificationManager.getInstance()
        locally.forEach(achievement => {
          notificationManager.notifyAchievementUnlocked(achievement.title, achievement.description)
        })
      }
    }
    run()
    return () => { cancelled = true }
  }, [tasks, habits, bills, documents, events, data])

  // Keyboard shortcuts
  const shortcuts = getDefaultShortcuts({
    onQuickAdd: () => setQuickAddOpen(true),
    onSearch: () => setSearchOpen(true),
    onAchievements: () => {
      setAchievementsOpen(true)
      setNewAchievements(0)
    },
    onNotifications: async () => {
      const notificationManager = NotificationManager.getInstance()
      const granted = await notificationManager.requestPermission()
      setNotificationsEnabled(granted)
    },
  })

  useKeyboardShortcuts(shortcuts, true)

  const requestNotificationPermission = async () => {
    const notificationManager = NotificationManager.getInstance()
    const granted = await notificationManager.requestPermission()
    setNotificationsEnabled(granted)
    
    if (granted) {
      notificationManager.notify({
        title: '🎉 Notifications Enabled!',
        body: 'You\'ll now receive reminders for bills, habits, and more',
      })
    }
  }

  const handleOpenAchievements = () => {
    setAchievementsOpen(true)
    setNewAchievements(0)
  }

  return (
    <>
      {/* Notification Permission Request */}
      {!notificationsEnabled && (
        <div className="fixed top-20 right-6 z-50 max-w-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border p-4 animate-in slide-in-from-right">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Enable Notifications</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Get reminders for bills, habits, and important events
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={requestNotificationPermission}>
                    Enable
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNotificationsEnabled(true)}>
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Quick Add Button */}
      <QuickAddButton
        onAddTask={() => {
          // These will be opened by parent state management
          // For now, just log
          console.log('Add task clicked')
        }}
        onAddHabit={() => console.log('Add habit')}
        onAddBill={() => console.log('Add bill')}
        onAddEvent={() => console.log('Add event')}
        onAddDocument={() => console.log('Add document')}
        onScanDocument={() => console.log('Scan document')}
      />

      {/* Achievements Display */}
      <AchievementsDisplay
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />

      {/* Global Search */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Goals Manager - Removed */}

      {/* Routines Manager */}
      <RoutinesManager
        open={routinesOpen}
        onClose={() => setRoutinesOpen(false)}
      />
    </>
  )
}

