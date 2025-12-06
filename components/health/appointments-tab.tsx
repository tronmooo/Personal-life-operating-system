'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Appointment {
  id: string
  title: string
  doctor: string
  date: string
  time: string
  location?: string
  notes?: string
  status: 'Upcoming' | 'Completed' | 'Cancelled'
}

export function AppointmentsTab() {
  const { getData, addData, deleteData } = useData()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [formData, setFormData] = useState<Partial<Appointment>>({
    status: 'Upcoming'
  })

  // Load appointments from DataProvider
  const loadAppointments = () => {
    const healthData = getData('health')
    const appts = healthData
      .filter(item => {
        const meta = item.metadata as any
        const t = meta?.type || meta?.itemType || (item as any).type
        return t === 'appointment' || t === 'appointments'
      })
      .map(item => {
        const meta = item.metadata as any
        return {
          id: item.id,
          title: meta?.title || item.title || '',
          doctor: meta?.doctor || '',
          date: meta?.date || '',
          time: meta?.time || '',
          location: meta?.location,
          notes: meta?.notes || item.description,
          status: (meta?.status || 'Upcoming') as 'Upcoming' | 'Completed' | 'Cancelled'
        }
      })
      .sort((a, b) => 
        new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
      )
    
    setAppointments(appts)
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => loadAppointments()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('health-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('health-data-updated', handleUpdate)
    }
  }, [])

  const handleAdd = async () => {
    if (!formData.title || !formData.doctor || !formData.date || !formData.time) return

    await addData('health', {
      title: formData.title,
      description: formData.notes || `Appointment with ${formData.doctor}`,
      metadata: {
        type: 'appointment',
        title: formData.title,
        doctor: formData.doctor,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes,
        status: formData.status || 'Upcoming'
      }
    })
    
    setFormData({ status: 'Upcoming' })
    setShowAddForm(false)
  }

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await deleteData('health', id)
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      // Rollback on error
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      loadAppointments()
    }
  }

  const upcomingAppointments = appointments.filter(a => a.status === 'Upcoming')

  return (
    <div className="space-y-6">
      {/* Debug toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebug(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Data
        </button>
      </div>

      {showDebug && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-2">Raw appointment entries used by this tab (types: appointment, appointments)</p>
            <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(appointments, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">All Appointments</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Schedule Appointment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Appointment Title *</Label>
                <Input
                  placeholder="Annual Physical"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Doctor *</Label>
                <Input
                  placeholder="Dr. Sarah Chen"
                  value={formData.doctor || ''}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Location</Label>
                <Input
                  placeholder="123 Medical Center Dr."
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional information..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                Schedule
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {upcomingAppointments.length === 0 ? (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No appointments scheduled</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingAppointments.map((appt) => (
            <Card key={appt.id} className="bg-white dark:bg-gray-900 border-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{appt.title}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full font-medium">
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{appt.doctor}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {appt.date} at {appt.time}
                      </p>
                      {appt.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{appt.location}</p>
                      )}
                      {appt.notes && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm">{appt.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(appt.id)}
                    disabled={deletingIds.has(appt.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingIds.has(appt.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
