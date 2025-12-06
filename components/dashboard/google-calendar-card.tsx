'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, RefreshCw, Loader2, ExternalLink } from 'lucide-react'
import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { formatDistanceToNow, parseISO, format, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { CreateEventDialog } from '@/components/calendar/create-event-dialog'

export function GoogleCalendarCard() {
  const { events, loading, error, refetch, isAuthenticated } = useCalendarEvents(7) // Next 7 days
  const supabase = createClientComponentClient()
  const [isReconnecting, setIsReconnecting] = useState(false)

  console.log('📅 GoogleCalendarCard - Render:', {
    isAuthenticated,
    eventsCount: events.length,
    loading,
    error
  })

  const handleReconnect = async () => {
    console.log('📅 Granting Google Calendar access...')
    setIsReconnecting(true)
    
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      // Use same unified scopes as sign-in page
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' ')
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: scopes,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
    } catch (err) {
      console.error('❌ Calendar auth error:', err)
      setIsReconnecting(false)
    }
  }

  const getEventDate = (event: any) => {
    const dateStr = event.start.dateTime || event.start.date
    if (!dateStr) return null
    return parseISO(dateStr)
  }

  const formatEventTime = (event: any) => {
    const date = getEventDate(event)
    if (!date) return ''

    if (isToday(date)) {
      return event.start.dateTime ? `Today at ${format(date, 'h:mm a')}` : 'Today'
    }
    if (isTomorrow(date)) {
      return event.start.dateTime ? `Tomorrow at ${format(date, 'h:mm a')}` : 'Tomorrow'
    }

    if (event.start.dateTime) {
      return format(date, 'MMM d, h:mm a')
    }
    return format(date, 'MMM d')
  }

  const upcomingEvents = events.slice(0, 5)

  // If not authenticated, show a simple view with sync button (like Smart Inbox)
  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span className="text-lg">Google Calendar</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              1
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">
              Calendar access needs to be refreshed. Click below to reconnect.
            </p>
            <Button 
              onClick={handleReconnect} 
              disabled={isReconnecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isReconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Grant Calendar Access
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="text-lg">Google Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={events.length > 0 ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : ""}>
              {events.length}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full"
              onClick={refetch}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              ) : (
                <RefreshCw className="w-4 h-4 text-purple-600" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
            <Button onClick={handleReconnect} size="sm" variant="outline" className="mt-2 w-full">
              Reconnect Calendar
            </Button>
          </div>
        )}
        
        {!loading && !error && events.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming events in the next 7 days
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <a
                key={event.id}
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950 rounded-lg hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {event.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEventTime(event)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      📍 {event.location}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0 ml-2 mt-1" />
              </a>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <CreateEventDialog />
          {events.length > 0 && (
            <Link href="/calendar" className="block">
              <Button variant="outline" size="sm" className="w-full">
                View All Events ({events.length}) →
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


