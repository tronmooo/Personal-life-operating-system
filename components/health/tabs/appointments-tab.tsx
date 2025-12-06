'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar, Plus, Clock, MapPin, Phone } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'

export function AppointmentsTab() {
  const { healthData, addAppointment } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterView, setFilterView] = useState<'upcoming' | 'past'>('upcoming')
  
  const [newApt, setNewApt] = useState({
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    providerName: '',
    providerSpecialty: '',
    facilityName: '',
    appointmentType: 'checkup' as const,
    reasonForVisit: '',
    location: '',
    copayAmount: 0,
    status: 'scheduled' as const,
    reminderDaysBefore: [7, 1],
    remindersSet: true
  })

  const filteredAppointments = healthData.appointments
    .filter(apt => filterView === 'upcoming' ? isFuture(parseISO(apt.dateTime)) : isPast(parseISO(apt.dateTime)))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  const handleAddAppointment = () => {
    addAppointment(newApt)
    setAddDialogOpen(false)
    setNewApt({
      dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      providerName: '',
      providerSpecialty: '',
      facilityName: '',
      appointmentType: 'checkup',
      reasonForVisit: '',
      location: '',
      copayAmount: 0,
      status: 'scheduled',
      reminderDaysBefore: [7, 1],
      remindersSet: true
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant={filterView === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilterView('upcoming')}>
          Upcoming
        </Button>
        <Button variant={filterView === 'past' ? 'default' : 'outline'} onClick={() => setFilterView('past')}>
          Past
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filterView === 'upcoming' ? 'Upcoming' : 'Past'} Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments found</p>
          ) : (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{apt.providerName}</p>
                      <p className="text-sm text-muted-foreground">{apt.providerSpecialty}</p>
                    </div>
                    <Badge variant={apt.status === 'completed' ? 'default' : 'outline'}>
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(apt.dateTime), 'MMM dd, yyyy • h:mm a')}
                    </span>
                    {apt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {apt.location}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{apt.reasonForVisit}</p>
                  {apt.copayAmount && (
                    <p className="text-xs text-muted-foreground">Copay: ${apt.copayAmount}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>Add a new healthcare appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider Name *</Label>
                <Input
                  id="provider"
                  placeholder="Dr. Smith"
                  value={newApt.providerName}
                  onChange={(e) => setNewApt({ ...newApt, providerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  placeholder="Primary Care"
                  value={newApt.providerSpecialty}
                  onChange={(e) => setNewApt({ ...newApt, providerSpecialty: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateTime">Date & Time *</Label>
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={newApt.dateTime}
                  onChange={(e) => setNewApt({ ...newApt, dateTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select value={newApt.appointmentType} onValueChange={(value: any) => setNewApt({ ...newApt, appointmentType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Input
                id="reason"
                placeholder="Annual physical"
                value={newApt.reasonForVisit}
                onChange={(e) => setNewApt({ ...newApt, reasonForVisit: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facility">Facility/Clinic</Label>
                <Input
                  id="facility"
                  placeholder="City Medical Center"
                  value={newApt.facilityName}
                  onChange={(e) => setNewApt({ ...newApt, facilityName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copay">Copay Amount</Label>
                <Input
                  id="copay"
                  type="number"
                  placeholder="25"
                  value={newApt.copayAmount || ''}
                  onChange={(e) => setNewApt({ ...newApt, copayAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location/Address</Label>
              <Textarea
                id="location"
                placeholder="123 Main St, Suite 200"
                value={newApt.location}
                onChange={(e) => setNewApt({ ...newApt, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAppointment} disabled={!newApt.providerName || !newApt.reasonForVisit}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



















