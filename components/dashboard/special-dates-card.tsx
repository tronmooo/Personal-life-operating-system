'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cake, Heart, Gift, Loader2, Bell, X } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface Person {
  id: string
  name: string
  relationship: string
  birthday?: string
  anniversaryDate?: string
  importantDates?: Array<{ date: string; label: string; type?: string }>
}

interface Reminder {
  id: string
  personId: string
  reminderDate: string
  title: string
  notes?: string
}

interface SpecialDate {
  id: string
  personId: string
  personName: string
  type: 'birthday' | 'anniversary' | 'important' | 'reminder'
  label: string
  date: string
  daysUntil: number
}

export function SpecialDatesCard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([])
  const [dismissedDates, setDismissedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSpecialDates()
    loadDismissedDates()
    
    // Refresh every 30 seconds to catch new data
    const interval = setInterval(loadSpecialDates, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDismissedDates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const key = `dismissed_special_dates_${user.id}`
      const dismissed = await idbGet<string[]>(key, [])
      setDismissedDates(new Set(dismissed))
    } catch (error) {
      console.error('Error loading dismissed dates:', error)
    }
  }

  const handleDismissDate = async (dateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newDismissed = new Set(dismissedDates)
      newDismissed.add(dateId)
      setDismissedDates(newDismissed)

      // Save to IDB
      const key = `dismissed_special_dates_${user.id}`
      await idbSet(key, Array.from(newDismissed))
    } catch (error) {
      console.error('Error dismissing date:', error)
    }
  }

  const loadSpecialDates = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load people
      const { data: people, error: peopleError } = await supabase
        .from('relationships')
        .select('*')
        .eq('userId', user.id)

      if (peopleError) {
        console.error('Error loading people:', peopleError)
        throw peopleError
      }

      // Load reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('relationship_reminders')
        .select('*')
        .eq('userId', user.id)
        .eq('isCompleted', false)

      if (remindersError) {
        console.error('Error loading reminders:', remindersError)
      }

      // Process all special dates
      const dates: SpecialDate[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Create a map of people for quick lookup
      const peopleMap = new Map<string, Person>()
      people?.forEach((person: Person) => {
        peopleMap.set(person.id, person)
      })

      // Add birthdays, anniversaries, and important dates
      people?.forEach((person: Person) => {
        // Add birthday
        if (person.birthday) {
          const daysUntil = getDaysUntilDate(person.birthday)
          if (daysUntil !== null && daysUntil <= 90) {
            dates.push({
              id: `${person.id}-birthday`,
              personId: person.id,
              personName: person.name,
              type: 'birthday',
              label: 'Birthday',
              date: person.birthday,
              daysUntil
            })
          }
        }

        // Add anniversary
        if (person.anniversaryDate) {
          const daysUntil = getDaysUntilDate(person.anniversaryDate)
          if (daysUntil !== null && daysUntil <= 90) {
            dates.push({
              id: `${person.id}-anniversary`,
              personId: person.id,
              personName: person.name,
              type: 'anniversary',
              label: 'Anniversary',
              date: person.anniversaryDate,
              daysUntil
            })
          }
        }

        // Add important dates
        if (person.importantDates && person.importantDates.length > 0) {
          person.importantDates.forEach((impDate, idx) => {
            const daysUntil = getDaysUntilDate(impDate.date)
            if (daysUntil !== null && daysUntil <= 90) {
              dates.push({
                id: `${person.id}-important-${idx}`,
                personId: person.id,
                personName: person.name,
                type: 'important',
                label: impDate.label,
                date: impDate.date,
                daysUntil
              })
            }
          })
        }
      })

      // Add reminders
      reminders?.forEach((reminder: Reminder) => {
        const person = peopleMap.get(reminder.personId)
        if (person) {
          const daysUntil = getDaysUntilReminderDate(reminder.reminderDate)
          if (daysUntil !== null && daysUntil <= 90) {
            dates.push({
              id: `reminder-${reminder.id}`,
              personId: reminder.personId,
              personName: person.name,
              type: 'reminder',
              label: reminder.title,
              date: reminder.reminderDate,
              daysUntil
            })
          }
        }
      })

      // Sort by days until
      dates.sort((a, b) => a.daysUntil - b.daysUntil)
      
      console.log('📅 Special Dates loaded:', {
        totalDates: dates.length,
        birthdays: dates.filter(d => d.type === 'birthday').length,
        anniversaries: dates.filter(d => d.type === 'anniversary').length,
        reminders: dates.filter(d => d.type === 'reminder').length,
        important: dates.filter(d => d.type === 'important').length,
        dates: dates.map(d => ({ name: d.personName, type: d.type, label: d.label, daysUntil: d.daysUntil }))
      })
      
      setSpecialDates(dates)
    } catch (error) {
      console.error('Error loading special dates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilReminderDate = (dateStr: string): number | null => {
    if (!dateStr) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const getDaysUntilDate = (dateStr: string): number | null => {
    if (!dateStr) return null
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const [year, month, day] = dateStr.split('-').map(Number)
      if (!month || !day) return null
      
      // Try this year first
      let targetDate = new Date(today.getFullYear(), month - 1, day)
      targetDate.setHours(0, 0, 0, 0)
      
      // If date has passed this year, use next year
      if (targetDate < today) {
        targetDate = new Date(today.getFullYear() + 1, month - 1, day)
        targetDate.setHours(0, 0, 0, 0)
      }
      
      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    } catch (e) {
      console.error('Error calculating days until date:', e)
      return null
    }
  }

  const getIcon = (type: SpecialDate['type']) => {
    switch (type) {
      case 'birthday':
        return <Cake className="w-4 h-4" />
      case 'anniversary':
        return <Heart className="w-4 h-4" />
      case 'important':
        return <Gift className="w-4 h-4" />
      case 'reminder':
        return <Bell className="w-4 h-4" />
    }
  }

  const getColor = (type: SpecialDate['type']) => {
    switch (type) {
      case 'birthday':
        return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200'
      case 'anniversary':
        return 'bg-pink-50 dark:bg-pink-950/30 border-pink-200'
      case 'important':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200'
      case 'reminder':
        return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200'
    }
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today!'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  // Filter out dismissed dates
  const visibleDates = specialDates.filter(date => !dismissedDates.has(date.id))
  const upcomingDates = visibleDates.slice(0, 5)

  return (
    <Card className="border-2 border-pink-200 dark:border-pink-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            <span className="text-lg">Special Dates</span>
          </div>
          <Badge variant="secondary">{visibleDates.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : upcomingDates.length === 0 ? (
          <div className="text-center py-8">
            <Cake className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">No upcoming special dates</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/relationships')}
            >
              Add People
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingDates.map((date) => (
              <div
                key={date.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getColor(date.type)} group relative`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIcon(date.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {date.type === 'birthday' ? '🎉' : date.type === 'anniversary' ? '💖' : date.type === 'reminder' ? '🔔' : '📅'}{' '}
                      {date.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {date.personName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs flex-shrink-0 ${
                      date.daysUntil === 0 
                        ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300' 
                        : date.daysUntil <= 7 
                        ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300'
                        : ''
                    }`}
                  >
                    {getDaysText(date.daysUntil)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDismissDate(date.id)}
                    title="Mark as acknowledged"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {visibleDates.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.push('/relationships?tab=calendar')}
              >
                View All ({visibleDates.length}) →
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

