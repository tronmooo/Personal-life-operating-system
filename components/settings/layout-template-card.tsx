'use client'

import { DashboardLayout } from '@/lib/types/dashboard-layout-types'
import { Check, Grid3x3, Eye, MoreVertical, Copy, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface LayoutTemplateCardProps {
  layout: DashboardLayout
  isActive: boolean
  isPreviewed: boolean
  onClick: () => void
  onPreview: () => void
  onDuplicate?: (layoutId: string) => void
  onRename?: (layoutId: string) => void
  onDelete?: (layoutId: string) => void
}

export function LayoutTemplateCard({ 
  layout, 
  isActive, 
  isPreviewed,
  onClick, 
  onPreview,
  onDuplicate,
  onRename,
  onDelete
}: LayoutTemplateCardProps) {
  const visibleCards = layout.layout_config.cards.filter(c => c.visible)
  const cardCount = visibleCards.length

  // Generate a simple visual representation of the layout
  const generateLayoutThumbnail = () => {
    const maxCards = 12
    const displayCards = visibleCards.slice(0, maxCards)
    
    return (
      <div className="relative w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-md overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-12 gap-[1px] opacity-20">
          {Array.from({ length: layout.layout_config.columns }).map((_, i) => (
            <div key={i} className="bg-gray-400" />
          ))}
        </div>
        
        {/* Cards representation */}
        <div className="absolute inset-1 grid grid-cols-12 gap-0.5">
          {displayCards.map((card, index) => {
            // Calculate position percentage
            const leftPercent = (card.position.x / layout.layout_config.columns) * 100
            const widthPercent = (card.position.w / layout.layout_config.columns) * 100
            const topPercent = Math.min((card.position.y / 6) * 100, 80) // Cap at 80% for visibility
            const heightPercent = Math.min((card.position.h / 6) * 100, 30) // Cap for better visualization
            
            return (
              <div
                key={card.id}
                className="absolute rounded-[2px] border border-white/20"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  top: `${topPercent}%`,
                  height: `${heightPercent}%`,
                  backgroundColor: card.color || '#6366f1',
                  opacity: 0.7,
                  zIndex: index
                }}
              />
            )
          })}
        </div>

        {/* Card count overlay */}
        {cardCount > maxCards && (
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
            +{cardCount - maxCards} more
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`
        relative group cursor-pointer rounded-xl border-2 transition-all overflow-hidden
        ${isActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md' 
          : isPreviewed
            ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        }
      `}
      onClick={onClick}
    >
      {/* Actions Menu */}
      {(onDuplicate || onRename || onDelete) && (
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    layout.id && onDuplicate(layout.id)
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onRename && !layout.is_default && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    layout.id && onRename(layout.id)
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {onDelete && !layout.is_default && !layout.is_active && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      layout.id && onDelete(layout.id)
                    }}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
          <Check className="w-3 h-3" />
          Active
        </div>
      )}

      {/* Preview Badge */}
      {isPreviewed && !isActive && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
          <Eye className="w-3 h-3" />
          Preview
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Thumbnail */}
        {generateLayoutThumbnail()}

        {/* Layout Info */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">
              {layout.layout_name}
            </h3>
            {layout.is_default && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium">
                Default
              </span>
            )}
          </div>
          
          {layout.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {layout.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Grid3x3 className="w-3 h-3" />
              <span>{cardCount} cards</span>
            </div>
            {layout.layout_config.columns && (
              <div>
                {layout.layout_config.columns} columns
              </div>
            )}
          </div>
        </div>

        {/* Hover Action */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>
    </div>
  )
}

