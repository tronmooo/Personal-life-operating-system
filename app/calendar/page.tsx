'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarErrorAlert } from '@/components/calendar/calendar-error-alert'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  colorId?: string
  htmlLink: string
}

const COLOR_LABELS: { [key: string]: { name: string; class: string } } = {
  '1': { name: 'Lavender', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  '4': { name: 'Relationships', class: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  '6': { name: 'Insurance', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  '8': { name: 'Home', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  '9': { name: 'Vehicles', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  '10': { name: 'Pets', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  '11': { name: 'Health', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

export default function CalendarPage() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📅 Calendar - Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        email: session?.user?.email,
      })
      
      setSession(session)
      setLoading(false)
      
      // Always try to fetch events if signed in - API handles token refresh automatically
      if (session) {
        console.log('📅 Session found, fetching events via API (handles token refresh)...')
        fetchEvents()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('📅 Auth state changed:', _event, {
        hasSession: !!session,
      })
      setSession(session)
      if (session) {
        fetchEvents()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Fetch calendar events from our API (handles token refresh automatically)
   */
  const fetchEvents = async () => {
    console.log('📅 Fetching events via API route (auto-refresh enabled)...')
    
    setSyncing(true)
    setError('')

    try {
      // Use our API route which handles token refresh automatically
      const response = await fetch('/api/calendar/sync?days=90', {
        credentials: 'include',
      })

      const data = await response.json()
      console.log('📅 API Response:', response.status, data)

      if (!response.ok) {
        // Only show re-auth error if refresh token itself is invalid
        if (data.needsReauth) {
          setError('Calendar access expired. Please sign out and sign back in.')
        } else {
          throw new Error(data.error || `Failed to fetch events (${response.status})`)
        }
        return
      }

      console.log('✅ Successfully fetched events:', {
        count: data.events?.length || 0,
      })
      
      setEvents(data.events || [])
      setLastSync(new Date())
    } catch (err: any) {
      console.error('❌ Error fetching calendar events:', err)
      setError(err.message || 'Failed to load calendar events')
    } finally {
      setSyncing(false)
    }
  }

  const handleRefresh = () => {
    if (session) {
      fetchEvents()
    }
  }

  const handleReauth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: [
          'email',
          'profile', 
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
        ].join(' ')
      },
    })
  }

  const getEventDate = (event: CalendarEvent) => {
    const dateStr = event.start.dateTime || event.start.date
    if (!dateStr) return null
    return parseISO(dateStr)
  }

  const formatEventDate = (event: CalendarEvent) => {
    const date = getEventDate(event)
    if (!date) return 'No date'

    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'

    if (event.start.dateTime) {
      return format(date, 'MMM d, yyyy h:mm a')
    }
    return format(date, 'MMM d, yyyy')
  }

  // Calendar grid helpers
  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = getEventDate(event)
      return eventDate && isSameDay(eventDate, day)
    })
  }

  const groupEventsByDate = () => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    events.forEach((event) => {
      const date = getEventDate(event)
      if (!date) return
      const key = format(date, 'yyyy-MM-dd')
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(event)
    })
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show sign in prompt if not signed in at all
  if (!session) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sign in to view your calendar events.
            </p>
            <Button onClick={handleReauth} className="w-full">
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth()
  const groupedEvents = groupEventsByDate()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Calendar Error Alert */}
      <CalendarErrorAlert />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <CalendarIcon className="h-10 w-10" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            {events.length} events from Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-sm text-muted-foreground">
              Last synced: {format(lastSync, 'h:mm a')}
            </span>
          )}
          <Button onClick={handleRefresh} disabled={syncing} size="sm">
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
              <Button onClick={handleReauth} size="sm" variant="outline" className="ml-auto">
                Re-authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {daysInMonth.map((day, idx) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday_ = isToday(day)

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] border rounded-lg p-2 ${
                      isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                    } ${isToday_ ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isToday_
                          ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const timeStr = event.start.dateTime
                          ? format(parseISO(event.start.dateTime), 'h:mm a')
                          : 'All day'
                        
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                              event.colorId && COLOR_LABELS[event.colorId]
                                ? COLOR_LABELS[event.colorId].class
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                            title={`${event.summary} - ${timeStr}`}
                          >
                            <div className="font-semibold truncate">{event.summary}</div>
                            <div className="text-[10px] opacity-80">{timeStr}</div>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {syncing && !events.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  You don't have any calendar events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedEvents.map(([dateKey, dayEvents]) => {
                const firstEvent = dayEvents[0]
                const date = getEventDate(firstEvent)

                return (
                  <div key={dateKey}>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      {date && format(date, 'EEEE, MMMM d, yyyy')}
                      <Badge variant="secondary">{dayEvents.length}</Badge>
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                      {dayEvents.map((event) => (
                        <Card key={event.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="flex items-start justify-between gap-2">
                              <span className="flex-1">{event.summary}</span>
                              {event.colorId && COLOR_LABELS[event.colorId] && (
                                <Badge className={COLOR_LABELS[event.colorId].class}>
                                  {COLOR_LABELS[event.colorId].name}
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatEventDate(event)}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}

                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-block"
                            >
                              View in Google Calendar →
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}



