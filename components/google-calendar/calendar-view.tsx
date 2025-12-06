'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  getCalendarEvents, 
  getMonthEvents,
  getTodayEvents,
  GoogleCalendarEvent,
  formatEventDateTime,
  isEventNow,
  getEventColor
} from '@/lib/google-calendar'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2
} from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  compact?: boolean
}

export function GoogleCalendarView({ compact = false }: CalendarViewProps) {
  const { addEvent } = useData()
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Form state for adding events
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventStartDate, setNewEventStartDate] = useState('')
  const [newEventStartTime, setNewEventStartTime] = useState('')
  const [newEventEndDate, setNewEventEndDate] = useState('')
  const [newEventEndTime, setNewEventEndTime] = useState('')

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let fetchedEvents: GoogleCalendarEvent[]
      
      if (viewMode === 'month') {
        fetchedEvents = await getMonthEvents(
          selectedDate.getFullYear(),
          selectedDate.getMonth()
        )
      } else if (viewMode === 'day') {
        const timeMin = new Date(selectedDate)
        timeMin.setHours(0, 0, 0, 0)
        const timeMax = new Date(selectedDate)
        timeMax.setHours(23, 59, 59, 999)
        fetchedEvents = await getCalendarEvents('primary', timeMin, timeMax)
      } else {
        // Week view
        const startOfWeek = new Date(selectedDate)
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        fetchedEvents = await getCalendarEvents('primary', startOfWeek, endOfWeek)
      }
      
      setEvents(fetchedEvents)
    } catch (err) {
      console.error('Error loading calendar events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedDate, viewMode])

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: Date[] = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [selectedDate])

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '')
      return eventDate.toDateString() === date.toDateString()
    })
  }

  // Handle add event (save locally since we can't create via API key)
  const handleAddEvent = () => {
    if (!newEventTitle || !newEventStartDate) return

    const startDateTime = `${newEventStartDate}T${newEventStartTime || '00:00'}`
    const endDateTime = `${newEventEndDate || newEventStartDate}T${newEventEndTime || '23:59'}`

    // Add to local data provider
    addEvent({
      title: newEventTitle,
      description: newEventDescription,
      date: startDateTime,
      type: 'appointment',
      reminder: false,
    })

    // Reset form
    setNewEventTitle('')
    setNewEventDescription('')
    setNewEventLocation('')
    setNewEventStartDate('')
    setNewEventStartTime('')
    setNewEventEndDate('')
    setNewEventEndTime('')
    setShowAddDialog(false)

    // Reload events to include local ones
    loadEvents()
  }

  if (loading && events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Failed to Load Calendar</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Make sure your Google Calendar API key is configured correctly and has the necessary permissions.
              </p>
              <Button onClick={loadEvents} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={loadEvents}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDay(day)
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
                  const isToday = day.toDateString() === new Date().toDateString()
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(day)
                        setViewMode('day')
                      }}
                      className={cn(
                        "min-h-[80px] p-2 rounded-lg border text-left transition-colors",
                        isCurrentMonth ? "bg-background" : "bg-muted/30",
                        isToday && "border-primary border-2",
                        "hover:bg-accent cursor-pointer"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        !isCurrentMonth && "text-muted-foreground",
                        isToday && "text-primary font-bold"
                      )}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: getEventColor(event) + '40' }}
                          >
                            {event.summary}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>

              {getEventsForDay(selectedDate).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).map(event => (
                    <Card
                      key={event.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventDialog(true)
                      }}
                      style={{ borderLeftColor: getEventColor(event), borderLeftWidth: '4px' }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{event.summary}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {formatEventDateTime(event)}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                          </div>
                          {isEventNow(event) && (
                            <Badge variant="default" className="bg-green-500">
                              Now
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(selectedDate)
                day.setDate(selectedDate.getDate() - selectedDate.getDay() + i)
                const dayEvents = getEventsForDay(day)
                const isToday = day.toDateString() === new Date().toDateString()

                return (
                  <div key={i} className={cn("border rounded-lg p-4", isToday && "border-primary")}>
                    <h4 className="font-semibold mb-2">
                      {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h4>
                    {dayEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events</p>
                    ) : (
                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="text-sm p-2 rounded cursor-pointer hover:bg-accent"
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventDialog(true)
                            }}
                            style={{ borderLeftColor: getEventColor(event), borderLeftWidth: '3px' }}
                          >
                            <div className="font-medium">{event.summary}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatEventDateTime(event)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.summary}
              {selectedEvent?.htmlLink && (
                <a 
                  href={selectedEvent.htmlLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && formatEventDateTime(selectedEvent)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.location && (
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Attendees</h4>
                  <div className="space-y-1">
                    {selectedEvent.attendees.map((attendee, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <CheckCircle className={cn(
                          "h-4 w-4",
                          attendee.responseStatus === 'accepted' && "text-green-500",
                          attendee.responseStatus === 'declined' && "text-red-500",
                          attendee.responseStatus === 'tentative' && "text-yellow-500"
                        )} />
                        {attendee.displayName || attendee.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.organizer && (
                <div>
                  <h4 className="font-semibold mb-2">Organizer</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.organizer.displayName || selectedEvent.organizer.email}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new appointment or event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Event description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                placeholder="Event location"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start-date">Start Date *</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={newEventStartDate}
                  onChange={(e) => setNewEventStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-start-time">Start Time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-end-date">End Date</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-end-time">End Time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Events created here will be saved locally to your app. 
                To sync with Google Calendar, you&apos;ll need to set up OAuth authentication.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddEvent}
              disabled={!newEventTitle || !newEventStartDate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


