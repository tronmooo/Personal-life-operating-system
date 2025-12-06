'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Clock, Target } from 'lucide-react'

interface WorkoutPlan {
  name: string
  days: Array<{
    day: string
    focus: string
    exercises: Array<{
      name: string
      sets: string
      reps: string
      rest: string
    }>
  }>
}

export function WorkoutPlanner() {
  const [goal, setGoal] = useState<'strength' | 'muscle' | 'endurance' | 'fat-loss'>('muscle')
  const [daysPerWeek, setDaysPerWeek] = useState<'3' | '4' | '5' | '6'>('4')
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)

  const generatePlan = () => {
    const plans: Record<string, WorkoutPlan> = {
      '3-muscle': {
        name: '3-Day Muscle Building',
        days: [
          {
            day: 'Monday',
            focus: 'Push (Chest, Shoulders, Triceps)',
            exercises: [
              { name: 'Bench Press', sets: '4', reps: '8-10', rest: '90s' },
              { name: 'Overhead Press', sets: '3', reps: '8-10', rest: '90s' },
              { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', rest: '60s' },
              { name: 'Lateral Raises', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Tricep Dips', sets: '3', reps: '10-12', rest: '60s' }
            ]
          },
          {
            day: 'Wednesday',
            focus: 'Pull (Back, Biceps)',
            exercises: [
              { name: 'Deadlifts', sets: '4', reps: '6-8', rest: '120s' },
              { name: 'Pull-ups', sets: '3', reps: '8-10', rest: '90s' },
              { name: 'Barbell Rows', sets: '3', reps: '8-10', rest: '90s' },
              { name: 'Face Pulls', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Barbell Curls', sets: '3', reps: '10-12', rest: '60s' }
            ]
          },
          {
            day: 'Friday',
            focus: 'Legs & Core',
            exercises: [
              { name: 'Squats', sets: '4', reps: '8-10', rest: '120s' },
              { name: 'Romanian Deadlifts', sets: '3', reps: '10-12', rest: '90s' },
              { name: 'Leg Press', sets: '3', reps: '12-15', rest: '90s' },
              { name: 'Leg Curls', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Calf Raises', sets: '4', reps: '15-20', rest: '60s' },
              { name: 'Planks', sets: '3', reps: '60s hold', rest: '60s' }
            ]
          }
        ]
      },
      '4-muscle': {
        name: '4-Day Upper/Lower Split',
        days: [
          {
            day: 'Monday',
            focus: 'Upper Body (Strength)',
            exercises: [
              { name: 'Bench Press', sets: '4', reps: '6-8', rest: '120s' },
              { name: 'Barbell Rows', sets: '4', reps: '6-8', rest: '120s' },
              { name: 'Overhead Press', sets: '3', reps: '8-10', rest: '90s' },
              { name: 'Lat Pulldowns', sets: '3', reps: '10-12', rest: '90s' },
              { name: 'Dumbbell Curls', sets: '3', reps: '10-12', rest: '60s' }
            ]
          },
          {
            day: 'Tuesday',
            focus: 'Lower Body (Strength)',
            exercises: [
              { name: 'Squats', sets: '4', reps: '6-8', rest: '120s' },
              { name: 'Romanian Deadlifts', sets: '4', reps: '8-10', rest: '120s' },
              { name: 'Leg Press', sets: '3', reps: '10-12', rest: '90s' },
              { name: 'Leg Curls', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Calf Raises', sets: '4', reps: '15-20', rest: '60s' }
            ]
          },
          {
            day: 'Thursday',
            focus: 'Upper Body (Hypertrophy)',
            exercises: [
              { name: 'Incline Dumbbell Press', sets: '4', reps: '10-12', rest: '90s' },
              { name: 'Cable Rows', sets: '4', reps: '10-12', rest: '90s' },
              { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10-12', rest: '75s' },
              { name: 'Face Pulls', sets: '3', reps: '15-20', rest: '60s' },
              { name: 'Tricep Pushdowns', sets: '3', reps: '12-15', rest: '60s' }
            ]
          },
          {
            day: 'Friday',
            focus: 'Lower Body (Hypertrophy)',
            exercises: [
              { name: 'Front Squats', sets: '4', reps: '10-12', rest: '90s' },
              { name: 'Walking Lunges', sets: '3', reps: '12/leg', rest: '90s' },
              { name: 'Leg Extensions', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Hamstring Curls', sets: '3', reps: '12-15', rest: '60s' },
              { name: 'Seated Calf Raises', sets: '4', reps: '15-20', rest: '60s' }
            ]
          }
        ]
      },
      '3-strength': {
        name: '3-Day Strength Training',
        days: [
          {
            day: 'Monday',
            focus: 'Squat Focus',
            exercises: [
              { name: 'Back Squats', sets: '5', reps: '5', rest: '180s' },
              { name: 'Bench Press', sets: '4', reps: '6', rest: '150s' },
              { name: 'Barbell Rows', sets: '3', reps: '8', rest: '120s' },
              { name: 'Romanian Deadlifts', sets: '3', reps: '8', rest: '120s' }
            ]
          },
          {
            day: 'Wednesday',
            focus: 'Deadlift Focus',
            exercises: [
              { name: 'Deadlifts', sets: '5', reps: '5', rest: '180s' },
              { name: 'Overhead Press', sets: '4', reps: '6', rest: '150s' },
              { name: 'Pull-ups', sets: '3', reps: 'Max', rest: '120s' },
              { name: 'Front Squats', sets: '3', reps: '8', rest: '120s' }
            ]
          },
          {
            day: 'Friday',
            focus: 'Bench Focus',
            exercises: [
              { name: 'Bench Press', sets: '5', reps: '5', rest: '180s' },
              { name: 'Squats', sets: '4', reps: '6', rest: '150s' },
              { name: 'Weighted Dips', sets: '3', reps: '8', rest: '120s' },
              { name: 'Barbell Rows', sets: '3', reps: '8', rest: '120s' }
            ]
          }
        ]
      }
    }

    const key = `${daysPerWeek}-${goal === 'strength' ? 'strength' : 'muscle'}`
    setPlan(plans[key] || plans['4-muscle'])
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="goal">Training Goal</Label>
          <Select value={goal} onValueChange={(value: any) => setGoal(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="muscle">Muscle Building</SelectItem>
              <SelectItem value="endurance">Endurance</SelectItem>
              <SelectItem value="fat-loss">Fat Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="days">Days Per Week</Label>
          <Select value={daysPerWeek} onValueChange={(value: any) => setDaysPerWeek(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="4">4 Days</SelectItem>
              <SelectItem value="5">5 Days</SelectItem>
              <SelectItem value="6">6 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience Level</Label>
          <Select value={experience} onValueChange={(value: any) => setExperience(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generatePlan} className="w-full">
        <Dumbbell className="mr-2 h-4 w-4" />
        Generate Workout Plan
      </Button>

      {plan && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {plan.name}
              </CardTitle>
            </CardHeader>
          </Card>

          {plan.days.map((day, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{day.day}</span>
                  <Badge variant="secondary">{day.focus}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.exercises.map((exercise, exIdx) => (
                    <div key={exIdx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {exercise.rest}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Always warm up for 5-10 minutes before starting.
                Focus on proper form over weight. Progress gradually by adding 2.5-5 lbs when you can complete all sets with good form.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
