'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GripVertical, Eye, EyeOff, Save, RotateCcw } from 'lucide-react'
import { DashboardCard } from '@/lib/types/dashboard-layout-types'

interface CardLayoutEditorProps {
  cards: DashboardCard[]
  onCardsChange: (cards: DashboardCard[]) => void
  onSave: () => void
  onReset: () => void
}

export function CardLayoutEditor({ cards, onCardsChange, onSave, onReset }: CardLayoutEditorProps) {
  const [localCards, setLocalCards] = useState<DashboardCard[]>(cards)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setLocalCards(cards)
  }, [cards])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localCards.findIndex((card) => card.id === active.id)
      const newIndex = localCards.findIndex((card) => card.id === over.id)

      const newCards = arrayMove(localCards, oldIndex, newIndex)
      
      // Update positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: {
          ...card.position,
          y: Math.floor(index / 2) * card.position.h, // Simple 2-column layout
          x: (index % 2) * 6, // 6 columns each (12 total)
        }
      }))

      setLocalCards(updatedCards)
      onCardsChange(updatedCards)
      setHasChanges(true)
    }
  }

  const toggleVisibility = (cardId: string) => {
    const updatedCards = localCards.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    )
    setLocalCards(updatedCards)
    onCardsChange(updatedCards)
    setHasChanges(true)
  }

  const changeSize = (cardId: string, size: 'small' | 'medium' | 'large') => {
    const updatedCards = localCards.map(card =>
      card.id === cardId ? { ...card, size } : card
    )
    setLocalCards(updatedCards)
    onCardsChange(updatedCards)
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave()
    setHasChanges(false)
  }

  const handleReset = () => {
    onReset()
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      {/* Visual Grid Preview */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visual Layout Preview
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-2 h-96 relative">
              {localCards
                .filter(card => card.visible)
                .map(card => (
                  <div
                    key={card.id}
                    className="absolute rounded border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 flex items-center justify-center text-center p-2 shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      gridColumn: `span ${card.position.w}`,
                      gridRow: `span ${Math.ceil(card.position.h / 2)}`,
                      left: `${(card.position.x / 12) * 100}%`,
                      top: `${(card.position.y / 10) * 100}%`,
                      width: `${(card.position.w / 12) * 100}%`,
                      height: `${(card.position.h * 10)}px`,
                    }}
                  >
                    <div>
                      <div className="text-2xl mb-1">{card.icon || '📊'}</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {card.title}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {card.size}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This is how your dashboard will look. Drag cards below to reorder them.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                Unsaved changes
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Save to apply your layout changes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Tip:</strong> Drag cards to reorder them, toggle visibility, and adjust sizes. Changes are previewed in real-time.
        </p>
      </div>

      {/* Drag and Drop Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={localCards.map(card => card.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localCards.map((card) => (
              <SortableCardItem 
                key={card.id}
                card={card}
                onToggleVisibility={toggleVisibility}
                onChangeSize={changeSize}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SortableCardItemProps {
  card: DashboardCard
  onToggleVisibility: (id: string) => void
  onChangeSize: (id: string, size: 'small' | 'medium' | 'large') => void
}

function SortableCardItem({ card, onToggleVisibility, onChangeSize }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 border-2 rounded-lg p-4
        ${card.visible ? 'border-gray-200 dark:border-gray-700' : 'border-gray-300 dark:border-gray-600 opacity-50'}
        ${isDragging ? 'ring-2 ring-purple-500 shadow-2xl z-50' : 'hover:shadow-lg'}
        transition-all duration-200
      `}
    >
      {/* Header with Drag Handle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
          <span className="text-xl">{card.icon || '📊'}</span>
          <span className="font-semibold">{card.title}</span>
        </div>

        <button
          onClick={() => onToggleVisibility(card.id)}
          className={`p-2 rounded-lg transition-colors ${
            card.visible
              ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {card.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      {/* Domain */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Domain: <span className="font-medium">{card.domain}</span>
      </p>

      {/* Size Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-300">Size:</label>
        <Select value={card.size} onValueChange={(value: any) => onChangeSize(card.id, value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Position Info */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400">
          Position: {card.position.w}×{card.position.h} at ({card.position.x}, {card.position.y})
        </p>
      </div>
    </div>
  )
}

