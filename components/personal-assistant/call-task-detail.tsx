'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Phone, 
  PlayCircle, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  User,
  DollarSign,
  Settings,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface CallTaskDetailProps {
  taskId: string
  onSessionClick?: (sessionId: string) => void
  onBack?: () => void
}

interface CallTask {
  id: string
  title: string
  raw_instruction: string
  status: string
  priority: string
  tone?: string
  max_price?: number
  hard_constraints?: Record<string, any>
  soft_preferences?: Record<string, any>
  ai_plan?: any
  summary?: string
  failure_reason?: string
  follow_up_required?: boolean
  created_at: string
  updated_at: string
  contact?: {
    id: string
    name: string
    company_name?: string
    phone_number: string
    email?: string
  }
  target_phone_number?: string
  sessions?: Array<{
    id: string
    status: string
    started_at: string
    ended_at?: string
    duration_seconds?: number
    call_provider_call_id: string
  }>
}

export function CallTaskDetail({ taskId, onSessionClick, onBack }: CallTaskDetailProps) {
  const [task, setTask] = useState<CallTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const fetchTask = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/call-tasks/${taskId}`)
      const data = await response.json()

      if (response.ok) {
        setTask(data.call_task)
      } else {
        throw new Error(data.error || 'Failed to fetch task')
      }
    } catch (error: any) {
      console.error('Error fetching task:', error)
      toast.error(error.message || 'Failed to load call task')
    } finally {
      setLoading(false)
    }
  }

  const handleStartCall = async () => {
    if (!task) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/call-tasks/${task.id}/start-call`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Call initiated successfully!')
        fetchTask() // Refresh to show updated status
      } else {
        throw new Error(data.error || 'Failed to start call')
      }
    } catch (error: any) {
      console.error('Error starting call:', error)
      toast.error(error.message || 'Failed to start call')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelTask = async () => {
    if (!task) return

    if (!confirm('Are you sure you want to cancel this call task?')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/call-tasks/${task.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Call task cancelled')
        if (onBack) onBack()
      } else {
        throw new Error(data.error || 'Failed to cancel task')
      }
    } catch (error: any) {
      console.error('Error cancelling task:', error)
      toast.error(error.message || 'Failed to cancel task')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The call task you're looking for doesn't exist or you don't have access to it.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const canStartCall = task.status === 'ready_to_call'
  const canCancel = !['completed', 'cancelled', 'in_progress'].includes(task.status)

  return (
    <div className="space-y-4">
      {/* Header */}
      {onBack && (
        <Button onClick={onBack} variant="ghost" size="sm">
          ← Back to List
        </Button>
      )}

      {/* Task Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                {task.status.replace('_', ' ')}
              </Badge>
              {task.priority === 'high' && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Instruction */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Original Request
            </h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {task.raw_instruction}
            </p>
          </div>

          {/* Summary (if completed) */}
          {task.summary && (
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{task.summary}</p>
            </div>
          )}

          {/* Failure Reason (if failed) */}
          {task.failure_reason && (
            <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-1">
                Failure Reason
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">{task.failure_reason}</p>
            </div>
          )}

          {/* Contact Info */}
          {(task.contact || task.target_phone_number) && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {task.contact ? (
                  <>
                    {task.contact.company_name || task.contact.name} - {task.contact.phone_number}
                  </>
                ) : (
                  task.target_phone_number
                )}
              </span>
            </div>
          )}

          {/* Settings */}
          <div className="flex flex-wrap gap-4 text-sm">
            {task.tone && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{task.tone} tone</span>
              </div>
            )}
            {task.max_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Max: ${task.max_price.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Plan */}
      {task.ai_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Plan</CardTitle>
            <CardDescription>What the assistant will do during the call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Goal</h4>
              <p className="text-sm text-muted-foreground">{task.ai_plan.goal}</p>
            </div>

            {task.ai_plan.steps && task.ai_plan.steps.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Steps</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {task.ai_plan.steps.map((step: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {task.ai_plan.questionsToAsk && task.ai_plan.questionsToAsk.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Questions to Ask</h4>
                <ul className="list-disc list-inside space-y-1">
                  {task.ai_plan.questionsToAsk.map((q: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canStartCall && (
            <Button 
              onClick={handleStartCall}
              disabled={actionLoading}
              className="w-full"
              size="lg"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Call...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Call Now
                </>
              )}
            </Button>
          )}

          {task.status === 'in_progress' && (
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-md text-center">
              <Phone className="h-6 w-6 animate-pulse text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">Call in Progress</p>
              <p className="text-xs text-purple-600 mt-1">The assistant is currently on the phone</p>
            </div>
          )}

          {task.status === 'waiting_for_user' && (
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-orange-600 mb-1">
                More Information Needed
              </p>
              <p className="text-xs text-orange-600">
                Please provide missing details to proceed with the call
              </p>
            </div>
          )}

          {canCancel && (
            <Button 
              onClick={handleCancelTask}
              disabled={actionLoading}
              variant="outline"
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Task
            </Button>
          )}

          {task.status === 'completed' && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">Task Completed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call History */}
      {task.sessions && task.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Call History</CardTitle>
            <CardDescription>
              {task.sessions.length} call attempt{task.sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.sessions.map((session, index) => (
                <div 
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSessionClick && onSessionClick(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {session.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Call #{task.sessions!.length - index}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}
                      </div>
                      {session.duration_seconds && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




























