'use client'

import { useState } from 'react'
import { Plus, Calendar, Repeat, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/lib/providers/notification-provider'
import { NotificationCategory, NotificationPriority } from '@/types/notifications'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ReminderManager() {
  const { reminders, addReminder, completeReminder, deleteReminder } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState('general')
  const [category, setCategory] = useState<NotificationCategory>('reminder')
  const [priority, setPriority] = useState<NotificationPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('09:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [interval, setInterval] = useState(1)
  const [notificationOffset, setNotificationOffset] = useState(60) // minutes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const dueDateTimeString = `${dueDate}T${dueTime}`
    const dueDateObject = new Date(dueDateTimeString)

    addReminder({
      title,
      description,
      domain,
      category,
      priority,
      dueDate: dueDateObject,
      recurring: isRecurring
        ? {
            frequency,
            interval,
          }
        : undefined,
      notificationOffset,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setDomain('general')
    setCategory('reminder')
    setPriority('medium')
    setDueDate('')
    setDueTime('09:00')
    setIsRecurring(false)
    setFrequency('weekly')
    setInterval(1)
    setNotificationOffset(60)
    setIsOpen(false)
  }

  const activeReminders = reminders.filter((r) => !r.isCompleted)
  const completedReminders = reminders.filter((r) => r.isCompleted)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminders</h2>
          <p className="text-muted-foreground">Manage your upcoming tasks and events</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder to stay on top of important tasks
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Pay electricity bill"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="reminder">Reminder</option>
                    <option value="bill">Bill Payment</option>
                    <option value="appointment">Appointment</option>
                    <option value="task">Task</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="health">Health</option>
                    <option value="goal">Goal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time *</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationOffset">Notify me (minutes before)</Label>
                <Input
                  id="notificationOffset"
                  type="number"
                  value={notificationOffset}
                  onChange={(e) => setNotificationOffset(parseInt(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">
                    Recurring Reminder
                  </Label>
                </div>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <select
                      id="frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval">Every</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Create Reminder
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Active Reminders ({activeReminders.length})
          </h3>
          {activeReminders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No active reminders. Create one to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeReminders
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((reminder) => (
                  <Card key={reminder.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{reminder.title}</h4>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="capitalize">
                              {reminder.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                reminder.priority === 'urgent'
                                  ? 'border-red-500 text-red-600'
                                  : reminder.priority === 'high'
                                  ? 'border-orange-500 text-orange-600'
                                  : ''
                              }`}
                            >
                              {reminder.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(reminder.dueDate).toLocaleString()}
                            </span>
                            {reminder.recurring && (
                              <Badge variant="outline" className="text-blue-600">
                                <Repeat className="h-3 w-3 mr-1" />
                                {reminder.recurring.frequency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => completeReminder(reminder.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteReminder(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {completedReminders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Completed ({completedReminders.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {completedReminders.slice(0, 5).map((reminder) => (
                <Card key={reminder.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm line-through">{reminder.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteReminder(reminder.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}







