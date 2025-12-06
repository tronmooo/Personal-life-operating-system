'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface MaintenanceScheduleTabProps {
  homeId: string
}

interface ScheduledMaintenance {
  id: string
  taskName: string
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  category: string
  lastCompleted?: string
  nextDue: string
  estimatedCost: number
  notes?: string
  status?: 'overdue' | 'scheduled' | 'pending'
}

export function MaintenanceScheduleTab({ homeId }: MaintenanceScheduleTabProps) {
  const { getData, addData, deleteData, updateData } = useData()
  const [schedules, setSchedules] = useState<ScheduledMaintenance[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    taskName: '',
    frequency: 'monthly' as ScheduledMaintenance['frequency'],
    category: '',
    lastCompleted: '',
    nextDue: '',
    estimatedCost: '',
    notes: ''
  })

  useEffect(() => {
    loadSchedules()
  }, [homeId, getData])

  useEffect(() => {
    const handleUpdate = () => loadSchedules()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('home-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('home-data-updated', handleUpdate)
    }
  }, [homeId, getData])

  const loadSchedules = () => {
    const homeData = getData('home') as any[]
    const maintenanceSchedules = homeData.filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'maintenance-schedule'
    ).map(item => {
      const nextDue = item.metadata?.nextDue || ''
      let status: ScheduledMaintenance['status'] = 'scheduled'
      
      if (nextDue) {
        const dueDate = new Date(nextDue)
        const today = new Date()
        if (dueDate < today) {
          status = 'overdue'
        } else if (dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
          status = 'pending'
        }
      }
      
      return {
        id: item.id,
        taskName: item.metadata?.taskName || item.title || '',
        frequency: item.metadata?.frequency || 'monthly',
        category: item.metadata?.category || '',
        lastCompleted: item.metadata?.lastCompleted,
        nextDue: item.metadata?.nextDue || '',
        estimatedCost: Number(item.metadata?.estimatedCost) || 0,
        notes: item.metadata?.notes || '',
        status
      }
    })
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
    
    setSchedules(maintenanceSchedules)
    console.log(`📅 Loaded ${maintenanceSchedules.length} maintenance schedules for home ${homeId}`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    await addData('home', {
      title: formData.taskName,
      description: `${formData.frequency} ${formData.category}`,
      metadata: {
        itemType: 'maintenance-schedule',
        homeId: homeId,
        taskName: formData.taskName,
        frequency: formData.frequency,
        category: formData.category,
        lastCompleted: formData.lastCompleted,
        nextDue: formData.nextDue,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        notes: formData.notes
      }
    })
    
    console.log('✅ Maintenance schedule saved to database')
    setFormData({
      taskName: '',
      frequency: 'monthly',
      category: '',
      lastCompleted: '',
      nextDue: '',
      estimatedCost: '',
      notes: ''
    })
    setShowDialog(false)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('home-data-updated'))
    }
    loadSchedules()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this maintenance schedule? This action cannot be undone.')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await deleteData('home', id)
      console.log('✅ Maintenance schedule deleted successfully')
      await loadSchedules() // Reload to stay in sync with database
    } catch (e) {
      console.error('❌ Failed to delete maintenance schedule:', e)
      await loadSchedules() // Reload even on error to ensure UI consistency
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleMarkComplete = async (schedule: ScheduledMaintenance) => {
    const today = new Date().toISOString().split('T')[0]
    const nextDue = new Date()
    
    // Calculate next due date based on frequency
    switch (schedule.frequency) {
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1)
        break
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3)
        break
      case 'semi-annual':
        nextDue.setMonth(nextDue.getMonth() + 6)
        break
      case 'annual':
        nextDue.setFullYear(nextDue.getFullYear() + 1)
        break
    }
    
    await updateData('home', schedule.id, {
      metadata: {
        ...schedule,
        itemType: 'maintenance-schedule',
        homeId: homeId,
        lastCompleted: today,
        nextDue: nextDue.toISOString().split('T')[0]
      }
    })
    
    loadSchedules()
  }

  const schedulesByFrequency = schedules.reduce((acc, schedule) => {
    const freq = schedule.frequency
    if (!acc[freq]) acc[freq] = []
    acc[freq].push(schedule)
    return acc
  }, {} as Record<string, ScheduledMaintenance[]>)

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'overdue':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </span>
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
          Scheduled
        </span>
      default:
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
          Pending
        </span>
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Maintenance Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Task Name *</Label>
                <Input
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                  placeholder="e.g., HVAC Filter Replacement"
                  required
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., HVAC, Plumbing, Exterior"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: ScheduledMaintenance['frequency']) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Every 30 days</SelectItem>
                  <SelectItem value="quarterly">Every 3 months</SelectItem>
                  <SelectItem value="semi-annual">Every 6 months</SelectItem>
                  <SelectItem value="annual">Yearly (before summer/winter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Last Completed</Label>
                <Input
                  type="date"
                  value={formData.lastCompleted}
                  onChange={(e) => setFormData({ ...formData, lastCompleted: e.target.value })}
                />
              </div>
              <div>
                <Label>Next Due *</Label>
                <Input
                  type="date"
                  value={formData.nextDue}
                  onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Estimated Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details about this maintenance task..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add to Schedule
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Header Card */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Maintenance Schedule by Category
              </h3>
              <p className="text-muted-foreground text-sm">Set up recurring maintenance tasks</p>
            </div>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </Card>

        {/* Schedules by Frequency */}
        {schedules.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No maintenance schedules yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(schedulesByFrequency).map(([frequency, freqSchedules]) => (
              <Card key={frequency} className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <h4 className="text-lg font-semibold mb-4 capitalize">
                  {frequency.replace('-', ' ')} Tasks
                </h4>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm">
                    <span>Task</span>
                    <span>Frequency</span>
                    <span>Last Done</span>
                    <span>Next Due</span>
                    <span className="text-right">Actions</span>
                  </div>
                  
                  {freqSchedules.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className="grid grid-cols-5 gap-4 py-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{schedule.taskName}</p>
                        {schedule.category && (
                          <p className="text-xs text-muted-foreground">{schedule.category}</p>
                        )}
                      </div>
                      <div className="capitalize text-sm">{schedule.frequency.replace('-', ' ')}</div>
                      <div className="text-sm">
                        {schedule.lastCompleted 
                          ? new Date(schedule.lastCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Not yet'}
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        {schedule.nextDue && new Date(schedule.nextDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {getStatusBadge(schedule.status)}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkComplete(schedule)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Mark as completed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deletingIds.has(schedule.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingIds.has(schedule.id) ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}















