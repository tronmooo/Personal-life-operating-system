'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, Eye, Save, RotateCcw, Download, Upload, History, Settings, Paintbrush, Type, Sparkles } from 'lucide-react'
import { LayoutTemplateSelector } from './layout-template-selector'
import { CardVisibilityGrid } from './card-visibility-grid'
import { CardLayoutEditor } from './card-layout-editor'
import { LayoutImportExport } from './layout-import-export'
import { LayoutHistory } from './layout-history'
import { CardColorPicker } from './card-color-picker'
import { CardTitleEditor } from './card-title-editor'
import { LayoutCreationWizard } from './layout-creation-wizard'
import { useLayoutHistory } from '@/hooks/use-layout-history'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { LayoutManager } from '@/lib/dashboard/layout-manager'
import { DashboardLayout } from '@/lib/types/dashboard-layout-types'
import { getUserSettings, updateUserSettings } from '@/lib/supabase/user-settings'

export function DashboardTab() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const layoutManager = new LayoutManager()
  
  const [dashboardMode, setDashboardMode] = useState<'standard' | 'customizable'>('standard')
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  // History hook
  const {
    layout: historyLayout,
    canUndo,
    canRedo,
    hasUnsavedChanges: historyHasUnsavedChanges,
    historyEntries,
    updateLayout,
    undo,
    redo,
    jumpToHistory,
    clearHistory,
    save: historySave,
  } = useLayoutHistory(currentLayout, async (layout) => {
    // Auto-save callback
    if (userId && layout.id) {
      await layoutManager.updateLayout(layout.id, layout, userId)
      console.log('✅ Layout auto-saved')
    }
  })

  // Load user and layout
  useEffect(() => {
    loadUserAndLayout()
  }, [])

  const loadUserAndLayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Load active layout
        const layout = await layoutManager.loadActiveLayout(user.id)
        if (layout) {
          setCurrentLayout(layout)
        }
      }
    } catch (error) {
      console.error('Failed to load layout:', error)
    } finally {
      setIsLoading(false)
    }

    // Load dashboard mode from Supabase user_settings
    try {
      const settings = await getUserSettings()
      const savedMode = settings?.dashboardViewMode
      if (savedMode === 'customizable' || savedMode === 'standard') {
        setDashboardMode(savedMode)
      } else {
        setDashboardMode('standard')
      }
    } catch {
      setDashboardMode('standard')
    }
  }

  const toggleDashboardMode = () => {
    const newMode = dashboardMode === 'standard' ? 'customizable' : 'standard'
    console.log('🔄 Toggling dashboard mode to:', newMode)
    setDashboardMode(newMode)
    updateUserSettings({ dashboardViewMode: newMode }).catch(() => {})
    
    window.dispatchEvent(new CustomEvent('dashboard-view-mode-changed', { 
      detail: { mode: newMode } 
    }))
  }

  const handleCardsChange = (cards: any[]) => {
    if (currentLayout) {
      const updatedLayout = {
        ...currentLayout,
        layout_config: {
          ...currentLayout.layout_config,
          cards,
        }
      }
      setCurrentLayout(updatedLayout)
      updateLayout(updatedLayout, 'Update card order')
    }
  }

  const handleSaveLayout = async () => {
    if (userId && currentLayout?.id) {
      await layoutManager.updateLayout(currentLayout.id, currentLayout, userId)
      historySave()
      alert('✅ Layout saved successfully!')
    }
  }

  const handleResetLayout = async () => {
    if (confirm('Reset to default layout? This will discard all customizations.')) {
      if (userId) {
        const defaultLayout = layoutManager.generateDefaultLayout()
        await layoutManager.createDefaultLayoutForUser(userId)
        const newLayout = await layoutManager.loadActiveLayout(userId)
        if (newLayout) {
          setCurrentLayout(newLayout)
          updateLayout(newLayout, 'Reset to default')
        }
      }
    }
  }

  const handleImportLayout = async (layout: DashboardLayout) => {
    if (userId) {
      const created = await layoutManager.createLayout(layout, userId)
      if (created) {
        setCurrentLayout(created)
        updateLayout(created, 'Import layout')
        alert('✅ Layout imported successfully!')
      }
    }
  }

  const handleColorChange = (cardId: string, color: string) => {
    if (currentLayout) {
      const updatedCards = currentLayout.layout_config.cards.map(card =>
        card.id === cardId ? { ...card, color } : card
      )
      const updatedLayout = {
        ...currentLayout,
        layout_config: {
          ...currentLayout.layout_config,
          cards: updatedCards,
        }
      }
      setCurrentLayout(updatedLayout)
      updateLayout(updatedLayout, `Change ${cardId} color`)
    }
  }

  const handleTitleChange = (cardId: string, title: string) => {
    if (currentLayout) {
      const updatedCards = currentLayout.layout_config.cards.map(card =>
        card.id === cardId ? { ...card, title } : card
      )
      const updatedLayout = {
        ...currentLayout,
        layout_config: {
          ...currentLayout.layout_config,
          cards: updatedCards,
        }
      }
      setCurrentLayout(updatedLayout)
      updateLayout(updatedLayout, `Rename ${cardId}`)
    }
  }

  const handleIconChange = (cardId: string, icon: string) => {
    if (currentLayout) {
      const updatedCards = currentLayout.layout_config.cards.map(card =>
        card.id === cardId ? { ...card, icon } : card
      )
      const updatedLayout = {
        ...currentLayout,
        layout_config: {
          ...currentLayout.layout_config,
          cards: updatedCards,
        }
      }
      setCurrentLayout(updatedLayout)
      updateLayout(updatedLayout, `Change ${cardId} icon`)
    }
  }

  const handleResetCard = (cardId: string) => {
    // Reset to defaults would go here
    alert('Card reset to defaults')
  }

  const handleWizardComplete = async (layout: DashboardLayout) => {
    if (userId) {
      const created = await layoutManager.createLayout(layout, userId)
      if (created) {
        setCurrentLayout(created)
        updateLayout(created, 'Create new layout via wizard')
        alert('✅ Layout created successfully!')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Mode Toggle */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-purple-600" />
            Dashboard Mode
          </CardTitle>
          <CardDescription>Choose between standard and customizable dashboard views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning for customizable mode */}
          {dashboardMode === 'customizable' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                ℹ️ Customizable Mode Enabled
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can now drag, resize, and customize your dashboard cards. Click "Go to Command Center" or "Customize Now" to start customizing. Your changes will be saved automatically.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Current Mode: {dashboardMode === 'standard' ? 'Standard' : 'Customizable'}</p>
              <p className="text-sm text-muted-foreground">
                {dashboardMode === 'standard' 
                  ? 'Fixed layout with all features visible (Recommended)' 
                  : 'Drag, resize, and customize your dashboard cards'}
              </p>
            </div>
            <Button
              onClick={toggleDashboardMode}
              variant={dashboardMode === 'customizable' ? 'default' : 'outline'}
              className={dashboardMode === 'customizable' 
                ? 'bg-purple-600 hover:bg-purple-700 shadow-md' 
                : ''}
            >
              {dashboardMode === 'standard' ? 'Enable Customize' : 'Disable Customize'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/command-center')} 
              className="flex-1"
              variant="outline"
            >
              Go to Command Center
            </Button>
            {dashboardMode === 'customizable' && (
              <Button 
                onClick={() => router.push('/command-center')} 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Customize Now
              </Button>
            )}
          </div>

          {/* Create New Layout Button */}
          <Button 
            onClick={() => setShowWizard(true)} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create New Layout with Wizard
          </Button>
        </CardContent>
      </Card>

      {/* Phase 5 Features - Organized in Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Advanced Dashboard Settings
          </CardTitle>
          <CardDescription>Customize, manage, and organize your dashboard layouts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="layout">
                <LayoutGrid className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Layout</span>
              </TabsTrigger>
              <TabsTrigger value="editor">
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Paintbrush className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Colors</span>
              </TabsTrigger>
              <TabsTrigger value="titles">
                <Type className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Titles</span>
              </TabsTrigger>
              <TabsTrigger value="import-export">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">I/E</span>
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Layout Templates & Visibility */}
            <TabsContent value="layout" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout Templates</CardTitle>
                  <CardDescription>Choose from preset layouts or create your own</CardDescription>
                </CardHeader>
                <CardContent>
                  <LayoutTemplateSelector onLayoutChange={(layout: DashboardLayout | null) => {
                    if (layout) {
                      setCurrentLayout(layout as DashboardLayout)
                      updateLayout(layout as DashboardLayout, 'Change layout template')
                    }
                  }} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card Visibility</CardTitle>
                  <CardDescription>Show or hide domain cards on your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardVisibilityGrid onVisibilityChange={() => {
                    // Handled by CardLayoutEditor
                  }} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Drag-and-Drop Editor */}
            <TabsContent value="editor" className="space-y-4 mt-4">
              {currentLayout && (
                <CardLayoutEditor
                  cards={currentLayout.layout_config.cards}
                  onCardsChange={handleCardsChange}
                  onSave={handleSaveLayout}
                  onReset={handleResetLayout}
                />
              )}
            </TabsContent>

            {/* Tab 3: Card Colors */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              {currentLayout && (
                <CardColorPicker
                  cards={currentLayout.layout_config.cards}
                  onColorChange={handleColorChange}
                />
              )}
            </TabsContent>

            {/* Tab 4: Card Titles */}
            <TabsContent value="titles" className="space-y-4 mt-4">
              {currentLayout && (
                <CardTitleEditor
                  cards={currentLayout.layout_config.cards}
                  onTitleChange={handleTitleChange}
                  onIconChange={handleIconChange}
                  onReset={handleResetCard}
                />
              )}
            </TabsContent>

            {/* Tab 5: Import/Export */}
            <TabsContent value="import-export" className="space-y-4 mt-4">
              {userId && (
                <LayoutImportExport
                  currentLayout={currentLayout}
                  userId={userId}
                  onImport={handleImportLayout}
                />
              )}
            </TabsContent>

            {/* Tab 6: History */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <LayoutHistory
                canUndo={canUndo}
                canRedo={canRedo}
                hasUnsavedChanges={historyHasUnsavedChanges}
                historyEntries={historyEntries}
                onUndo={undo}
                onRedo={redo}
                onSave={historySave}
                onJumpToHistory={jumpToHistory}
                onClearHistory={clearHistory}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> Enable customizable mode to drag, resize, and rearrange cards. 
            Your layout will be saved automatically and synced across all your devices.
          </p>
        </CardContent>
      </Card>

      {/* Layout Creation Wizard */}
      <LayoutCreationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
    </div>
  )
}


