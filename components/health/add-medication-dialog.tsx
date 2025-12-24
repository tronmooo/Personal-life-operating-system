/**
 * Add Medication Dialog
 * Create new medication entries with schedule and details
 * Automatically creates a habit for medication reminders
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
// eslint-disable-next-line no-restricted-imports -- Need addHabit for medication habit creation
import { useData } from '@/lib/providers/data-provider'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/utils/toast'

interface AddMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every 12 hours',
  'Every 8 hours',
  'As needed'
]

// Helper to convert medication frequency to habit frequency
function getHabitFrequency(medFrequency: string): 'daily' | 'weekly' | 'monthly' {
  const freq = medFrequency.toLowerCase()
  if (freq.includes('weekly')) return 'weekly'
  if (freq.includes('monthly')) return 'monthly'
  return 'daily' // Most medications are daily
}

// Helper to format time for display (convert 24h to 12h format)
function formatTimeForDisplay(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function AddMedicationDialog({ open, onOpenChange }: AddMedicationDialogProps) {
  const { create } = useDomainCRUD('health')
  const { addHabit } = useData()
  const [saving, setSaving] = useState(false)
  
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [scheduledTime, setScheduledTime] = useState('08:00')
  const [prescribedBy, setPrescribedBy] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [refillDate, setRefillDate] = useState('')
  const [instructions, setInstructions] = useState('')

  async function handleSave() {
    if (!name || !frequency) {
      alert('Please fill in medication name and frequency')
      return
    }

    try {
      setSaving(true)

      // Create the medication entry
      await create({
        domain: 'health',
        title: `${name} ${dosage}`.trim(),
        description: frequency,
        metadata: {
          logType: 'medication',
          name,
          dosage,
          frequency,
          scheduledTime,
          prescribedBy: prescribedBy || 'Dr. Sarah Smith',
          startDate,
          refillDate,
          instructions,
          taken: false,
        },
      })

      // Automatically create a habit for the medication if there's a scheduled time
      if (scheduledTime) {
        const timeDisplay = formatTimeForDisplay(scheduledTime)
        const habitName = dosage 
          ? `Take ${name} (${dosage}) at ${timeDisplay}`
          : `Take ${name} at ${timeDisplay}`
        
        await addHabit({
          name: habitName,
          icon: '💊',
          frequency: getHabitFrequency(frequency),
          completed: false,
          streak: 0,
        })
        
        toast.success('Medication & Habit Created', `Added ${name} and created a daily habit reminder for ${timeDisplay}`)
      }

      // Reset form
      setName('')
      setDosage('')
      setFrequency('')
      setScheduledTime('08:00')
      setPrescribedBy('')
      setStartDate(new Date().toISOString().split('T')[0])
      setRefillDate('')
      setInstructions('')
      
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
          <DialogDescription>Add a new medication to your tracking list</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Name & Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                placeholder="Lisinopril"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="10mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
          </div>

          {/* Frequency & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Scheduled Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Prescribed By */}
          <div className="space-y-2">
            <Label htmlFor="prescribedBy">Prescribed By</Label>
            <Input
              id="prescribedBy"
              placeholder="Dr. Sarah Smith"
              value={prescribedBy}
              onChange={(e) => setPrescribedBy(e.target.value)}
            />
          </div>

          {/* Start Date & Refill Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refillDate">Refill Date</Label>
              <Input
                id="refillDate"
                type="date"
                value={refillDate}
                onChange={(e) => setRefillDate(e.target.value)}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Take with water in the morning"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Medication'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


