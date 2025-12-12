'use client'

import { useState, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Edit, Save, X, Eye, EyeOff, RotateCcw, Grid3x3, Plus } from 'lucide-react'
import { LayoutManager } from '@/lib/dashboard/layout-manager'
import { DashboardLayout, DashboardCard, DEFAULT_CARD_SIZES } from '@/lib/types/dashboard-layout-types'
import { useData } from '@/lib/providers/data-provider'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { FinancialCard } from './domain-cards/financial-card'
import { HealthCard } from './domain-cards/health-card'
import { GenericDomainCard } from './domain-cards/generic-domain-card'
import { RelationshipsCard } from './domain-cards/relationships-card'
import { LegalCard } from './domain-cards/legal-card'
import { InsuranceCard } from './domain-cards/insurance-card'
import { VehicleCard } from './domain-cards/vehicle-card'
import { DigitalLifeCard } from './domain-cards/digital-life-card'
import { MobileSettingsSheet } from '@/components/settings/mobile-settings-sheet'
import { OnboardingTutorial } from '@/components/onboarding/onboarding-tutorial'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Props {
  onSave?: (layout: DashboardLayout) => void
}

export function CustomizableCommandCenter({ onSave }: Props) {
  const { data, isLoaded } = useData()
  const supabase = createClientComponentClient()
  const layoutManager = new LayoutManager()

  const [isEditMode, setIsEditMode] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null)
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showLayoutSelector, setShowLayoutSelector] = useState(false)
  const [availableLayouts, setAvailableLayouts] = useState<DashboardLayout[]>([])

  // Load user and layout
  useEffect(() => {
    loadUserLayout()
  }, [])

  const loadUserLayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // If no user, use default layout
        console.log('⚠️ No user authenticated, using default layout')
        const defaultLayout = layoutManager.generateDefaultLayout()
        setCurrentLayout(defaultLayout)
        setCards(defaultLayout.layout_config.cards)
        return
      }

      setUserId(user.id)

      // Load active layout
      let layout = await layoutManager.loadActiveLayout(user.id)
      
      // If no layout, create default
      if (!layout) {
        console.log('Creating default layout...')
        await layoutManager.createDefaultLayoutForUser(user.id)
        await layoutManager.createPresetLayoutsForUser(user.id)
        layout = await layoutManager.loadActiveLayout(user.id)
      }

      if (layout) {
        setCurrentLayout(layout)
        setCards(layout.layout_config.cards)
      } else {
        // Fallback to generated default if DB fails
        console.log('⚠️ Failed to load layout, using generated default')
        const defaultLayout = layoutManager.generateDefaultLayout()
        setCurrentLayout(defaultLayout)
        setCards(defaultLayout.layout_config.cards)
      }

      // Load all layouts for selector
      const layouts = await layoutManager.loadAllLayouts(user.id)
      setAvailableLayouts(layouts)
    } catch (error) {
      console.error('❌ Error loading layout:', error)
      // Fallback to default layout on error
      const defaultLayout = layoutManager.generateDefaultLayout()
      setCurrentLayout(defaultLayout)
      setCards(defaultLayout.layout_config.cards)
    }
  }

  const handleLayoutChange = (layout: Layout[]) => {
    if (!isEditMode) return

    // Update card positions based on grid layout
    const updatedCards = cards.map(card => {
      const gridItem = layout.find(l => l.i === card.id)
      if (gridItem) {
        return {
          ...card,
          position: {
            x: gridItem.x,
            y: gridItem.y,
            w: gridItem.w,
            h: gridItem.h,
          },
        }
      }
      return card
    })

    setCards(updatedCards)
  }

  const saveLayout = async () => {
    if (!userId || !currentLayout) return

    const updatedLayout: DashboardLayout = {
      ...currentLayout,
      layout_config: {
        ...currentLayout.layout_config,
        cards,
      },
    }

    const success = await layoutManager.saveLayout(updatedLayout, userId)
    if (success) {
      setCurrentLayout(updatedLayout)
      setIsEditMode(false)
      onSave?.(updatedLayout)
      alert('✅ Layout saved successfully!')
    } else {
      alert('❌ Failed to save layout')
    }
  }

  const toggleCardVisibility = (cardId: string) => {
    setCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, visible: !card.visible } : card
      )
    )
  }

  const resetLayout = async () => {
    if (!userId) return
    if (!confirm('Reset to default layout? This will discard your changes.')) return

    const defaultLayout = layoutManager.generateDefaultLayout()
    setCards(defaultLayout.layout_config.cards)
  }

  const switchLayout = async (layoutId: string) => {
    if (!userId) return

    const success = await layoutManager.setActiveLayout(layoutId, userId)
    if (success) {
      await loadUserLayout()
      setShowLayoutSelector(false)
    }
  }

  const gridLayout: Layout[] = cards
    .filter(card => card.visible)
    .map(card => ({
      i: card.id,
      x: card.position.x,
      y: card.position.y,
      w: card.position.w,
      h: card.position.h,
      minW: 2,
      minH: 2,
    }))

  // Show loading ONLY if we don't have a layout yet
  // Data can load in the background
  if (!currentLayout) {
    return (
      <LoadingState
        message={isLoaded ? 'Setting up your dashboard layout...' : 'Loading dashboard data...'}
        fullScreen
        variant="spinner"
        size="lg"
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {currentLayout.layout_name} Dashboard
          </h1>
          {currentLayout.description && (
            <p className="text-gray-500 mt-1">{currentLayout.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Selector */}
          <button
            onClick={() => setShowLayoutSelector(!showLayoutSelector)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <Grid3x3 className="w-4 h-4" />
            Change Layout
          </button>

          {/* Edit Mode Toggle */}
          {isEditMode ? (
            <>
              <button
                onClick={resetLayout}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={saveLayout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Layout
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Customize Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Layout Selector Modal */}
      {showLayoutSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Select Layout</h2>
              <button
                onClick={() => setShowLayoutSelector(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {availableLayouts.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => switchLayout(layout.id!)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    layout.is_active
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{layout.layout_name}</h3>
                    {layout.is_active && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  {layout.description && (
                    <p className="text-sm text-gray-500">{layout.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {layout.layout_config.cards.filter(c => c.visible).length} cards
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                🎨 Edit Mode Active
              </h3>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Drag cards to reorder them</li>
                <li>• Drag corners to resize</li>
                <li>• Click eye icons to hide/show cards</li>
                <li>• Click "Save Layout" when done</li>
              </ul>
            </div>

            {/* Card Visibility Toggles */}
            <div className="flex flex-wrap gap-2 max-w-md">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => toggleCardVisibility(card.id)}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    card.visible
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                  title={card.visible ? 'Hide card' : 'Show card'}
                >
                  {card.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  {card.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={currentLayout.layout_config.rowHeight}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {cards
          .filter(card => card.visible)
          .map(card => (
            <div 
              key={card.id} 
              className={`
                bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden
                border border-gray-200 dark:border-gray-700
                transition-all duration-200
                ${isEditMode ? 'hover:shadow-2xl hover:scale-[1.02] ring-2 ring-purple-500/20' : 'hover:shadow-xl'}
              `}
            >
              {/* Card Header */}
              {isEditMode && (
                <div className="drag-handle bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 px-4 py-2 cursor-move border-b border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{card.icon || '📊'}</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-100">{card.title}</span>
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-300 font-medium">
                      ↔️ Drag • ↕️ Resize
                    </div>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className={isEditMode ? "p-4" : "p-0"}>
                <DomainCard domain={card.domain} size={card.size} data={data} />
              </div>
            </div>
          ))}
      </ResponsiveGridLayout>

      {/* Mobile Settings Sheet */}
      <MobileSettingsSheet
        cards={cards}
        onCardToggle={toggleCardVisibility}
        onSave={saveLayout}
      />

        {/* Onboarding Tutorial */}
        <OnboardingTutorial />
      </div>
    </ErrorBoundary>
  )
}

// Domain Card Component
interface DomainCardProps {
  domain: string
  size: 'small' | 'medium' | 'large'
  data: any
}

function DomainCard({ domain, size, data }: DomainCardProps) {
  // Render domain-specific rich card components
  const cardProps = { size, data } as any
  switch (domain) {
    case 'financial':
      return <FinancialCard {...cardProps} />

    case 'health':
      return <HealthCard {...cardProps} />

    case 'vehicles':
      return <VehicleCard {...cardProps} />

    case 'relationships':
      return <RelationshipsCard {...cardProps} />

    case 'legal':
      return <LegalCard {...cardProps} />

    case 'insurance':
      return <InsuranceCard {...cardProps} />

    case 'digital':
      return <DigitalLifeCard {...cardProps} />

    default:
      return <GenericDomainCard domain={domain} {...cardProps} />
  }
}



