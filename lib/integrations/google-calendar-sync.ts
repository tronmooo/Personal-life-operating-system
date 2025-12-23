import { google } from 'googleapis'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Domain-specific colors for calendar events
const DOMAIN_COLORS = {
  health: '11', // Red
  vehicles: '9', // Blue
  insurance: '6', // Orange
  pets: '10', // Green
  home: '8', // Gray
  relationships: '4', // Pink
  default: '1', // Lavender
}

const looksLikePlaceholder = (value?: string) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return lower.includes('your-project-id') || lower.includes('placeholder') || lower.includes('dummy')
}

let cachedSupabase: SupabaseClient<any, 'public', any> | null | undefined

const getSupabaseClient = (): SupabaseClient<any, 'public', any> | null => {
  if (cachedSupabase !== undefined) {
    return cachedSupabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseAnonKey)) {
    console.warn('GoogleCalendarSync: Supabase credentials missing or invalid. Calendar sync logging is disabled.')
    cachedSupabase = null
    return null
  }

  cachedSupabase = createClient(supabaseUrl, supabaseAnonKey)
  return cachedSupabase
}

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
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
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export class GoogleCalendarSync {
  private calendar

  constructor(accessToken: string, refreshToken?: string) {
    // Note: redirect_uri is only needed for the initial OAuth flow, not for API calls
    // We use the Supabase callback URL for consistency
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : 'http://localhost:3000/auth/callback'

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  }

  /**
   * Fetch calendar events for next 30 days
   */
  async fetchUpcomingEvents(days: number = 30): Promise<any[]> {
    try {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      })

      return response.data.items || []
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      throw error
    }
  }

  /**
   * Create calendar event from domain data
   */
  async createEventFromDomain(
    domain: string,
    data: any,
    userId: string
  ): Promise<string | null> {
    try {
      let event: CalendarEvent | null = null

      switch (domain) {
        case 'health':
          if (data.type === 'appointment' && data.metadata?.appointmentDate) {
            event = {
              summary: `${data.type}: ${data.name}`,
              description: `Health appointment for ${data.name}\nProvider: ${data.metadata.provider || 'N/A'}\nNotes: ${data.notes || 'None'}`,
              start: {
                dateTime: data.metadata.appointmentDate,
                timeZone: 'America/Los_Angeles',
              },
              end: {
                dateTime: new Date(
                  new Date(data.metadata.appointmentDate).getTime() + 60 * 60 * 1000
                ).toISOString(), // 1 hour duration
                timeZone: 'America/Los_Angeles',
              },
              colorId: DOMAIN_COLORS.health,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 1440 }, // 1 day before
                  { method: 'popup', minutes: 60 }, // 1 hour before
                ],
              },
            }
          }
          break

        case 'vehicles':
          if (data.metadata?.nextServiceDate) {
            event = {
              summary: `Vehicle Service: ${data.name} (${data.year} ${data.make} ${data.model})`,
              description: `Service due for ${data.name}\nVIN: ${data.vin || 'N/A'}\nOdometer: ${data.odometer || 'N/A'} miles\nNotes: ${data.notes || 'None'}`,
              start: {
                date: data.metadata.nextServiceDate.split('T')[0],
              },
              end: {
                date: data.metadata.nextServiceDate.split('T')[0],
              },
              colorId: DOMAIN_COLORS.vehicles,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 10080 }, // 7 days before
                  { method: 'popup', minutes: 1440 }, // 1 day before
                ],
              },
            }
          }
          break

        case 'insurance':
          if (data.metadata?.validUntil) {
            const renewalDate = new Date(data.metadata.validUntil)
            renewalDate.setDate(renewalDate.getDate() - 30) // 30 days before expiry

            event = {
              summary: `Insurance Renewal: ${data.name}`,
              description: `${data.type} Insurance expiring on ${data.metadata.validUntil}\nProvider: ${data.metadata.provider || 'N/A'}\nPolicy: ${data.metadata.policyNumber || 'N/A'}`,
              start: {
                date: renewalDate.toISOString().split('T')[0],
              },
              end: {
                date: renewalDate.toISOString().split('T')[0],
              },
              colorId: DOMAIN_COLORS.insurance,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 10080 }, // 7 days before
                  { method: 'popup', minutes: 1440 }, // 1 day before
                ],
              },
            }
          }
          break

        case 'pets':
          if (data.metadata?.nextVetVisit) {
            event = {
              summary: `Vet Appointment: ${data.name}`,
              description: `Vet visit for ${data.name} (${data.species})\nBreed: ${data.breed || 'N/A'}\nVet: ${data.metadata.veterinarian || 'N/A'}\nNotes: ${data.notes || 'None'}`,
              start: {
                dateTime: data.metadata.nextVetVisit,
                timeZone: 'America/Los_Angeles',
              },
              end: {
                dateTime: new Date(
                  new Date(data.metadata.nextVetVisit).getTime() + 30 * 60 * 1000
                ).toISOString(), // 30 minutes
                timeZone: 'America/Los_Angeles',
              },
              colorId: DOMAIN_COLORS.pets,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 1440 }, // 1 day before
                  { method: 'popup', minutes: 60 }, // 1 hour before
                ],
              },
            }
          }
          break

        case 'home':
          if (data.metadata?.dueDate) {
            event = {
              summary: `Home Maintenance: ${data.name}`,
              description: `${data.type} maintenance\nLocation: ${data.metadata.location || 'N/A'}\nNotes: ${data.notes || 'None'}`,
              start: {
                date: data.metadata.dueDate.split('T')[0],
              },
              end: {
                date: data.metadata.dueDate.split('T')[0],
              },
              colorId: DOMAIN_COLORS.home,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 2880 }, // 2 days before
                  { method: 'popup', minutes: 1440 }, // 1 day before
                ],
              },
            }
          }
          break

        case 'relationships':
          if (data.metadata?.birthday) {
            event = {
              summary: `🎂 ${data.name}'s Birthday`,
              description: `Birthday for ${data.name}\nRelationship: ${data.metadata.relationship || 'N/A'}`,
              start: {
                date: data.metadata.birthday.split('T')[0],
              },
              end: {
                date: data.metadata.birthday.split('T')[0],
              },
              colorId: DOMAIN_COLORS.relationships,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 10080 }, // 7 days before
                  { method: 'popup', minutes: 1440 }, // 1 day before
                ],
              },
            }
          }
          if (data.metadata?.anniversary) {
            const anniversaryEvent = {
              summary: `💕 Anniversary: ${data.name}`,
              description: `Anniversary with ${data.name}`,
              start: {
                date: data.metadata.anniversary.split('T')[0],
              },
              end: {
                date: data.metadata.anniversary.split('T')[0],
              },
              colorId: DOMAIN_COLORS.relationships,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 10080 }, // 7 days before
                  { method: 'popup', minutes: 1440 }, // 1 day before
                ],
              },
            }
            // Create anniversary event separately
            const anniversaryResponse = await this.calendar.events.insert({
              calendarId: 'primary',
              requestBody: anniversaryEvent,
            })
            await this.logSync(userId, domain, data.id, anniversaryResponse.data.id!, 'created')
          }
          break
      }

      if (!event) {
        console.log(`No calendar event to create for ${domain}:`, data.id)
        return null
      }

      // Create the event in Google Calendar
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })

      const googleEventId = response.data.id!

      // Log the sync
      await this.logSync(userId, domain, data.id, googleEventId, 'created')

      console.log(`✅ Created calendar event for ${domain}: ${data.name}`)
      return googleEventId
    } catch (error) {
      console.error(`Error creating calendar event for ${domain}:`, error)
      throw error
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    try {
      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updates,
      })
      console.log(`✅ Updated calendar event: ${eventId}`)
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw error
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      })
      console.log(`✅ Deleted calendar event: ${eventId}`)
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw error
    }
  }

  /**
   * Log sync operation to database
   */
  private async logSync(
    userId: string,
    domain: string,
    domainRecordId: string,
    googleEventId: string,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { error } = await supabase.from('calendar_sync_log').insert({
        user_id: userId,
        domain,
        domain_record_id: domainRecordId,
        google_event_id: googleEventId,
        action,
        synced_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error logging sync:', error)
      }
    } catch (error) {
      console.error('Error logging sync:', error)
    }
  }

  /**
   * Check if record is already synced
   */
  static async isSynced(userId: string, domain: string, domainRecordId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return false

      const { data, error } = await supabase
        .from('calendar_sync_log')
        .select('id')
        .eq('user_id', userId)
        .eq('domain', domain)
        .eq('domain_record_id', domainRecordId)
        .single()

      return !!data && !error
    } catch (error) {
      return false
    }
  }

  /**
   * Get Google Event ID for domain record
   */
  static async getGoogleEventId(
    userId: string,
    domain: string,
    domainRecordId: string
  ): Promise<string | null> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return null

      const { data, error } = await supabase
        .from('calendar_sync_log')
        .select('google_event_id')
        .eq('user_id', userId)
        .eq('domain', domain)
        .eq('domain_record_id', domainRecordId)
        .order('synced_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null
      return data.google_event_id
    } catch (error) {
      return null
    }
  }
}





























