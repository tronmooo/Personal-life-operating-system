'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Target, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'

export interface Goal {
  id: string
  name: string
  domain: string
  currentValue: number
  targetValue: number
  unit: string
  targetDate?: string
  startDate: string
  color?: string
  priority?: 'low' | 'medium' | 'high'
}

interface GoalProgressDashboardProps {
  goals: Goal[]
  onGoalClick?: (goalId: string) => void
}

export function GoalProgressDashboard({ goals, onGoalClick }: GoalProgressDashboardProps) {
  const calculateGoalMetrics = (goal: Goal) => {
    const percentComplete = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    const remaining = goal.targetValue - goal.currentValue
    
    if (!goal.targetDate) {
      return {
        percentComplete,
        remaining,
        status: percentComplete === 100 ? 'completed' : 'in-progress',
        projectedCompletion: null,
        onTrack: true,
      }
    }

    const today = new Date()
    const startDate = new Date(goal.startDate)
    const targetDate = new Date(goal.targetDate)
    
    const totalDays = differenceInDays(targetDate, startDate)
    const elapsedDays = differenceInDays(today, startDate)
    const remainingDays = differenceInDays(targetDate, today)
    
    const expectedProgress = (elapsedDays / totalDays) * 100
    const onTrack = percentComplete >= expectedProgress - 5 // 5% tolerance
    
    // Project completion date based on current pace
    const valuePerDay = goal.currentValue / Math.max(elapsedDays, 1)
    const daysToComplete = remaining / Math.max(valuePerDay, 0.1)
    const projectedCompletion = addDays(today, daysToComplete)
    
    const status = percentComplete === 100 ? 'completed' :
                   remainingDays < 0 ? 'overdue' :
                   onTrack ? 'on-track' : 'behind'
    
    return {
      percentComplete,
      remaining,
      remainingDays,
      status,
      onTrack,
      projectedCompletion,
      expectedProgress,
    }
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const aMetrics = calculateGoalMetrics(a)
    const bMetrics = calculateGoalMetrics(b)
    
    // Completed goals last
    if (aMetrics.status === 'completed' && bMetrics.status !== 'completed') return 1
    if (bMetrics.status === 'completed' && aMetrics.status !== 'completed') return -1
    
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const aPriority = priorityOrder[a.priority || 'medium']
    const bPriority = priorityOrder[b.priority || 'medium']
    
    return aPriority - bPriority
  })

  const stats = {
    total: goals.length,
    completed: goals.filter(g => calculateGoalMetrics(g).percentComplete === 100).length,
    onTrack: goals.filter(g => calculateGoalMetrics(g).onTrack).length,
    behind: goals.filter(g => !calculateGoalMetrics(g).onTrack && calculateGoalMetrics(g).status !== 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-3xl font-bold text-blue-600">{stats.onTrack}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Behind</p>
                <p className="text-3xl font-bold text-orange-600">{stats.behind}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
          <CardDescription>Track progress toward your life objectives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No goals set yet</p>
              <p className="text-sm">Add goals to track your progress</p>
            </div>
          ) : (
            sortedGoals.map((goal) => {
              const metrics = calculateGoalMetrics(goal)
              
              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg border hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                  onClick={() => onGoalClick?.(goal.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{goal.name}</h4>
                        {goal.priority && (
                          <Badge
                            variant={
                              goal.priority === 'high' ? 'destructive' :
                              goal.priority === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {goal.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {goal.domain}
                        </Badge>
                        {goal.targetDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Badge
                      variant={
                        metrics.status === 'completed' ? 'default' :
                        metrics.status === 'on-track' ? 'secondary' :
                        metrics.status === 'behind' ? 'outline' : 'destructive'
                      }
                    >
                      {metrics.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {metrics.status === 'on-track' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {metrics.status === 'behind' && <Clock className="h-3 w-3 mr-1" />}
                      {metrics.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {metrics.status}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                      </span>
                      <span className="font-bold">{metrics.percentComplete.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.percentComplete} className="h-3" />
                  </div>

                  {/* Additional Info */}
                  {metrics.status !== 'completed' && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Remaining</p>
                        <p className="font-semibold">
                          {metrics.remaining.toLocaleString()} {goal.unit}
                        </p>
                      </div>
                      {metrics.remainingDays !== undefined && (
                        <div>
                          <p className="text-muted-foreground text-xs">Days Left</p>
                          <p className={`font-semibold ${
                            metrics.remainingDays < 7 ? 'text-red-600' :
                            metrics.remainingDays < 30 ? 'text-orange-600' : ''
                          }`}>
                            {metrics.remainingDays}
                          </p>
                        </div>
                      )}
                      {metrics.projectedCompletion && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">Projected Completion</p>
                          <p className="font-semibold">
                            {format(metrics.projectedCompletion, 'MMM d, yyyy')}
                            {metrics.onTrack ? ' ✓' : ' ⚠️'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}





