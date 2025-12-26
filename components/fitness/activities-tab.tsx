'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Activity, Trash2, Calendar, Edit, Save, X, Loader2, Clock } from 'lucide-react'
import { format } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { UniversalEntriesView } from '@/components/domains/universal-entries-view'
import type { DomainData } from '@/types/domains'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface FitnessActivity {
  id: string
  activityType: string
  duration: number
  calories: number
  steps?: number
  distance?: number
  exercises?: string
  notes?: string
  date: string
}

export function ActivitiesTab() {
  const [activities, setActivities] = useState<FitnessActivity[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [editingActivity, setEditingActivity] = useState<FitnessActivity | null>(null)
  const [editForm, setEditForm] = useState<Partial<FitnessActivity>>({})
  const { getData, deleteData, updateData } = useData()

  // Transform domain entries to displayable format
  const transformedEntries = activities.map(activity => ({
    id: activity.id,
    title: activity.activityType,
    description: activity.exercises || undefined,
    metadata: {
      duration: activity.duration,
      calories: activity.calories,
      steps: activity.steps,
      distance: activity.distance,
      exercises: activity.exercises,
      notes: activity.notes,
      date: activity.date,
      activityType: activity.activityType,
    },
    createdAt: activity.date,
    updatedAt: activity.date,
  }))

  // Load activities whenever called
  const loadActivities = useCallback(() => {
    console.log('📥 Activities tab: Loading activities from DataProvider...')
    const domainItems = (getData('fitness') || []) as DomainData[]
    console.log('📥 Activities tab: Got', domainItems.length, 'items from getData')
    
    const workouts = domainItems
      .filter((item: any) => {
        let m = item?.metadata || {}
        if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
          m = m.metadata
        }
        const t = m?.itemType || m?.type || m?.logType
        const isWorkout = t === 'activity' || t === 'workout' || t === 'exercise'
        return isWorkout
      })
      .map((item: any) => {
        let m = item?.metadata || {}
        if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
          m = m.metadata
        }
        const exercise: string = m.activityType || m.exercise || 'Workout'
        const duration: number = Number(m.duration || 0)
        const when: string = m.date || m.timestamp || item?.createdAt || new Date().toISOString()
        const calories: number = Number(m.calories || m.caloriesBurned || Math.round(duration * 5))
        const steps: number | undefined = m.steps ? Number(m.steps) : undefined
        const distance: number | undefined = m.distance ? Number(m.distance) : undefined
        
        return {
          id: item.id,
          activityType: exercise.charAt(0).toUpperCase() + exercise.slice(1),
          duration,
          calories,
          steps,
          distance,
          exercises: m.exercises,
          notes: m.notes,
          date: when,
        } as FitnessActivity
      })
      .sort((a: FitnessActivity, b: FitnessActivity) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('📥 Activities tab: Loaded', workouts.length, 'workouts')
    setActivities(workouts)
  }, [getData])

  useEffect(() => {
    loadActivities()
    const handleUpdated = (event?: any) => {
      console.log('🔔 Activities tab received update event:', event?.detail)
      setTimeout(() => {
        loadActivities()
      }, 50)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('data-updated', handleUpdated)
      window.addEventListener('fitness-data-updated', handleUpdated as any)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('data-updated', handleUpdated)
        window.removeEventListener('fitness-data-updated', handleUpdated as any)
      }
    }
  }, [loadActivities])

  const handleDelete = async (id: string) => {
    console.log('🗑️ Activities tab: Deleting activity', id)
    setDeletingIds(prev => new Set(prev).add(id))
    setActivities(prev => prev.filter(a => a.id !== id))
    
    try {
      await deleteData('fitness', id)
      console.log('✅ Activity deleted from database successfully')
    } catch (e) {
      console.error('❌ Failed to delete fitness item:', e)
      loadActivities()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleEdit = (item: any) => {
    const activity = activities.find(a => a.id === item.id)
    if (activity) {
      setEditingActivity(activity)
      setEditForm(activity)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingActivity) return
    try {
      await updateData('fitness', editingActivity.id, {
        metadata: {
          activityType: editForm.activityType,
          duration: editForm.duration,
          calories: editForm.calories,
          steps: editForm.steps,
          distance: editForm.distance,
          exercises: editForm.exercises,
          notes: editForm.notes,
          date: editForm.date,
          itemType: 'activity'
        }
      })
      setEditingActivity(null)
      setEditForm({})
      loadActivities()
    } catch (e) {
      console.error('❌ Failed to update activity:', e)
      alert('Failed to update activity')
    }
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Running': '🏃',
      'Cycling': '🚴',
      'Swimming': '🏊',
      'Yoga': '🧘',
      'Strength Training': '💪',
      'Walking': '🚶',
    }
    return icons[type] || '🏋️'
  }

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'Running': 'from-blue-500 to-blue-600',
      'Cycling': 'from-purple-500 to-purple-600',
      'Swimming': 'from-cyan-500 to-cyan-600',
      'Yoga': 'from-orange-500 to-orange-600',
      'Strength Training': 'from-indigo-500 to-indigo-600',
      'Walking': 'from-green-500 to-green-600',
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  // Custom card renderer for fitness activities
  const renderActivityCard = (item: any) => {
    const activity = activities.find(a => a.id === item.id)
    if (!activity) return null

    return (
      <Card 
        key={activity.id}
        className="p-4 bg-white/80 dark:bg-gray-900/80 hover:shadow-lg transition-all border-l-4 border-indigo-500 group"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2.5 bg-gradient-to-br ${getActivityColor(activity.activityType)} text-white rounded-xl text-xl shrink-0`}>
            {getActivityIcon(activity.activityType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{activity.activityType}</h3>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium shrink-0">
                {activity.duration} min
              </span>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {format(new Date(activity.date), 'EEE, MMM d, yyyy')}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Calories</p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">{activity.calories}</p>
              </div>
              {activity.steps && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Steps</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{activity.steps.toLocaleString()}</p>
                </div>
              )}
              {activity.distance && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Distance</p>
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{activity.distance.toFixed(2)} mi</p>
                </div>
              )}
            </div>

            {activity.exercises && (
              <div className="mt-2 flex flex-wrap gap-1">
                {activity.exercises.split(',').slice(0, 3).map((ex, i) => (
                  <span 
                    key={i}
                    className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px]"
                  >
                    {ex.trim()}
                  </span>
                ))}
                {activity.exercises.split(',').length > 3 && (
                  <span className="text-[10px] text-gray-400">+{activity.exercises.split(',').length - 3} more</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleEdit(item)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(activity.id)}
              disabled={deletingIds.has(activity.id)}
            >
              {deletingIds.has(activity.id) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <UniversalEntriesView
        entries={transformedEntries}
        isLoading={false}
        domainName="Activity"
        domainColor="bg-indigo-600"
        onEdit={handleEdit}
        onDelete={handleDelete}
        deletingIds={deletingIds}
        renderCard={renderActivityCard}
        primaryField="activityType"
        dateField="date"
        additionalFilters={[
          {
            key: 'activityType',
            label: 'Activity Type',
            options: ['Running', 'Cycling', 'Swimming', 'Yoga', 'Strength Training', 'Walking', 'Other']
          }
        ]}
        emptyStateMessage="Start tracking your fitness activities! Log your runs, gym sessions, yoga practice, and more."
        addButtonLabel="Log Activity"
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update your workout details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Activity Type</Label>
                <Input
                  value={editForm.activityType || ''}
                  onChange={(e) => setEditForm({ ...editForm, activityType: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input
                  type="number"
                  value={editForm.duration || 0}
                  onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Calories</Label>
                <Input
                  type="number"
                  value={editForm.calories || 0}
                  onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Steps (optional)</Label>
                <Input
                  type="number"
                  value={editForm.steps || ''}
                  onChange={(e) => setEditForm({ ...editForm, steps: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label className="text-xs">Distance (miles)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.distance || ''}
                  onChange={(e) => setEditForm({ ...editForm, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Exercises (comma-separated)</Label>
              <Input
                value={editForm.exercises || ''}
                onChange={(e) => setEditForm({ ...editForm, exercises: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingActivity(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
