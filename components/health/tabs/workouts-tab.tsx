'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Dumbbell, Plus, TrendingUp } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

export function WorkoutsTab() {
  const { healthData, addWorkout } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  
  const [newWorkout, setNewWorkout] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    workoutType: 'cardio' as const,
    workoutName: '',
    duration: 0,
    intensity: 'moderate' as const,
    caloriesBurned: 0,
    location: 'gym' as const,
    howYouFelt: 5,
    notes: ''
  })

  const recentWorkouts = healthData.workouts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  // Calculate weekly stats
  const thisWeekWorkouts = healthData.workouts.filter(w => {
    const workoutDate = parseISO(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  })

  const weeklyMinutes = thisWeekWorkouts.reduce((sum, w) => sum + w.duration, 0)
  const weeklyGoal = 150

  const handleAddWorkout = () => {
    addWorkout(newWorkout)
    setAddDialogOpen(false)
    setNewWorkout({
      date: format(new Date(), 'yyyy-MM-dd'),
      workoutType: 'cardio',
      workoutName: '',
      duration: 0,
      intensity: 'moderate',
      caloriesBurned: 0,
      location: 'gym',
      howYouFelt: 5,
      notes: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Workout
        </Button>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Activity</CardTitle>
          <CardDescription>Track your weekly exercise goal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Minutes</span>
              <span className="text-2xl font-bold">{weeklyMinutes} / {weeklyGoal} min</span>
            </div>
            <Progress value={(weeklyMinutes / weeklyGoal) * 100} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Workouts</p>
              <p className="text-xl font-bold">{thisWeekWorkouts.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Calories Burned</p>
              <p className="text-xl font-bold">
                {thisWeekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts logged yet</p>
          ) : (
            recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <Dumbbell className="h-5 w-5 text-orange-500 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{workout.workoutName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(workout.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">{workout.workoutType}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{workout.duration} min</span>
                    <span>{workout.intensity} intensity</span>
                    {workout.caloriesBurned && <span>{workout.caloriesBurned} cal</span>}
                  </div>
                  {workout.howYouFelt && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">How you felt:</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-2 w-2 rounded-full ${
                              i < (workout.howYouFelt || 0) ? 'bg-orange-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs ml-1">{workout.howYouFelt}/10</span>
                      </div>
                    </div>
                  )}
                  {workout.notes && (
                    <p className="text-sm">{workout.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
            <DialogDescription>Record your exercise session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutType">Workout Type *</Label>
                <Select value={newWorkout.workoutType} onValueChange={(value: any) => setNewWorkout({ ...newWorkout, workoutType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Workout Name *</Label>
              <Input
                id="name"
                placeholder="Morning Run"
                value={newWorkout.workoutName}
                onChange={(e) => setNewWorkout({ ...newWorkout, workoutName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={newWorkout.duration || ''}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity</Label>
                <Select value={newWorkout.intensity} onValueChange={(value: any) => setNewWorkout({ ...newWorkout, intensity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="vigorous">Vigorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories Burned</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="300"
                  value={newWorkout.caloriesBurned || ''}
                  onChange={(e) => setNewWorkout({ ...newWorkout, caloriesBurned: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={newWorkout.location} onValueChange={(value: any) => setNewWorkout({ ...newWorkout, location: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="felt">How did you feel? (1-10)</Label>
              <Input
                id="felt"
                type="number"
                min="1"
                max="10"
                placeholder="7"
                value={newWorkout.howYouFelt || ''}
                onChange={(e) => setNewWorkout({ ...newWorkout, howYouFelt: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Workout details..."
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorkout} disabled={!newWorkout.workoutName || !newWorkout.duration}>
              Log Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



















