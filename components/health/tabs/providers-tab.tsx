'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, Plus, Phone, Mail, MapPin, Star } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { Textarea } from '@/components/ui/textarea'

export function ProvidersTab() {
  const { healthData, addProvider } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'doctor' as const,
    specialty: '',
    phoneNumber: '',
    email: '',
    address: '',
    rating: 0,
    notes: ''
  })

  const handleAddProvider = () => {
    addProvider(newProvider)
    setAddDialogOpen(false)
    setNewProvider({
      name: '',
      type: 'doctor',
      specialty: '',
      phoneNumber: '',
      email: '',
      address: '',
      rating: 0,
      notes: ''
    })
  }

  // Group providers by type
  const providersByType = healthData.providers.reduce((acc, provider) => {
    if (!acc[provider.type]) {
      acc[provider.type] = []
    }
    acc[provider.type].push(provider)
    return acc
  }, {} as Record<string, typeof healthData.providers>)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Healthcare Providers</CardTitle>
          <CardDescription>Your care team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(providersByType).length === 0 ? (
            <p className="text-sm text-muted-foreground">No providers added yet</p>
          ) : (
            Object.entries(providersByType).map(([type, providers]) => (
              <div key={type} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">{type}s</h3>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Users className="h-5 w-5 text-blue-500 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            {provider.specialty && (
                              <p className="text-sm text-muted-foreground">{provider.specialty}</p>
                            )}
                          </div>
                          {provider.rating && provider.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{provider.rating}/5</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          {provider.phoneNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {provider.phoneNumber}
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {provider.email}
                            </div>
                          )}
                          {provider.address && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {provider.address}
                            </div>
                          )}
                        </div>
                        {provider.notes && (
                          <p className="text-sm">{provider.notes}</p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Schedule Appointment
                          </Button>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Healthcare Provider</DialogTitle>
            <DialogDescription>Add a doctor, specialist, or facility</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name *</Label>
                <Input
                  id="name"
                  placeholder="Dr. Sarah Johnson"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={newProvider.type} onValueChange={(value: any) => setNewProvider({ ...newProvider, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="dentist">Dentist</SelectItem>
                    <SelectItem value="therapist">Therapist</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="urgent-care">Urgent Care</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                placeholder="Primary Care Physician"
                value={newProvider.specialty}
                onChange={(e) => setNewProvider({ ...newProvider, specialty: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={newProvider.phoneNumber}
                  onChange={(e) => setNewProvider({ ...newProvider, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="office@example.com"
                  value={newProvider.email}
                  onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main St, Suite 200"
                value={newProvider.address}
                onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                placeholder="5"
                value={newProvider.rating || ''}
                onChange={(e) => setNewProvider({ ...newProvider, rating: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={newProvider.notes}
                onChange={(e) => setNewProvider({ ...newProvider, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProvider} disabled={!newProvider.name}>
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



















