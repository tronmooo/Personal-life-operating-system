'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Pill, Plus, CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO, isToday } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

export function MedicationsTab() {
  const { healthData, addMedication, updateMedication, deleteMedication, logMedicationAdherence } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'refills' | 'history'>('active')
  
  // New medication form state
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as const,
    timesOfDay: ['08:00 AM'],
    purpose: '',
    prescribingDoctor: '',
    pharmacy: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    remainingPills: 0,
    totalPills: 0,
    instructions: '',
    reminderEnabled: true,
    status: 'active' as const
  })

  const activeMeds = healthData.medications.filter(m => m.status === 'active')
  const refillsNeeded = activeMeds.filter(m => {
    if (!m.remainingPills || !m.totalPills) return false
    return (m.remainingPills / m.totalPills) <= 0.2
  })

  const filteredMeds = healthData.medications.filter(m => {
    if (filterStatus === 'active') return m.status === 'active'
    if (filterStatus === 'refills') return refillsNeeded.some(r => r.id === m.id)
    if (filterStatus === 'history') return m.status !== 'active'
    return true
  })

  const handleAddMedication = () => {
    addMedication(newMed)
    setAddDialogOpen(false)
    setNewMed({
      name: '',
      dosage: '',
      frequency: 'daily',
      timesOfDay: ['08:00 AM'],
      purpose: '',
      prescribingDoctor: '',
      pharmacy: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      remainingPills: 0,
      totalPills: 0,
      instructions: '',
      reminderEnabled: true,
      status: 'active'
    })
  }

  const handleTakeMedication = (medId: string) => {
    logMedicationAdherence(medId, { taken: true })
  }

  const handleSkipMedication = (medId: string) => {
    logMedicationAdherence(medId, { taken: false, skipped: true })
  }

  // Calculate adherence statistics
  const adherenceStats = activeMeds.reduce((stats, med) => {
    const last7Days = med.adherenceHistory.slice(-7)
    const taken = last7Days.filter(a => a.taken).length
    const total = last7Days.length
    return {
      taken: stats.taken + taken,
      total: stats.total + total
    }
  }, { taken: 0, total: 0 })

  const adherencePercentage = adherenceStats.total > 0 
    ? Math.round((adherenceStats.taken / adherenceStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button 
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </Button>
        <Button 
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button 
          variant={filterStatus === 'refills' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('refills')}
        >
          Refills Due {refillsNeeded.length > 0 && `(${refillsNeeded.length})`}
        </Button>
        <Button 
          variant={filterStatus === 'history' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('history')}
        >
          History
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Today's Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Medications</CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeMeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active medications</p>
          ) : (
            activeMeds.map((med) => {
              const today = format(new Date(), 'yyyy-MM-dd')
              const todayAdherence = med.adherenceHistory.find(a => a.date === today)
              const isTaken = todayAdherence?.taken

              return (
                <div key={med.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="flex-shrink-0 mt-1">
                    {isTaken ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      </div>
                      {isTaken ? (
                        <Badge variant="default" className="bg-green-500">
                          Taken {todayAdherence?.time}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Due now
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {med.purpose}
                    </p>
                    {med.instructions && (
                      <p className="text-xs text-muted-foreground">
                        {med.instructions}
                      </p>
                    )}
                    {!isTaken && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleTakeMedication(med.id)}>
                          Take Now
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSkipMedication(med.id)}>
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Refills Needed */}
      {refillsNeeded.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Refills Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {refillsNeeded.map((med) => {
              const percentRemaining = med.remainingPills && med.totalPills
                ? (med.remainingPills / med.totalPills) * 100
                : 0

              return (
                <div key={med.id} className="flex items-start gap-4 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      </div>
                      <Badge variant="destructive">
                        {med.remainingPills} pills left
                      </Badge>
                    </div>
                    {med.refillDueDate && (
                      <p className="text-sm">
                        Refill by: {format(parseISO(med.refillDueDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                    {med.pharmacy && (
                      <p className="text-xs text-muted-foreground">
                        {med.pharmacy}
                      </p>
                    )}
                    <Button size="sm" variant="outline">
                      Request Refill
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* All Medications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredMeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications found</p>
          ) : (
            filteredMeds.map((med) => (
              <div key={med.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <Pill className="h-5 w-5 text-blue-500 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} • {med.frequency.replace('-', ' ')}
                      </p>
                    </div>
                    <Badge variant={med.status === 'active' ? 'default' : 'secondary'}>
                      {med.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{med.purpose}</p>
                  {med.prescribingDoctor && (
                    <p className="text-xs text-muted-foreground">
                      Prescribed by: {med.prescribingDoctor}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Adherence Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Adherence Statistics</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Adherence</span>
              <span className="text-2xl font-bold">{adherencePercentage}%</span>
            </div>
            <Progress value={adherencePercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {adherenceStats.taken} of {adherenceStats.total} doses taken
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Add a medication to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medication Name *</Label>
                <Input
                  id="name"
                  placeholder="Lisinopril"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  placeholder="10mg"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Input
                id="purpose"
                placeholder="High Blood Pressure"
                value={newMed.purpose}
                onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={newMed.frequency} onValueChange={(value: any) => setNewMed({ ...newMed, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice-daily">Twice Daily</SelectItem>
                    <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="as-needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newMed.startDate}
                  onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">Prescribing Doctor</Label>
                <Input
                  id="doctor"
                  placeholder="Dr. Smith"
                  value={newMed.prescribingDoctor}
                  onChange={(e) => setNewMed({ ...newMed, prescribingDoctor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pharmacy">Pharmacy</Label>
                <Input
                  id="pharmacy"
                  placeholder="CVS Pharmacy"
                  value={newMed.pharmacy}
                  onChange={(e) => setNewMed({ ...newMed, pharmacy: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPills">Total Pills</Label>
                <Input
                  id="totalPills"
                  type="number"
                  placeholder="30"
                  value={newMed.totalPills || ''}
                  onChange={(e) => setNewMed({ ...newMed, totalPills: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remainingPills">Pills Remaining</Label>
                <Input
                  id="remainingPills"
                  type="number"
                  placeholder="30"
                  value={newMed.remainingPills || ''}
                  onChange={(e) => setNewMed({ ...newMed, remainingPills: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Take with food"
                value={newMed.instructions}
                onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminders"
                checked={newMed.reminderEnabled}
                onCheckedChange={(checked) => setNewMed({ ...newMed, reminderEnabled: checked as boolean })}
              />
              <label htmlFor="reminders" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable reminders
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMedication} disabled={!newMed.name || !newMed.dosage || !newMed.purpose}>
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



















