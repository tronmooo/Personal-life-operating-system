'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Activity, Clock, Flame, Footprints, TrendingUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ActivityForm {
  activityType: string
  duration: string
  steps: string
  calories: string
  distance: string
  exercises: string
  notes: string
}

export function AddActivityDialog({ open, onOpenChange }: Props) {
  const { addData } = useData()
  const [formData, setFormData] = useState<ActivityForm>({
    activityType: 'Running',
    duration: '',
    steps: '',
    calories: '',
    distance: '',
    exercises: '',
    notes: ''
  })

  const activityTypes = [
    'Running',
    'Cycling',
    'Swimming',
    'Yoga',
    'Strength Training',
    'Walking',
    'Hiking',
    'Basketball',
    'Tennis',
    'Soccer',
    'Other'
  ]

  const handleSubmit = async () => {
    console.log('💪 ACTIVITY DIALOG: Starting activity submission...')
    
    if (!formData.activityType || !formData.duration) {
      console.warn('⚠️ ACTIVITY DIALOG: Validation failed - missing activity type or duration')
      alert('Please fill in activity type and duration')
      return
    }

    const activityData = {
      title: `${formData.activityType} - ${formData.duration}min`,
      description: `${formData.steps || 0} steps, ${formData.calories || 0} calories${formData.distance ? `, ${formData.distance} mi` : ''}`,
      metadata: {
        itemType: 'activity',
        activityType: formData.activityType,
        duration: parseInt(formData.duration),
        calories: parseInt(formData.calories) || 0,
        caloriesBurned: parseInt(formData.calories) || 0,
        steps: formData.steps ? parseInt(formData.steps) : 0,
        distance: formData.distance ? parseFloat(formData.distance) : 0,
        exercises: formData.exercises || undefined,
        notes: formData.notes || undefined,
        date: new Date().toISOString()
      }
    }

    console.log('💪 ACTIVITY DIALOG: Activity data prepared:', {
      title: activityData.title,
      activityType: formData.activityType,
      duration: formData.duration,
      calories: activityData.metadata.calories,
      steps: activityData.metadata.steps,
      domain: 'fitness'
    })

    try {
      console.log('💪 ACTIVITY DIALOG: Calling addData("fitness", ...)')
      // Save to DATABASE via DataProvider
      await addData('fitness', activityData)
      
      console.log('✅ ACTIVITY DIALOG: Activity logged to database successfully')

      // Reset form
      setFormData({
        activityType: 'Running',
        duration: '',
        steps: '',
        calories: '',
        distance: '',
        exercises: '',
        notes: ''
      })
      
      console.log('🎉 ACTIVITY DIALOG: Form reset, closing dialog')
      onOpenChange(false)
    } catch (error) {
      console.error('❌ ACTIVITY DIALOG: Failed to save activity:', error)
      alert(`Failed to save activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Activity className="w-6 h-6 text-indigo-600" />
            Log Activity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Activity Type */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" />
              Activity Type *
            </Label>
            <select
              className="w-full border rounded-lg p-3 bg-background focus:ring-2 focus:ring-indigo-500"
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
            >
              {activityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                Duration (minutes) *
              </Label>
              <Input
                type="number"
                placeholder="30"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* Calories */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4" />
                Calories Burned
              </Label>
              <Input
                type="number"
                placeholder="300"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Steps */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Footprints className="w-4 h-4" />
                Steps
              </Label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* Distance */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                Distance (miles)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="3.5"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>

          {/* Exercises/Machines */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              💪 Exercises/Machines
            </Label>
            <Input
              placeholder="Bench Press, Squats, Treadmill"
              value={formData.exercises}
              onChange={(e) => setFormData({ ...formData, exercises: e.target.value })}
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple exercises with commas</p>
          </div>

          {/* Notes */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              📝 Notes
            </Label>
            <Textarea
              placeholder="How did you feel? Any achievements or observations?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-lg"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <Activity className="w-5 h-5 mr-2" />
              Log Activity
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

