'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Activity, Trash2, Calendar, Edit, Save, X } from 'lucide-react'
import { format } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FitnessActivity>>({})
  const { getData, deleteData, updateData } = useData()

  // Load activities whenever called
  const loadActivities = useCallback(() => {
    console.log('📥 Activities tab: Loading activities from DataProvider...')
    const domainItems = (getData('fitness') || []) as DomainData[]
    console.log('📥 Activities tab: Got', domainItems.length, 'items from getData')
    console.log('📥 Activities tab: All items:', domainItems.map(i => ({ id: i.id, title: i.title, metadata: i.metadata })))
    
    const workouts = domainItems
      .filter((item: any) => {
        // FIX: Handle double-nesting bug (some old entries have metadata.metadata)
        let m = item?.metadata || {}
        if (m?.metadata && typeof m.metadata === 'object' && Object.keys(m).length === 1) {
          m = m.metadata
        }
        const t = m?.itemType || m?.type || m?.logType
        const isWorkout = t === 'activity' || t === 'workout' || t === 'exercise'
        console.log(`📥 Checking item ${item.id}: type="${t}", isWorkout=${isWorkout}`)
        return isWorkout
      })
      .map((item: any) => {
        let m = item?.metadata || {}
        // Handle double-nesting
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
    // Listen for live updates from DataProvider
    const handleUpdated = (event?: any) => {
      console.log('🔔 Activities tab received update event:', event?.detail)
      // Small delay to ensure DataProvider state has propagated
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

  // Removed localStorage listener; DataProvider events are handled above

  const handleDelete = async (id: string) => {
    console.log('🗑️ Activities tab: Deleting activity', id)
    // Optimistic UI update - remove immediately for instant feedback
    setDeletingIds(prev => new Set(prev).add(id))
    setActivities(prev => {
      const filtered = prev.filter(a => a.id !== id)
      console.log('🗑️ Activities tab: Optimistically removed. New count:', filtered.length)
      return filtered
    })
    
    try {
      await deleteData('fitness', id)
      console.log('✅ Activity deleted from database successfully')
      // Don't reload - optimistic update is already done
    } catch (e) {
      console.error('❌ Failed to delete fitness item:', e)
      // Rollback - reload data if delete failed
      loadActivities()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleEdit = (activity: FitnessActivity) => {
    setEditingId(activity.id)
    setEditForm(activity)
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await updateData('fitness', id, {
        metadata: {
          activityType: editForm.activityType,
          duration: editForm.duration,
          calories: editForm.calories,
          steps: editForm.steps,
          distance: editForm.distance,
          exercises: editForm.exercises,
          notes: editForm.notes,
          date: editForm.date
        }
      })
      setEditingId(null)
      setEditForm({})
      loadActivities()
    } catch (e) {
      console.error('❌ Failed to update activity:', e)
      alert('Failed to update activity')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
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

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold">Activity History</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'} logged
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No activities logged yet</p>
            <p className="text-sm text-gray-500">Click "Log Activity" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const isEditing = editingId === activity.id
              return (
                <Card 
                  key={activity.id}
                  className="p-5 bg-gradient-to-r hover:shadow-lg transition-all border-l-4 border-indigo-500"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Activity Type</Label>
                          <Input
                            value={editForm.activityType || ''}
                            onChange={(e) => setEditForm({ ...editForm, activityType: e.target.value })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duration (min)</Label>
                          <Input
                            type="number"
                            value={editForm.duration || 0}
                            onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Calories</Label>
                          <Input
                            type="number"
                            value={editForm.calories || 0}
                            onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Steps (optional)</Label>
                          <Input
                            type="number"
                            value={editForm.steps || ''}
                            onChange={(e) => setEditForm({ ...editForm, steps: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Distance (miles)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.distance || ''}
                            onChange={(e) => setEditForm({ ...editForm, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Exercises (comma-separated)</Label>
                        <Input
                          value={editForm.exercises || ''}
                          onChange={(e) => setEditForm({ ...editForm, exercises: e.target.value })}
                          className="h-8"
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
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(activity.id)}>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 bg-gradient-to-br ${getActivityColor(activity.activityType)} text-white rounded-xl text-2xl`}>
                          {getActivityIcon(activity.activityType)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{activity.activityType}</h3>
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                              {activity.duration} min
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {format(new Date(activity.date), 'EEEE, MMMM d, yyyy')}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {activity.steps && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Steps</p>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                  {activity.steps.toLocaleString()}
                                </p>
                              </div>
                            )}
                            
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Calories</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                {activity.calories}
                              </p>
                            </div>

                            {activity.distance && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Distance</p>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                  {activity.distance.toFixed(2)} mi
                                </p>
                              </div>
                            )}
                          </div>

                          {activity.exercises && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exercises:</p>
                              <div className="flex flex-wrap gap-2">
                                {activity.exercises.split(',').map((ex, i) => (
                                  <span 
                                    key={i}
                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                                  >
                                    {ex.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {activity.notes && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                "{activity.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          disabled={deletingIds.has(activity.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                          {deletingIds.has(activity.id) ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

