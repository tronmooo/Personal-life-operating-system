/**
 * Log Sleep Dialog
 * Record sleep session with detailed metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Loader2 } from 'lucide-react'

interface LogSleepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const QUALITY_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']

/**
 * Calculate sleep duration in hours from bedtime to wake time
 * Handles overnight sleep (e.g., 11:30 PM to 6:00 AM)
 */
function calculateSleepHours(bedtime: string, wakeTime: string): number {
  const [bedHour, bedMin] = bedtime.split(':').map(Number)
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number)
  
  const bedMinutes = bedHour * 60 + bedMin
  let wakeMinutes = wakeHour * 60 + wakeMin
  
  // If wake time is before bedtime, it means we crossed midnight
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60 // Add 24 hours to wake time
  }
  
  const totalMinutes = wakeMinutes - bedMinutes
  const hours = totalMinutes / 60
  
  return Math.round(hours * 10) / 10 // Round to 1 decimal place
}

export function LogSleepDialog({ open, onOpenChange }: LogSleepDialogProps) {
  const { create } = useDomainCRUD('health')
  const [saving, setSaving] = useState(false)
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sleepQuality, setSleepQuality] = useState('')
  const [bedtime, setBedtime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('06:00')
  const [totalHours, setTotalHours] = useState('7.5')
  const [deepSleep, setDeepSleep] = useState('2.0')
  const [remSleep, setRemSleep] = useState('1.8')
  const [lightSleep, setLightSleep] = useState('3.7')
  const [notes, setNotes] = useState('')

  // Auto-calculate total hours when bedtime or wake time changes
  useEffect(() => {
    if (bedtime && wakeTime) {
      const calculatedHours = calculateSleepHours(bedtime, wakeTime)
      setTotalHours(calculatedHours.toString())
    }
  }, [bedtime, wakeTime])

  async function handleSave() {
    if (!sleepQuality) {
      alert('Please select sleep quality')
      return
    }

    try {
      setSaving(true)
      
      const dateTime = new Date(date)

      await create({
        domain: 'health',
        title: `Sleep: ${totalHours}h`,
        description: `Quality: ${sleepQuality}`,
        metadata: {
          logType: 'sleep',
          sleepQuality,
          bedtime,
          wakeTime,
          sleepHours: parseFloat(totalHours),
          deepSleep: parseFloat(deepSleep),
          remSleep: parseFloat(remSleep),
          lightSleep: parseFloat(lightSleep),
          sleepScore: sleepQuality === 'Excellent' ? 90 : sleepQuality === 'Good' ? 75 : sleepQuality === 'Fair' ? 60 : 45,
          notes,
          date: dateTime.toISOString(),
        },
      })

      // Reset form
      setSleepQuality('')
      setTotalHours('7.5')
      setDeepSleep('2.0')
      setRemSleep('1.8')
      setLightSleep('3.7')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Sleep</DialogTitle>
          <DialogDescription>Record your sleep session</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Sleep Quality */}
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
              <Label htmlFor="quality">Sleep Quality</Label>
              <Select value={sleepQuality} onValueChange={setSleepQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="How did you sleep?" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bedtime & Wake Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waketime">Wake Time</Label>
              <Input
                id="waketime"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          {/* Total Hours & Deep Sleep */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total">Total Hours (auto-calculated)</Label>
              <Input
                id="total"
                type="number"
                step="0.5"
                placeholder="7.5"
                value={totalHours}
                disabled
                className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deep">Deep Sleep (hours)</Label>
              <Input
                id="deep"
                type="number"
                step="0.1"
                placeholder="2.0"
                value={deepSleep}
                onChange={(e) => setDeepSleep(e.target.value)}
              />
            </div>
          </div>

          {/* REM & Light Sleep */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rem">REM Sleep (hours)</Label>
              <Input
                id="rem"
                type="number"
                step="0.1"
                placeholder="1.8"
                value={remSleep}
                onChange={(e) => setRemSleep(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="light">Light Sleep (hours)</Label>
              <Input
                id="light"
                type="number"
                step="0.1"
                placeholder="3.7"
                value={lightSleep}
                onChange={(e) => setLightSleep(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How did you feel? Any disturbances?"
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
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Sleep Log'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

