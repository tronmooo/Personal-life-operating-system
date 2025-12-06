'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Plus, Trash2, Edit, Clock, MapPin } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format, parseISO, isFuture, isPast, isToday, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export default function AppointmentsPage() {
  const router = useRouter()
  const { events, addEvent, deleteEvent } = useData()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  })
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'past'>('upcoming')

  const filteredEvents = events.filter(event => {
    try {
      const eventDate = parseISO(event.date)
      
      if (filter === 'upcoming') return isFuture(eventDate) && !isToday(eventDate)
      if (filter === 'today') return isToday(eventDate)
      if (filter === 'past') return isPast(eventDate) && !isToday(eventDate)
      return true
    } catch {
      return false
    }
  }).sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } catch {
      return 0
    }
  })

  const monthDays = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
  const eventsByDate = filteredEvents.reduce((acc: any, ev: any) => {
    const key = ev.date
    acc[key] = acc[key] || []
    acc[key].push(ev)
    return acc
  }, {})

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    
    addEvent({
      title: formData.title,
      date: formData.date,
      type: formData.time,
      description: `${formData.time}${formData.location ? ' at ' + formData.location : ''}${formData.notes ? ' - ' + formData.notes : ''}`
    })
    
    setFormData({ title: '', date: '', time: '', location: '', notes: '' })
    setShowAddDialog(false)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Note: useData doesn't have updateEvent, so we'll delete and re-add
    if (editingEvent) {
      deleteEvent(editingEvent.id)
      addEvent({
        title: formData.title,
        date: formData.date,
        type: formData.time,
        description: `${formData.time}${formData.location ? ' at ' + formData.location : ''}${formData.notes ? ' - ' + formData.notes : ''}`
      })
    }
    
    setFormData({ title: '', date: '', time: '', location: '', notes: '' })
    setEditingEvent(null)
    setShowEditDialog(false)
  }

  const openEditDialog = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      date: event.date,
      time: event.type || event.metadata?.time || '',
      location: event.metadata?.location || '',
      notes: event.metadata?.notes || ''
    })
    setShowEditDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(id)
    }
  }

  const getEventBadgeColor = (date: string) => {
    try {
      const eventDate = parseISO(date)
      const daysUntil = differenceInDays(eventDate, new Date())
      
      if (isToday(eventDate)) return 'bg-green-100 text-green-800 border-green-300'
      if (daysUntil < 0) return 'bg-gray-100 text-gray-600 border-gray-300'
      if (daysUntil <= 3) return 'bg-red-100 text-red-800 border-red-300'
      if (daysUntil <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      return 'bg-blue-100 text-blue-800 border-blue-300'
    } catch {
      return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const getEventBadgeText = (date: string) => {
    try {
      const eventDate = parseISO(date)
      const daysUntil = differenceInDays(eventDate, new Date())
      
      if (isToday(eventDate)) return 'Today'
      if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`
      if (daysUntil === 1) return 'Tomorrow'
      return `In ${daysUntil} days`
    } catch {
      return 'Unknown'
    }
  }

  return (
    <>
      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Doctor Appointment, Team Meeting"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where is this happening?"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-2">My Calendar</h1>
                <p className="text-blue-100">Manage all your appointments and events</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Filter Buttons */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {[
              { id: 'all', label: 'All Events', count: events.length },
              { id: 'upcoming', label: 'Upcoming', count: events.filter(e => { try { return isFuture(parseISO(e.date)) && !isToday(parseISO(e.date)) } catch { return false } }).length },
              { id: 'today', label: 'Today', count: events.filter(e => { try { return isToday(parseISO(e.date)) } catch { return false } }).length },
              { id: 'past', label: 'Past', count: events.filter(e => { try { return isPast(parseISO(e.date)) && !isToday(parseISO(e.date)) } catch { return false } }).length },
            ].map((btn) => (
              <Button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                variant={filter === btn.id ? 'default' : 'outline'}
                className={filter === btn.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
              >
                {btn.label} ({btn.count})
              </Button>
            ))}
          </div>

          {/* Month Calendar */}
          <Card className="p-6 mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">This Month</h3>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((d) => {
                const key = format(d, 'yyyy-MM-dd')
                const dayEvents = eventsByDate[key] || []
                return (
                  <div key={key} className="min-h-[84px] rounded border p-2 bg-white dark:bg-slate-900">
                    <div className="text-xs text-muted-foreground mb-1">{format(d, 'EEE d')}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((ev: any) => (
                        <div key={ev.id} className="text-[11px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-950 truncate">
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Events Found</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'upcoming' && 'You have no upcoming events scheduled.'}
                {filter === 'today' && 'No events scheduled for today.'}
                {filter === 'past' && 'No past events to show.'}
                {filter === 'all' && 'Start by adding your first event!'}
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Event
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow relative group">
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(event)}
                      className="h-8 w-8 bg-white dark:bg-slate-800 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(event.id)}
                      className="h-8 w-8 bg-white dark:bg-slate-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventBadgeColor(event.date)}`}>
                          {getEventBadgeText(event.date)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        {event.type && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{event.type}</span>
                          </div>
                        )}
                        {(event as any).metadata?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{(event as any).metadata.location}</span>
                          </div>
                        )}
                        {(event as any).metadata?.notes && (
                          <p className="mt-2 text-sm">{(event as any).metadata.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
