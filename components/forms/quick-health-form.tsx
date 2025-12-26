'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Activity, Weight, Ruler, Thermometer, X, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { useHealthMetrics } from '@/lib/hooks/use-health-metrics'

interface QuickHealthFormProps {
  open: boolean
  onClose: () => void
}

const HEALTH_LOG_TYPES = [
  { value: 'weight', label: 'Weight', icon: Weight, unit: 'lbs', metricType: 'weight' },
  { value: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg', metricType: 'blood-pressure' },
  { value: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm', metricType: 'heart-rate' },
  { value: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°F', metricType: 'temperature' },
  { value: 'height', label: 'Height', icon: Ruler, unit: 'inches', metricType: 'height' },
  { value: 'general', label: 'General Health Note', icon: Heart, unit: '', metricType: 'note' },
]

export function QuickHealthForm({ open, onClose }: QuickHealthFormProps) {
  const [logType, setLogType] = useState('weight')
  const [value, setValue] = useState('')
  const [secondaryValue, setSecondaryValue] = useState('') // For BP diastolic
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState(format(new Date(), 'HH:mm'))
  const [isSaving, setIsSaving] = useState(false)
  const { metrics, addMetric, deleteMetric } = useHealthMetrics()
  const recentLogs = useMemo(() => metrics.slice(0, 10), [metrics])

  const selectedType = HEALTH_LOG_TYPES.find(t => t.value === logType)

  useEffect(() => {
    if (!open) {
      setLogType('weight')
      setValue('')
      setSecondaryValue('')
      setNotes('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime(format(new Date(), 'HH:mm'))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSaving(true)

    try {
      // Create metric object for NEW health system
      const recordedAt = new Date(`${date}T${time}`).toISOString()
      const metricType = selectedType?.metricType || logType
      const numericValue = value ? parseFloat(value) : null
      const secondaryNumeric = secondaryValue ? parseFloat(secondaryValue) : null

      await addMetric({
        metricType,
        recordedAt,
        value: logType !== 'general' ? numericValue : null,
        secondaryValue: logType === 'blood_pressure' ? secondaryNumeric : null,
        unit: selectedType?.unit ?? null,
        notes,
        metadata: {
          logType,
          ...(logType === 'general' ? { entry: value } : {}),
        },
      })

      // Reset form
      setValue('')
      setSecondaryValue('')
      setNotes('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime(format(new Date(), 'HH:mm'))
      setIsSaving(false)

      onClose()
    } catch (error) {
      console.error('Error saving health metric:', error)
      setIsSaving(false)
    }
  }

  const deleteLog = (id: string) => {
    deleteMetric(id).catch(err => console.error('Error deleting log:', err))
  }

  const handleClose = () => {
    setValue('')
    setSecondaryValue('')
    setNotes('')
    setLogType('weight')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setTime(format(new Date(), 'HH:mm'))
    onClose()
  }

  const Icon = selectedType?.icon || Heart

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-red-500" />
            Log Health Data
          </DialogTitle>
          <DialogDescription>
            Quickly log your health metrics. It will be saved to your health domain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logType">What are you logging? *</Label>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_LOG_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {logType !== 'general' && (
            <>
              {logType === 'blood_pressure' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systolic">Systolic (Top)</Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diastolic">Diastolic (Bottom)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      value={secondaryValue}
                      onChange={(e) => setSecondaryValue(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value {selectedType?.unit && `(${selectedType.unit})`}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step={logType === 'weight' ? '0.1' : '1'}
                    placeholder={logType === 'weight' ? '150.5' : ''}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Health Data'}
            </Button>
          </DialogFooter>
        </form>

        {/* Recent Logs */}
        {recentLogs.length > 0 && (
          <div className="border-t pt-4 mt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
              Recent Logs
              <Badge variant="secondary">{recentLogs.length} entries</Badge>
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentLogs.map((log) => {
                const logTypeInfo = HEALTH_LOG_TYPES.find(t => t.metricType === log.metricType)
                const Icon = logTypeInfo?.icon || Heart
                
                let displayValue = ''
                if (log.metricType === 'blood-pressure') {
                  displayValue = `${log.value ?? '--'}/${log.secondaryValue ?? '--'} ${logTypeInfo?.unit || ''}`
                } else if (log.value !== null && log.value !== undefined) {
                  displayValue = `${log.value} ${logTypeInfo?.unit || ''}`
                }
                const notesContent = log.metadata?.notes || log.metadata?.entry
                
                return (
                  <Card key={log.id} className="p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{logTypeInfo?.label || log.metricType}</span>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(log.recordedAt), 'MMM d, h:mm a')}
                            </Badge>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {displayValue}
                          </div>
                          {notesContent && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notesContent}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}








