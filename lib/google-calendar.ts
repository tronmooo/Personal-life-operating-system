/**
 * Google Calendar API Integration
 * Handles fetching and creating calendar events
 */

const GOOGLE_CALENDAR_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || ''
const GOOGLE_CALENDAR_API_BASE_URL = 'https://www.googleapis.com/calendar/v3'

if (!GOOGLE_CALENDAR_API_KEY) {
  console.warn('Google Calendar API key not found. Set NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY in .env.local')
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status?: string
  htmlLink?: string
  creator?: {
    email?: string
    displayName?: string
  }
  organizer?: {
    email?: string
    displayName?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: string
      minutes: number
    }>
  }
  colorId?: string
  recurrence?: string[]
}

export interface CalendarListEntry {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  accessRole?: string
}

/**
 * Initialize Google Calendar API
 * This should be called once when the app loads
 */
export async function initGoogleCalendar() {
  // For client-side API key usage, we'll use the REST API directly
  // No initialization needed for API key-based access
  return true
}

/**
 * Get list of calendars accessible to the user
 */
export async function getCalendarList(): Promise<CalendarListEntry[]> {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList?key=${GOOGLE_CALENDAR_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar list: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching calendar list:', error)
    throw error
  }
}

/**
 * Get events from a specific calendar
 */
export async function getCalendarEvents(
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 250
): Promise<GoogleCalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      key: GOOGLE_CALENDAR_API_KEY,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: maxResults.toString(),
    })

    if (timeMin) {
      params.append('timeMin', timeMin.toISOString())
    }

    if (timeMax) {
      params.append('timeMax', timeMax.toISOString())
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    throw error
  }
}

/**
 * Get events for a specific month
 */
export async function getMonthEvents(
  year: number,
  month: number,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const timeMin = new Date(year, month, 1)
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59)
  
  return getCalendarEvents(calendarId, timeMin, timeMax)
}

/**
 * Get events for today
 */
export async function getTodayEvents(
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const today = new Date()
  const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  
  return getCalendarEvents(calendarId, timeMin, timeMax)
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(
  days: number = 7,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const timeMin = new Date()
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + days)
  
  return getCalendarEvents(calendarId, timeMin, timeMax)
}

/**
 * Create a new calendar event
 * Note: This requires OAuth authentication, not just an API key
 * For now, this will return an error prompting OAuth setup
 */
export async function createCalendarEvent(
  event: {
    summary: string
    description?: string
    location?: string
    startDateTime: string
    endDateTime: string
    timeZone?: string
    reminders?: {
      useDefault?: boolean
      overrides?: Array<{
        method: string
        minutes: number
      }>
    }
  },
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> {
  // Creating events requires OAuth authentication
  // API keys only allow read-only access
  throw new Error(
    'Creating events requires OAuth authentication. Please set up OAuth in your Google Cloud Console and update the integration.'
  )
  
  // Once OAuth is set up, this would be the implementation:
  /*
  const eventBody = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startDateTime,
      timeZone: event.timeZone || 'America/New_York',
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: event.timeZone || 'America/New_York',
    },
    reminders: event.reminders,
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?key=${GOOGLE_CALENDAR_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oAuthToken}`,
      },
      body: JSON.stringify(eventBody),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.statusText}`)
  }

  return await response.json()
  */
}

/**
 * Format event date/time for display
 */
export function formatEventDateTime(event: GoogleCalendarEvent): string {
  const start = event.start.dateTime || event.start.date
  if (!start) return 'No date'

  const startDate = new Date(start)
  const now = new Date()
  const isToday = startDate.toDateString() === now.toDateString()
  const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()

  if (event.start.dateTime) {
    // Time-based event
    const timeStr = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (isToday) return `Today at ${timeStr}`
    if (isTomorrow) return `Tomorrow at ${timeStr}`
    
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } else {
    // All-day event
    if (isToday) return 'Today (All day)'
    if (isTomorrow) return 'Tomorrow (All day)'
    
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ' (All day)'
  }
}

/**
 * Check if event is happening now
 */
export function isEventNow(event: GoogleCalendarEvent): boolean {
  const now = new Date()
  const start = new Date(event.start.dateTime || event.start.date || '')
  const end = new Date(event.end.dateTime || event.end.date || '')
  
  return now >= start && now <= end
}

/**
 * Get color for event based on calendar or event color
 */
export function getEventColor(event: GoogleCalendarEvent): string {
  // Google Calendar color IDs
  const colors: Record<string, string> = {
    '1': '#a4bdfc', // Lavender
    '2': '#7ae7bf', // Sage
    '3': '#dbadff', // Grape
    '4': '#ff887c', // Flamingo
    '5': '#fbd75b', // Banana
    '6': '#ffb878', // Tangerine
    '7': '#46d6db', // Peacock
    '8': '#e1e1e1', // Graphite
    '9': '#5484ed', // Blueberry
    '10': '#51b749', // Basil
    '11': '#dc2127', // Tomato
  }

  if (event.colorId && colors[event.colorId]) {
    return colors[event.colorId]
  }

  return '#3b82f6' // Default blue
}

