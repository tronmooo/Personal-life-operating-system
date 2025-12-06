'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Eye, Grid3x3, Maximize2 } from 'lucide-react'
import { DashboardLayout } from '@/lib/types/dashboard-layout-types'
import { LayoutManager } from '@/lib/dashboard/layout-manager'

interface LayoutPreviewModalProps {
  open: boolean
  onClose: () => void
  layout: DashboardLayout | null
  onApply?: (layoutId: string) => void
  onEdit?: (layoutId: string) => void
}

export function LayoutPreviewModal({ 
  open, 
  onClose, 
  layout,
  onApply,
  onEdit
}: LayoutPreviewModalProps) {
  const [isApplying, setIsApplying] = useState(false)
  const layoutManager = new LayoutManager()

  if (!layout) return null

  const visibleCards = layout.layout_config.cards.filter(c => c.visible)
  const thumbnail = layoutManager.generateLayoutThumbnail(layout)

  const handleApply = async () => {
    if (!layout.id) return
    
    setIsApplying(true)
    try {
      await onApply?.(layout.id)
      onClose()
    } catch (error) {
      console.error('Error applying layout:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleEdit = () => {
    if (!layout.id) return
    onEdit?.(layout.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-purple-600" />
            Preview Layout: {layout.layout_name}
          </DialogTitle>
          <DialogDescription>
            {layout.description || 'See how this layout will look on your dashboard'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Layout Info Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {visibleCards.length} card{visibleCards.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {layout.layout_config.columns} columns
                </span>
              </div>
              {layout.is_default && (
                <Badge variant="secondary">Default</Badge>
              )}
              {layout.is_active && (
                <Badge className="bg-blue-600">Active</Badge>
              )}
            </div>
          </div>

          {/* Layout Visualization */}
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="relative" style={{ minHeight: '400px' }}>
              {/* Grid background */}
              <div className="absolute inset-0 grid gap-2" style={{ 
                gridTemplateColumns: `repeat(${thumbnail.columns}, 1fr)`,
                gridAutoRows: `${thumbnail.rowHeight / 2}px`
              }}>
                {Array.from({ length: thumbnail.columns * 8 }).map((_, i) => (
                  <div key={i} className="border border-gray-200/30 dark:border-gray-700/30 rounded" />
                ))}
              </div>

              {/* Cards */}
              <div className="relative" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${thumbnail.columns}, 1fr)`,
                gap: '8px',
                gridAutoRows: `${thumbnail.rowHeight / 2}px`
              }}>
                {thumbnail.cards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-lg shadow-md border-2 border-white/50 dark:border-gray-600/50 flex flex-col items-center justify-center p-3 transition-all hover:scale-105"
                    style={{
                      gridColumn: `${card.x + 1} / span ${card.w}`,
                      gridRow: `${card.y + 1} / span ${card.h}`,
                      backgroundColor: card.color,
                      opacity: 0.9
                    }}
                  >
                    <span className="text-3xl mb-2">{card.icon}</span>
                    <span className="text-white font-semibold text-sm text-center drop-shadow-md">
                      {layout.layout_config.cards.find(c => c.id === card.id)?.title}
                    </span>
                    <span className="text-white/80 text-xs mt-1">
                      {card.w}x{card.h}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card List */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
              Cards in this layout ({visibleCards.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {visibleCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                >
                  <span className="text-lg">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{card.title}</p>
                    <p className="text-[10px] text-gray-500">{card.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Cards (if any) */}
          {layout.layout_config.cards.filter(c => !c.visible).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                Hidden cards ({layout.layout_config.cards.filter(c => !c.visible).length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {layout.layout_config.cards.filter(c => !c.visible).map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-dashed opacity-60"
                  >
                    <span className="text-lg grayscale">{card.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{card.title}</p>
                      <p className="text-[10px] text-gray-500">Hidden</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          {onEdit && !layout.is_default && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
            >
              Edit Layout
            </Button>
          )}

          {onApply && !layout.is_active && (
            <Button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isApplying ? (
                <>Applying...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply Layout
                </>
              )}
            </Button>
          )}

          {layout.is_active && (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200">
              <Check className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Currently Active
              </span>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> This preview shows how your dashboard will be organized. 
            Click "Apply Layout" to use this layout, or "Cancel" to go back.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}




























