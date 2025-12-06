'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical, Settings, Eye, EyeOff, Maximize2, Minimize2,
  LayoutGrid, LayoutList, Save, RotateCcw
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

const DEFAULT_WIDGETS = [
  { id: 'financial', name: 'Financial', icon: '💰', enabled: true, size: 'medium', order: 0 },
  { id: 'health', name: 'Health', icon: '❤️', enabled: true, size: 'medium', order: 1 },
  { id: 'legal', name: 'Legal', icon: '⚖️', enabled: true, size: 'medium', order: 2 },
  { id: 'home', name: 'Home', icon: '🏠', enabled: true, size: 'medium', order: 3 },
  { id: 'tasks', name: 'Tasks', icon: '✓', enabled: true, size: 'large', order: 4 },
  { id: 'bills', name: 'Bills', icon: '💳', enabled: true, size: 'large', order: 5 },
  { id: 'goals', name: 'Goals', icon: '🎯', enabled: true, size: 'medium', order: 6 },
  { id: 'analytics', name: 'Analytics', icon: '📊', enabled: true, size: 'large', order: 7 },
]

const TEMPLATES = [
  { id: 'default', name: 'Default', description: 'Balanced view of all domains' },
  { id: 'student', name: 'Student', description: 'Legal, Digital, Health focus' },
  { id: 'entrepreneur', name: 'Entrepreneur', description: 'Legal, Financial, Goals focus' },
  { id: 'parent', name: 'Parent', description: 'Family, Home, Health focus' },
  { id: 'retiree', name: 'Retiree', description: 'Health, Hobbies, Social focus' },
]

const DEFAULT_CONFIG = {
  widgets: DEFAULT_WIDGETS,
  layout: 'grid' as 'grid' | 'list'
}

export function CustomizableDashboard() {
  // Use Supabase-backed preferences instead of localStorage
  const { 
    value: savedConfig, 
    loading: configLoading, 
    setValue: saveConfig,
    deleteValue: deleteConfig
  } = useUserPreferences('lifehub-dashboard-config', DEFAULT_CONFIG)

  // Use DataProvider for all domain data
  const { data, tasks } = useData()

  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [isEditMode, setIsEditMode] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState('default')

  // Load configuration from Supabase when available
  useEffect(() => {
    if (!configLoading && savedConfig) {
      setWidgets(savedConfig.widgets || DEFAULT_WIDGETS)
      setLayout(savedConfig.layout || 'grid')
    }
  }, [savedConfig, configLoading])

  const saveConfiguration = async () => {
    const config = {
      widgets,
      layout,
      savedAt: new Date().toISOString(),
    }
    await saveConfig(config)
    setIsEditMode(false)
  }

  const resetToDefault = async () => {
    setWidgets(DEFAULT_WIDGETS)
    setLayout('grid')
    await deleteConfig()
  }

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ))
  }

  const changeWidgetSize = (id: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, size } : w
    ))
  }

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = widgets.findIndex(w => w.id === draggedItem)
    const targetIndex = widgets.findIndex(w => w.id === targetId)

    const newWidgets = [...widgets]
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1)
    newWidgets.splice(targetIndex, 0, draggedWidget)

    // Update order
    newWidgets.forEach((w, i) => w.order = i)
    setWidgets(newWidgets)
    setDraggedItem(null)
  }

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    // Template configurations
    const templates: Record<string, any> = {
      student: {
        enabled: ['legal', 'digital', 'health', 'tasks', 'goals'],
        featured: ['legal', 'tasks'],
      },
      entrepreneur: {
        enabled: ['legal', 'financial', 'goals', 'tasks', 'analytics'],
        featured: ['legal', 'financial'],
      },
      parent: {
        enabled: ['family', 'home', 'health', 'tasks', 'bills'],
        featured: ['family', 'home'],
      },
      retiree: {
        enabled: ['health', 'hobbies', 'social', 'travel', 'financial'],
        featured: ['health', 'hobbies'],
      },
    }

    const template = templates[templateId]
    if (template) {
      setWidgets(widgets.map(w => ({
        ...w,
        enabled: template.enabled.includes(w.id),
        size: template.featured?.includes(w.id) ? 'large' : 'medium',
      })))
    }
  }

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order)

  const getWidgetData = (widgetId: string) => {
    // Get data from DataProvider (all cloud-backed via Supabase)
    const domainDataMap: Record<string, any> = {
      tasks: tasks || [],
      bills: data.bills || [],
      goals: data.goals || [],
      financial: data.financial || [],
      health: data.health || [],
      career: data.career || [],
      home: data.home || [],
      analytics: data.financial || [], // Analytics uses financial data
    }

    return domainDataMap[widgetId] || []
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Dashboard</h2>
          <p className="text-muted-foreground">
            {isEditMode ? 'Drag & drop to rearrange widgets' : 'Your personalized view'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
            title={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {layout === 'grid' ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>

          {/* Customize Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize Your Dashboard</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Templates */}
                <div>
                  <Label>Quick Templates</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate === template.id ? 'default' : 'outline'}
                        onClick={() => applyTemplate(template.id)}
                        className="flex flex-col h-auto p-3 text-left"
                      >
                        <span className="font-semibold">{template.name}</span>
                        <span className="text-xs text-muted-foreground">{template.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Widget Visibility & Size */}
                <div>
                  <Label>Widgets</Label>
                  <div className="space-y-2 mt-2">
                    {widgets.map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{widget.icon}</span>
                          <div>
                            <div className="font-medium">{widget.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {getWidgetData(widget.id).length} items
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select
                            value={widget.size}
                            onValueChange={(size: any) => changeWidgetSize(widget.id, size)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">
                                <Minimize2 className="h-3 w-3 inline mr-2" />
                                Small
                              </SelectItem>
                              <SelectItem value="medium">
                                <GripVertical className="h-3 w-3 inline mr-2" />
                                Medium
                              </SelectItem>
                              <SelectItem value="large">
                                <Maximize2 className="h-3 w-3 inline mr-2" />
                                Large
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={widget.enabled}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={resetToDefault} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button onClick={saveConfiguration} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Mode Toggle */}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => isEditMode ? saveConfiguration() : setIsEditMode(true)}
          >
            {isEditMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Edit Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Widgets Grid/List */}
      <div className={
        layout === 'grid' 
          ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-4'
      }>
        {enabledWidgets.map((widget) => (
          <div
            key={widget.id}
            draggable={isEditMode}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(widget.id)}
            className={`
              ${widget.size === 'large' ? 'md:col-span-2' : ''}
              ${widget.size === 'small' ? 'md:col-span-1' : ''}
              ${isEditMode ? 'cursor-move hover:ring-2 ring-primary' : ''}
              ${draggedItem === widget.id ? 'opacity-50' : ''}
              transition-all
            `}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isEditMode && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-xl">{widget.icon}</span>
                    <CardTitle className="text-lg">{widget.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {getWidgetData(widget.id).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <WidgetContent widgetId={widget.id} size={widget.size} data={getWidgetData(widget.id)} />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {enabledWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No widgets enabled</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Customize" to add widgets to your dashboard
          </p>
        </Card>
      )}
    </div>
  )
}

// Widget content based on type - now receives data from DataProvider
function WidgetContent({ widgetId, size, data }: { widgetId: string; size: string; data: any[] }) {
  const limit = size === 'small' ? 2 : size === 'medium' ? 3 : 5

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No items yet
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {data.slice(0, limit).map((item: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
          <span className="text-sm truncate flex-1">
            {item.title || item.name || item.description || 'Untitled'}
          </span>
          {item.amount && (
            <span className="text-sm font-semibold">${item.amount}</span>
          )}
          {item.completed !== undefined && (
            <span className={`text-xs ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
              {item.completed ? '✓' : '○'}
            </span>
          )}
        </div>
      ))}
      {data.length > limit && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{data.length - limit} more
        </p>
      )}
    </div>
  )
}

