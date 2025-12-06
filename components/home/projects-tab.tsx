'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Settings } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface ProjectsTabProps {
  homeId: string
}

interface Project {
  id: string
  projectName: string
  type: string
  description: string
  budget: number
  actualCost?: number
  startDate: string
  endDate?: string
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  nextStep?: string
}

export function ProjectsTab({ homeId }: ProjectsTabProps) {
  const { getData, addData, deleteData, updateData } = useData()
  const [projects, setProjects] = useState<Project[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    projectName: '',
    type: '',
    description: '',
    startDate: '',
    budget: '',
    status: 'planning' as Project['status']
  })

  useEffect(() => {
    loadProjects()
  }, [homeId, getData])

  useEffect(() => {
    const handleUpdate = () => loadProjects()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('home-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('home-data-updated', handleUpdate)
    }
  }, [homeId, getData])

  const loadProjects = () => {
    const homeData = getData('home') as any[]
    const homeProjects = homeData.filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'project'
    ).map(item => ({
      id: item.id,
      projectName: item.metadata?.projectName || item.title || '',
      type: item.metadata?.type || '',
      description: item.metadata?.description || item.description || '',
      budget: Number(item.metadata?.budget) || 0,
      actualCost: item.metadata?.actualCost ? Number(item.metadata.actualCost) : undefined,
      startDate: item.metadata?.startDate || '',
      endDate: item.metadata?.endDate,
      status: item.metadata?.status || 'planning',
      progress: Number(item.metadata?.progress) || 0,
      nextStep: item.metadata?.nextStep
    }))
    
    setProjects(homeProjects)
    console.log(`🏗️ Loaded ${homeProjects.length} projects for home ${homeId}`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    await addData('home', {
      title: formData.projectName,
      description: formData.description,
      metadata: {
        itemType: 'project',
        homeId: homeId,
        projectName: formData.projectName,
        type: formData.type,
        description: formData.description,
        budget: parseFloat(formData.budget),
        startDate: formData.startDate,
        status: formData.status,
        progress: 0
      }
    })
    
    console.log('✅ Project saved to database')
    setFormData({ projectName: '', type: '', description: '', startDate: '', budget: '', status: 'planning' })
    setShowDialog(false)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('home-data-updated'))
    }
    loadProjects()
  }

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    setProjects(prev => prev.filter(p => p.id !== id))
    
    try {
      await deleteData('home', id)
      console.log('✅ Project deleted successfully')
    } catch (e) {
      console.error('❌ Failed to delete project:', e)
      loadProjects()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const totalSpent = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)

  const getStatusBadge = (status: Project['status']) => {
    const badges = {
      'planning': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'in-progress': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'on-hold': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return badges[status] || badges['planning']
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., Kitchen Remodel"
                  required
                />
              </div>
              <div>
                <Label>Project Type *</Label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Home Office Setup, Outdoor Improvement"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project details..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Budget *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Project['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Active Projects
              </h3>
              <p className="text-muted-foreground text-sm">Track home improvement projects</p>
            </div>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-3xl font-bold text-purple-600">{activeProjects.length}</p>
              <p className="text-xs text-muted-foreground mt-1">1 behind schedule</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-3xl font-bold text-green-600">${totalBudget.toLocaleString()}</p>
              {totalSpent > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Spent: ${totalSpent.toLocaleString()}</p>
              )}
            </div>
          </div>
        </Card>

        {projects.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Projects */}
            {activeProjects.length > 0 && (
              <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <h4 className="text-lg font-semibold mb-4">🔧 Active Projects</h4>
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-semibold text-lg">{project.projectName}</h5>
                            <span className={`px-2 py-1 text-xs rounded capitalize ${getStatusBadge(project.status)}`}>
                              {project.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-semibold">${project.budget.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Start</p>
                              <p className="font-semibold">{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <p className="font-semibold">{project.type}</p>
                            </div>
                          </div>
                          {project.nextStep && (
                            <p className="text-sm mt-2 text-blue-600 dark:text-blue-400">
                              Next Step: {project.nextStep}
                            </p>
                          )}
                          {project.progress > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{project.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingIds.has(project.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 ml-4"
                        >
                          {deletingIds.has(project.id) ? (
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
            )}

            {/* Completed Projects */}
            {completedProjects.length > 0 && (
              <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <h4 className="text-lg font-semibold mb-4">✅ Completed Projects</h4>
                <div className="space-y-3">
                  {completedProjects.map((project) => (
                    <div key={project.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold">{project.projectName}</h5>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span>Budget: ${project.budget.toLocaleString()}</span>
                          {project.actualCost && (
                            <span>Final Cost: ${project.actualCost.toLocaleString()}</span>
                          )}
                          {project.endDate && (
                            <span>Completed: {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingIds.has(project.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingIds.has(project.id) ? (
                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}

