'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, Plus, CheckCircle } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'

export function SymptomsTab() {
  const { healthData, addSymptom, updateSymptom } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ongoing' | 'resolved' | 'all'>('ongoing')
  
  const [newSymptom, setNewSymptom] = useState({
    name: '',
    dateRecorded: format(new Date(), 'yyyy-MM-dd'),
    severity: 'mild' as const,
    location: '',
    notes: '',
    status: 'ongoing' as const
  })

  const filteredSymptoms = healthData.symptoms.filter(s => {
    if (filterStatus === 'all') return true
    return s.status === filterStatus
  })

  const handleAddSymptom = () => {
    addSymptom(newSymptom)
    setAddDialogOpen(false)
    setNewSymptom({
      name: '',
      dateRecorded: format(new Date(), 'yyyy-MM-dd'),
      severity: 'mild',
      location: '',
      notes: '',
      status: 'ongoing'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant={filterStatus === 'ongoing' ? 'default' : 'outline'} onClick={() => setFilterStatus('ongoing')}>
          Active
        </Button>
        <Button variant={filterStatus === 'resolved' ? 'default' : 'outline'} onClick={() => setFilterStatus('resolved')}>
          Resolved
        </Button>
        <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')}>
          All
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Symptom
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Symptoms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredSymptoms.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No active symptoms
            </div>
          ) : (
            filteredSymptoms.map((symptom) => (
              <div key={symptom.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <AlertCircle className={`h-5 w-5 mt-1 ${
                  symptom.severity === 'severe' ? 'text-red-500' :
                  symptom.severity === 'moderate' ? 'text-orange-500' : 'text-yellow-500'
                }`} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{symptom.name}</p>
                      {symptom.location && (
                        <p className="text-sm text-muted-foreground">Location: {symptom.location}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        symptom.severity === 'severe' ? 'destructive' :
                        symptom.severity === 'moderate' ? 'default' : 'secondary'
                      }>
                        {symptom.severity}
                      </Badge>
                      <Badge variant={symptom.status === 'ongoing' ? 'outline' : 'default'}>
                        {symptom.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Started: {format(parseISO(symptom.dateRecorded), 'MMM dd, yyyy')} 
                    ({differenceInDays(new Date(), parseISO(symptom.dateRecorded))} days ago)
                  </p>
                  {symptom.notes && (
                    <p className="text-sm">{symptom.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Update
                    </Button>
                    {symptom.status === 'ongoing' && (
                      <Button size="sm" variant="outline" onClick={() => updateSymptom(symptom.id, { status: 'resolved' })}>
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chronic Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Chronic Conditions</CardTitle>
          <CardDescription>Long-term health conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthData.conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chronic conditions recorded</p>
          ) : (
            healthData.conditions.map((condition) => (
              <div key={condition.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{condition.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Diagnosed: {format(parseISO(condition.diagnosedDate), 'MMM yyyy')}
                      </p>
                    </div>
                    <Badge variant={condition.status === 'active' ? 'default' : 'secondary'}>
                      {condition.status}
                    </Badge>
                  </div>
                  {condition.treatment && (
                    <p className="text-sm mt-2">Treatment: {condition.treatment}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log New Symptom</DialogTitle>
            <DialogDescription>Record a new symptom or issue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Symptom Name *</Label>
              <Input
                id="name"
                placeholder="Headache"
                value={newSymptom.name}
                onChange={(e) => setNewSymptom({ ...newSymptom, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={newSymptom.severity} onValueChange={(value: any) => setNewSymptom({ ...newSymptom, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newSymptom.dateRecorded}
                  onChange={(e) => setNewSymptom({ ...newSymptom, dateRecorded: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location/Body Part</Label>
              <Input
                id="location"
                placeholder="Head, temples"
                value={newSymptom.location}
                onChange={(e) => setNewSymptom({ ...newSymptom, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Describe the symptom..."
                value={newSymptom.notes}
                onChange={(e) => setNewSymptom({ ...newSymptom, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSymptom} disabled={!newSymptom.name}>
              Log Symptom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

