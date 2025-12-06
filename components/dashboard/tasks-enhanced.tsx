'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Star, Clock, Calendar as CalendarIcon } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { TasksManager } from './tasks-manager'

export function TasksEnhanced() {
  const { tasks } = useData()
  const toggleTask = (id: string) => {} // Placeholder
  const [tasksOpen, setTasksOpen] = useState(false)

  // Categorize tasks
  const today = new Date().toDateString()
  const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date())
  const dueToday = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate).toDateString() === today)
  const upcoming = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) > new Date() && new Date(t.dueDate).toDateString() !== today)
  const noDueDate = tasks.filter(t => !t.completed && !t.dueDate)
  const completed = tasks.filter(t => t.completed)

  const highPriority = tasks.filter(t => !t.completed && t.priority === 'high')

  return (
    <>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setTasksOpen(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Tasks & To-Do
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation()
              setTasksOpen(true)
            }}>
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
              <p className="text-2xl font-bold text-orange-600">{dueToday.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>

          {/* High Priority Tasks */}
          {highPriority.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-red-500" />
                High Priority
              </p>
              {highPriority.slice(0, 3).map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                >
                  <Circle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's Tasks */}
          {dueToday.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Due Today
              </p>
              {dueToday.slice(0, 3).map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                >
                  <Circle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{task.title}</p>
                  </div>
                  {task.priority === 'high' && (
                    <Star className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No tasks yet. Click to add one!</p>
            </div>
          )}

          {/* Progress Bar */}
          {tasks.length > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">
                  {completed.length}/{tasks.length} completed
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(completed.length / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TasksManager open={tasksOpen} onClose={() => setTasksOpen(false)} />
    </>
  )
}








