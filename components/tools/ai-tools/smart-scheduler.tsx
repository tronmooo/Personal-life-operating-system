'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Sparkles, Plus } from 'lucide-react'

interface Event {
  id: string
  title: string
  date: string
  time: string
  type: 'meeting' | 'appointment' | 'reminder' | 'task'
  aiSuggested: boolean
}

export function SmartScheduler() {
  const [events, setEvents] = useState<Event[]>([
    { id: '1', title: 'Annual Physical Checkup', date: '2024-02-15', time: '10:00 AM', type: 'appointment', aiSuggested: true },
    { id: '2', title: 'Car Insurance Renewal', date: '2024-02-20', time: '—', type: 'reminder', aiSuggested: true },
    { id: '3', title: 'Team Standup', date: '2024-01-18', time: '9:00 AM', type: 'meeting', aiSuggested: false },
  ])

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date())
  const aiSuggested = events.filter(e => e.aiSuggested).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-500" />
            AI Smart Scheduler
          </CardTitle>
          <CardDescription>
            Auto-schedule appointments, set reminders, and optimize your calendar with AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-600">{upcomingEvents.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{aiSuggested}</p>
              <p className="text-sm text-muted-foreground">AI Suggested</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">3</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Event
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{event.title}</p>
                    {event.aiSuggested && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
                </div>
              </div>
              <Badge variant="outline">{event.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>📅 Schedule your annual physical - it's been 11 months</li>
            <li>🚗 Car insurance renewal is due in 30 days - get quotes now</li>
            <li>⏰ Best time for focused work: 9 AM - 12 PM based on your calendar</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}































