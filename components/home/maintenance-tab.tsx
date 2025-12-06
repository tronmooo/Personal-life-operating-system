'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface MaintenanceTabProps {
  homeId: string
}

interface MaintenanceTask {
  id: string
  title: string
  description: string
  dueDate: string
  priority: string
}

export function MaintenanceTab({ homeId }: MaintenanceTabProps) {
  const { getData, addData, deleteData, updateData } = useData()
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  })

  useEffect(() => {
    loadTasks()
  }, [homeId, getData])

  useEffect(() => {
    // Listen for data updates
    const handleUpdate = () => loadTasks()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('home-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('home-data-updated', handleUpdate)
    }
  }, [homeId, getData])

  const loadTasks = () => {
    // Load from DataProvider (database-backed)
    const homeData = getData('home') as any[]
    const homeTasks = homeData.filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'maintenance-task'
    ).map(item => ({
      id: item.id,
      title: item.title || item.metadata?.title || '',
      description: item.description || item.metadata?.description || '',
      dueDate: item.metadata?.dueDate || '',
      priority: item.metadata?.priority || 'medium'
    }))
    
    setTasks(homeTasks)
    console.log(`📋 Loaded ${homeTasks.length} maintenance tasks for home ${homeId}`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    // Save to database via DataProvider (ensure itemType is consistent)
    await addData('home', {
      title: formData.title,
      description: formData.description,
      metadata: {
        itemType: 'maintenance-task', // canonical id used by loaders
        homeId: homeId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        status: 'pending',
        type: 'home-maintenance' // For Command Center filtering
      }
    })
    
    console.log('✅ Maintenance task saved to database')
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium' })
    setShowDialog(false)
    // Notify listeners immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('home-data-updated'))
    }
    loadTasks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this maintenance task?')) return
    
    // Optimistic UI update - remove immediately for instant feedback
    setDeletingIds(prev => new Set(prev).add(id))
    setTasks(prev => prev.filter(t => t.id !== id))
    
    try {
      await deleteData('home', id)
      console.log('✅ Maintenance task deleted successfully')
      // Reload to sync with database
      await loadTasks()
    } catch (e) {
      console.error('❌ Failed to delete maintenance task:', e)
      // Rollback - reload data if delete failed
      loadTasks()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Task Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Maintenance Tasks</h3>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </Card>

        {tasks.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <p className="text-muted-foreground">No maintenance tasks yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{task.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Due: {task.dueDate}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingIds.has(task.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {deletingIds.has(task.id) ? (
                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

