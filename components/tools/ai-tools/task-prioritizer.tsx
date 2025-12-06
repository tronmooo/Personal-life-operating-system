'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Zap, Clock, AlertCircle } from 'lucide-react'

export function TaskPrioritizer() {
  const [tasks, setTasks] = useState('')
  const [prioritizing, setPrioritizing] = useState(false)
  const [prioritizedTasks, setPrioritizedTasks] = useState<Array<{
    task: string
    priority: 'urgent' | 'high' | 'medium' | 'low'
    quadrant: string
    reasoning: string
  }> | null>(null)

  const prioritize = () => {
    setPrioritizing(true)

    setTimeout(() => {
      setPrioritizedTasks([
        {
          task: 'Finish client proposal',
          priority: 'urgent',
          quadrant: 'Do First (Urgent & Important)',
          reasoning: 'Deadline today, high business impact'
        },
        {
          task: 'Review Q4 strategy',
          priority: 'high',
          quadrant: 'Schedule (Not Urgent but Important)',
          reasoning: 'Critical for long-term success, schedule dedicated time'
        },
        {
          task: 'Respond to team emails',
          priority: 'medium',
          quadrant: 'Delegate (Urgent but Not Important)',
          reasoning: 'Urgent but could be handled by others'
        },
        {
          task: 'Update LinkedIn profile',
          priority: 'low',
          quadrant: 'Eliminate (Neither Urgent nor Important)',
          reasoning: 'Nice to have, do when you have free time'
        }
      ])
      setPrioritizing(false)
    }, 1500)
  }

  const priorityConfig = {
    urgent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
    high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: Zap },
    medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    low: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Target }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Task Prioritizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            List your tasks and AI will prioritize them using the Eisenhower Matrix (Urgent vs Important).
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
              <strong>Do First:</strong> Urgent & Important
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
              <strong>Schedule:</strong> Not Urgent but Important
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-4 border-yellow-500">
              <strong>Delegate:</strong> Urgent but Not Important
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
              <strong>Eliminate:</strong> Neither Urgent nor Important
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasks">Your Tasks (one per line)</Label>
            <Textarea
              id="tasks"
              placeholder="- Finish client proposal&#10;- Review Q4 strategy&#10;- Respond to team emails&#10;- Update LinkedIn profile"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              rows={6}
            />
          </div>

          <Button
            onClick={prioritize}
            className="w-full"
            disabled={!tasks || prioritizing}
          >
            <Target className="mr-2 h-4 w-4" />
            {prioritizing ? 'Analyzing...' : 'Prioritize My Tasks'}
          </Button>
        </CardContent>
      </Card>

      {prioritizedTasks && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Prioritized Task List</h3>
          {prioritizedTasks.map((item, idx) => {
            const Icon = priorityConfig[item.priority].icon
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-semibold">{item.task}</h4>
                        <Badge className={priorityConfig[item.priority].color}>
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">{item.quadrant}</p>
                        <p>{item.reasoning}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
