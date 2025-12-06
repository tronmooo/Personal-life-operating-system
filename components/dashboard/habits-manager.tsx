'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Activity, Book, Target, Moon, Coffee, Dumbbell, Heart, CheckCircle, Plus, Trash2, Flame, Pill } from 'lucide-react'

const ICON_OPTIONS = [
  { value: 'Activity', label: 'Activity', Icon: Activity },
  { value: 'Book', label: 'Book', Icon: Book },
  { value: 'Target', label: 'Target', Icon: Target },
  { value: 'Moon', label: 'Moon', Icon: Moon },
  { value: 'Coffee', label: 'Coffee', Icon: Coffee },
  { value: 'Dumbbell', label: 'Exercise', Icon: Dumbbell },
  { value: 'Heart', label: 'Heart', Icon: Heart },
  { value: 'Pill', label: 'Medication', Icon: Pill },
]

// Pre-configured medication habits
const MEDICATION_TEMPLATES = [
  { name: 'Morning Medication', icon: 'Pill' },
  { name: 'Evening Medication', icon: 'Pill' },
  { name: 'Daily Vitamin', icon: 'Pill' },
  { name: 'Prescription Medicine', icon: 'Pill' },
]

export function HabitsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { habits, addHabit, deleteHabit, toggleHabit } = useData()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Activity',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addHabit({
      ...formData,
      completed: false,
      streak: 0,
    })
    setFormData({ name: '', icon: 'Activity', frequency: 'daily' })
    setIsAddOpen(false)
  }

  const getIcon = (iconName: string) => {
    const option = ICON_OPTIONS.find(opt => opt.value === iconName)
    return option ? option.Icon : Activity
  }

  const completedHabits = habits.filter(h => h.completed).length

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center">
                  <Flame className="h-5 w-5 mr-2 text-orange-600" />
                  Habits ({completedHabits}/{habits.length})
                </DialogTitle>
                <DialogDescription>
                  Track your daily habits and streaks
                </DialogDescription>
              </div>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
            </div>
          </DialogHeader>

          {/* Quick Add Medication */}
          <div className="pb-3 border-b">
            <Label className="text-sm font-semibold mb-2 flex items-center">
              <Pill className="h-4 w-4 mr-2 text-blue-600" />
              Quick Add Medication
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {MEDICATION_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs"
                  onClick={() => {
                    addHabit({
                      name: template.name,
                      icon: template.icon,
                      frequency: 'daily',
                      completed: false,
                      streak: 0,
                    })
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 py-4">
            {habits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No habits yet. Start tracking your daily habits!</p>
                <p className="text-sm mt-2">Use quick add above for medications!</p>
              </div>
            ) : (
              habits.map((habit) => {
                const Icon = getIcon(habit.icon)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          // Fire confetti if completing a habit with a good streak
                          if (!habit.completed && habit.streak >= 7) {
                            import('@/components/ui/confetti').then(({ fireConfetti }) => {
                              fireConfetti('success')
                            })
                          }
                          toggleHabit(habit.id)
                        }}
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          habit.completed ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {habit.completed ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Icon className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                      <div>
                        <p className={`font-medium text-lg ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            {habit.streak} day streak
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {habit.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteHabit(habit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Habit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
            <DialogDescription>Create a new habit to track daily</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Exercise, Reading, Meditation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <select
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Habit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

