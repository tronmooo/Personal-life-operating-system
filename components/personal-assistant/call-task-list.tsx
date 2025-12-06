'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  PlayCircle,
  Ban,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface CallTask {
  id: string
  title: string
  raw_instruction: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  contact?: {
    name: string
    phone_number: string
  }
  target_phone_number?: string
  summary?: string
  sessions?: any[]
}

interface CallTaskListProps {
  onTaskClick?: (task: CallTask) => void
  onRefresh?: () => void
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  preparing: Loader2,
  waiting_for_user: AlertCircle,
  ready_to_call: PlayCircle,
  in_progress: Phone,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: Ban
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500',
  preparing: 'bg-blue-500',
  waiting_for_user: 'bg-orange-500',
  ready_to_call: 'bg-green-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-green-600',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400'
}

const priorityColors: Record<string, string> = {
  low: 'border-gray-300',
  normal: 'border-blue-300',
  high: 'border-red-300'
}

export function CallTaskList({ onTaskClick, onRefresh }: CallTaskListProps) {
  const [tasks, setTasks] = useState<CallTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, priorityFilter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const response = await fetch(`/api/call-tasks?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setTasks(data.tasks || [])
      } else {
        throw new Error(data.error || 'Failed to fetch tasks')
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error)
      toast.error(error.message || 'Failed to load call tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchTasks()
    if (onRefresh) onRefresh()
  }

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
    return true
  })

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getNextAction = (task: CallTask) => {
    switch (task.status) {
      case 'waiting_for_user':
        return 'Needs Info'
      case 'ready_to_call':
        return 'Ready to Call'
      case 'in_progress':
        return 'Calling...'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Processing'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Call Tasks</CardTitle>
              <CardDescription>
                Manage and track all your AI-powered phone calls
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waiting_for_user">Waiting for Info</SelectItem>
                  <SelectItem value="ready_to_call">Ready to Call</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Call Tasks Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No tasks match your current filters. Try adjusting the filters above.'
                : 'Create your first call task to get started with your AI assistant.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      {!loading && filteredTasks.length > 0 && (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const StatusIcon = statusIcons[task.status] || Clock
            const isAnimating = task.status === 'preparing' || task.status === 'in_progress'

            return (
              <Card 
                key={task.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${priorityColors[task.priority] || ''} border-l-4`}
                onClick={() => onTaskClick && onTaskClick(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side: Icon & Content */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1 p-2 rounded-full ${statusColors[task.status]}`}>
                        <StatusIcon 
                          className={`h-4 w-4 text-white ${isAnimating ? 'animate-spin' : ''}`}
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{task.title}</h3>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">High Priority</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.summary || task.raw_instruction}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          </div>
                          
                          {task.contact && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {task.contact.name}
                            </div>
                          )}

                          {task.sessions && task.sessions.length > 0 && (
                            <div>
                              {task.sessions.length} call{task.sessions.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Status & Action */}
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {getStatusLabel(task.status)}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {getNextAction(task)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && tasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
              <div className="flex gap-4">
                <span>
                  {tasks.filter(t => t.status === 'completed').length} completed
                </span>
                <span>
                  {tasks.filter(t => t.status === 'in_progress').length} active
                </span>
                <span>
                  {tasks.filter(t => t.status === 'ready_to_call').length} ready
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
























