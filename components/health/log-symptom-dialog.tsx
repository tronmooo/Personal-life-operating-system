/**
 * Log Symptom Dialog
 * Record symptom entries with triggers and severity
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Loader2 } from 'lucide-react'

interface LogSymptomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COMMON_SYMPTOMS = [
  'Headache',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Pain',
  'Fever',
  'Cough',
  'Shortness of Breath',
  'Insomnia',
  'Anxiety',
  'Other'
]

const MOOD_OPTIONS = ['Great', 'Good', 'Fair', 'Poor']

export function LogSymptomDialog({ open, onOpenChange }: LogSymptomDialogProps) {
  const { create } = useDomainCRUD('health')
  const [saving, setSaving] = useState(false)
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [symptomType, setSymptomType] = useState('')
  const [severity, setSeverity] = useState(5)
  const [duration, setDuration] = useState('')
  const [triggers, setTriggers] = useState('')
  const [mood, setMood] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    if (!symptomType) {
      alert('Please select a symptom type')
      return
    }

    try {
      setSaving(true)
      
      const dateTime = new Date(`${date}T${time}`)
      const triggerArray = triggers.split(',').map(t => t.trim()).filter(Boolean)

      await create({
        domain: 'health',
        title: symptomType,
        description: `Severity: ${severity}/10`,
        metadata: {
          logType: 'symptom',
          symptomType,
          severity,
          duration,
          triggers: triggerArray,
          mood,
          notes,
          date: dateTime.toISOString(),
        },
      })

      // Reset form
      setSymptomType('')
      setSeverity(5)
      setDuration('')
      setTriggers('')
      setMood('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setTime(new Date().toTimeString().slice(0, 5))
      
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Symptom</DialogTitle>
          <DialogDescription>Record a new symptom entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Symptom Type */}
          <div className="space-y-2">
            <Label htmlFor="symptom-type">Symptom Type</Label>
            <Select value={symptomType} onValueChange={setSymptomType}>
              <SelectTrigger>
                <SelectValue placeholder="Select symptom" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_SYMPTOMS.map(symptom => (
                  <SelectItem key={symptom} value={symptom}>
                    {symptom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Slider */}
          <div className="space-y-3">
            <Label>Severity (1-10): {severity}</Label>
            <Slider
              value={[severity]}
              onValueChange={(values) => setSeverity(values[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span className="text-green-600">Mild</span>
              <span className="text-yellow-600">Moderate</span>
              <span className="text-red-600">Severe</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 2 hours, all day"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Possible Triggers */}
          <div className="space-y-2">
            <Label htmlFor="triggers">Possible Triggers</Label>
            <Input
              id="triggers"
              placeholder="e.g., Stress, Diet, Weather"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
            />
            <p className="text-xs text-gray-500">Separate multiple triggers with commas</p>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {MOOD_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the symptom..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

