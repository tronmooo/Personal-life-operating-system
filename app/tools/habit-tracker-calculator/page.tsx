'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Target, Calendar, TrendingUp } from 'lucide-react'

export default function HabitTrackerCalculator() {
  const [habit, setHabit] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [targetDays, setTargetDays] = useState('21')
  const [completedDays, setCompletedDays] = useState('0')
  
  const [result, setResult] = useState<{
    progressPercent: number
    daysRemaining: number
    completionDate: Date
    streakQuality: string
    milestone: string
  } | null>(null)

  const calculate = () => {
    const target = parseInt(targetDays)
    const completed = parseInt(completedDays)

    if (target <= 0 || completed < 0) return

    const progressPercent = Math.min((completed / target) * 100, 100)
    const daysRemaining = Math.max(target - completed, 0)
    
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + daysRemaining)

    let streakQuality = 'Just Started'
    if (completed >= 66) streakQuality = 'Automatic (66+ days)'
    else if (completed >= 30) streakQuality = 'Strong Habit (30-65 days)'
    else if (completed >= 21) streakQuality = 'Established (21-29 days)'
    else if (completed >= 7) streakQuality = 'Building (7-20 days)'

    let milestone = ''
    if (completed >= 100) milestone = '💎 100 Days - Diamond Habit!'
    else if (completed >= 66) milestone = '🔥 66 Days - Habit Formed!'
    else if (completed >= 30) milestone = '🌟 30 Days - Major Milestone!'
    else if (completed >= 21) milestone = '✨ 21 Days - Habit Building!'
    else if (completed >= 7) milestone = '💪 7 Days - One Week Streak!'
    else if (completed >= 3) milestone = '🎯 3 Days - Getting Started!'

    setResult({
      progressPercent,
      daysRemaining,
      completionDate,
      streakQuality,
      milestone
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <CheckCircle className="mr-3 h-10 w-10 text-green-600" />
          Habit Tracker Calculator
        </h1>
        <p className="text-muted-foreground">
          Track your habit progress and calculate when you'll reach your goal
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Habit Details</CardTitle>
            <CardDescription>Enter your habit tracking information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit">Habit Name</Label>
              <Input
                id="habit"
                placeholder="Exercise, Meditation, Reading..."
                value={habit}
                onChange={(e) => setHabit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="multiple">Multiple times/day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Days</Label>
              <div className="relative">
                <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                21 days to form, 66 days to become automatic
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed">Days Completed</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="completed"
                  type="number"
                  min="0"
                  value={completedDays}
                  onChange={(e) => setCompletedDays(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Progress
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                {habit && <CardDescription>{habit}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground mb-1">Progress</p>
                  <p className="text-5xl font-bold text-green-600">
                    {result.progressPercent.toFixed(0)}%
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${result.progressPercent}%` }}
                    />
                  </div>
                </div>

                {result.milestone && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                    <p className="text-2xl mb-1">{result.milestone}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Days Remaining</p>
                    <p className="text-3xl font-bold text-primary">
                      {result.daysRemaining}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Habit Status</p>
                    <p className="text-sm font-bold text-primary">
                      {result.streakQuality}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Completion Date</p>
                  <p className="text-xl font-bold text-primary">
                    {result.completionDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Habit Formation Science</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• <strong>21 Days:</strong> Initial habit formation period</p>
                <p>• <strong>30 Days:</strong> Habit becomes more natural</p>
                <p>• <strong>66 Days:</strong> Average time for automaticity</p>
                <p>• <strong>100 Days:</strong> Deeply ingrained habit</p>
                <p className="pt-2">
                  <strong>Tip:</strong> Don't break the chain! Consistency is more important than perfection.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Habit Success Tips</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold mb-2">🎯 Make it Specific</p>
            <p className="text-muted-foreground">
              "Exercise 30 minutes" is better than "exercise more."
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">📱 Track Daily</p>
            <p className="text-muted-foreground">
              Visual progress motivates consistency. Use apps or journals.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">🔗 Stack Habits</p>
            <p className="text-muted-foreground">
              Attach new habits to existing routines for better success.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






