'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Plus, Check, Eye } from 'lucide-react'
import { LayoutTemplateCard } from './layout-template-card'
import { LayoutPreviewModal } from './layout-preview-modal'
import { LayoutManager } from '@/lib/dashboard/layout-manager'
import { DashboardLayout } from '@/lib/types/dashboard-layout-types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface LayoutTemplateSelectorProps {
  onLayoutChange?: (layout: DashboardLayout | null) => void
}

export function LayoutTemplateSelector({ onLayoutChange }: LayoutTemplateSelectorProps) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([])
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null)
  const [previewLayout, setPreviewLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  
  // Form states
  const [newLayoutName, setNewLayoutName] = useState('')
  const [newLayoutDescription, setNewLayoutDescription] = useState('')
  const [error, setError] = useState('')
  
  const layoutManager = new LayoutManager()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLayouts()
  }, [])

  const loadLayouts = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user logged in')
        const defaultLayout = layoutManager.generateDefaultLayout()
        const presetLayouts = layoutManager.generatePresetLayouts()
        setLayouts([
          {
            ...defaultLayout,
            id: 'default-0',
            user_id: 'guest'
          },
          ...presetLayouts.map((preset, index) => ({
            ...preset,
            id: `preset-${index}`,
            user_id: 'guest'
          }))
        ] as DashboardLayout[])
        setActiveLayoutId('default-0')
        return
      }

      const userLayouts = await layoutManager.loadAllLayouts(user.id)
      
      if (userLayouts.length === 0) {
        await layoutManager.createDefaultLayoutForUser(user.id)
        await layoutManager.createPresetLayoutsForUser(user.id)
        const newLayouts = await layoutManager.loadAllLayouts(user.id)
        setLayouts(newLayouts)
      } else {
        setLayouts(userLayouts)
      }

      const activeLayout = userLayouts.find(l => l.is_active)
      if (activeLayout?.id) {
        setActiveLayoutId(activeLayout.id)
      }
    } catch (error) {
      console.error('Error loading layouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutClick = async (layoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to change layouts')
        return
      }

      const success = await layoutManager.setActiveLayout(layoutId, user.id)
      
      if (success) {
        setActiveLayoutId(layoutId)
        setPreviewLayout(null)
        const selectedLayout = layouts.find(l => l.id === layoutId)
        onLayoutChange?.(selectedLayout || null)
        
        window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { 
          detail: { layoutId } 
        }))
      }
    } catch (error) {
      console.error('Error changing layout:', error)
      alert('Failed to change layout')
    }
  }

  const handlePreview = (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      setPreviewLayout(layout)
    }
  }

  const handleCreateNew = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to create custom layouts')
        return
      }

      setError('')
      
      if (!newLayoutName.trim()) {
        setError('Please enter a layout name')
        return
      }

      const result = await layoutManager.createCustomLayout(
        newLayoutName.trim(),
        newLayoutDescription.trim(),
        user.id
      )

      if (result.success && result.layout) {
        await loadLayouts()
        setShowCreateDialog(false)
        setNewLayoutName('')
        setNewLayoutDescription('')
        onLayoutChange?.(result.layout)
      } else {
        setError(result.error || 'Failed to create layout')
      }
    } catch (error) {
      console.error('Error creating layout:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDuplicate = async (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      setSelectedLayoutId(layoutId)
      setNewLayoutName(`${layout.layout_name} (Copy)`)
      setShowDuplicateDialog(true)
    }
  }

  const handleDuplicateConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !selectedLayoutId) return

      setError('')
      
      if (!newLayoutName.trim()) {
        setError('Please enter a layout name')
        return
      }

      const result = await layoutManager.duplicateLayout(
        selectedLayoutId,
        newLayoutName.trim(),
        user.id
      )

      if (result.success) {
        await loadLayouts()
        setShowDuplicateDialog(false)
        setNewLayoutName('')
        setSelectedLayoutId(null)
        onLayoutChange?.(result.layout || null)
      } else {
        setError(result.error || 'Failed to duplicate layout')
      }
    } catch (error) {
      console.error('Error duplicating layout:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleRename = async (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      setSelectedLayoutId(layoutId)
      setNewLayoutName(layout.layout_name)
      setShowRenameDialog(true)
    }
  }

  const handleRenameConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !selectedLayoutId) return

      setError('')
      
      if (!newLayoutName.trim()) {
        setError('Please enter a layout name')
        return
      }

      const result = await layoutManager.renameLayout(
        selectedLayoutId,
        newLayoutName.trim(),
        user.id
      )

      if (result.success) {
        await loadLayouts()
        setShowRenameDialog(false)
        setNewLayoutName('')
        setSelectedLayoutId(null)
        onLayoutChange?.(null)
      } else {
        setError(result.error || 'Failed to rename layout')
      }
    } catch (error) {
      console.error('Error renaming layout:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return

    if (!confirm(`Are you sure you want to delete "${layout.layout_name}"? This cannot be undone.`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const result = await layoutManager.deleteCustomLayout(layoutId, user.id)

      if (result.success) {
        await loadLayouts()
        onLayoutChange?.(null)
      } else {
        alert(result.error || 'Failed to delete layout')
      }
    } catch (error) {
      console.error('Error deleting layout:', error)
      alert('An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {layouts.map((layout) => (
          <LayoutTemplateCard
            key={layout.id}
            layout={layout}
            isActive={layout.id === activeLayoutId}
            isPreviewed={previewLayout?.id === layout.id}
            onClick={() => handleLayoutClick(layout.id!)}
            onPreview={() => handlePreview(layout.id!)}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}

        {/* Create New Card */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all flex flex-col items-center justify-center gap-3 p-6 group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-600">
              Create New Layout
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Start from scratch
            </p>
          </div>
        </button>
      </div>

      {/* Layout Count */}
      <div className="text-sm text-muted-foreground text-center">
        {layouts.length} layout{layouts.length !== 1 ? 's' : ''} available
      </div>

      {/* Preview Modal */}
      <LayoutPreviewModal
        open={!!previewLayout}
        onClose={() => setPreviewLayout(null)}
        layout={previewLayout}
        onApply={handleLayoutClick}
      />

      {/* Create Layout Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Layout</DialogTitle>
            <DialogDescription>
              Give your custom layout a name and description
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="layout-name">Layout Name *</Label>
              <Input
                id="layout-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="My Custom Layout"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="layout-description">Description (optional)</Label>
              <Input
                id="layout-description"
                value={newLayoutDescription}
                onChange={(e) => setNewLayoutDescription(e.target.value)}
                placeholder="A brief description..."
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false)
              setNewLayoutName('')
              setNewLayoutDescription('')
              setError('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateNew}>Create Layout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Layout</DialogTitle>
            <DialogDescription>
              Enter a name for the duplicated layout
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="duplicate-name">New Layout Name *</Label>
              <Input
                id="duplicate-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="My Custom Layout (Copy)"
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDuplicateDialog(false)
              setNewLayoutName('')
              setSelectedLayoutId(null)
              setError('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateConfirm}>Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Layout</DialogTitle>
            <DialogDescription>
              Enter a new name for this layout
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-name">Layout Name *</Label>
              <Input
                id="rename-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="My Custom Layout"
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRenameDialog(false)
              setNewLayoutName('')
              setSelectedLayoutId(null)
              setError('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
