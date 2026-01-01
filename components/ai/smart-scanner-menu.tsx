'use client'

/**
 * Smart Scanner Menu Component
 * Shows all scan options when camera button is pressed
 */

import { useState, useRef, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Upload, 
  Search, 
  ChevronRight, 
  X,
  Loader2,
  Sparkles,
  Grid,
  List
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  SCAN_OPTIONS, 
  SCAN_CATEGORY_GROUPS, 
  QUICK_SCAN_OPTIONS,
  type ScanCategory,
  type ScanOption,
  getScanOption
} from '@/lib/ai/smart-document-classifier'

// ============================================
// TYPES
// ============================================

interface SmartScannerMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanSelect: (category: ScanCategory, method: 'camera' | 'upload') => void
}

// ============================================
// COMPONENT
// ============================================

export function SmartScannerMenu({ 
  open, 
  onOpenChange, 
  onScanSelect 
}: SmartScannerMenuProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open])

  // Filter options based on search
  const filteredOptions = SCAN_OPTIONS.filter(opt => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      opt.label.toLowerCase().includes(query) ||
      opt.shortLabel.toLowerCase().includes(query) ||
      opt.description.toLowerCase().includes(query) ||
      opt.keywords.some(k => k.toLowerCase().includes(query))
    )
  })

  // Get quick scan options
  const quickOptions = QUICK_SCAN_OPTIONS.map(id => getScanOption(id)).filter(Boolean) as ScanOption[]

  // Handle scan selection
  const handleSelect = (category: ScanCategory, method: 'camera' | 'upload') => {
    onScanSelect(category, method)
    onOpenChange(false)
    setSearchQuery('')
    setActiveGroup(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 bg-gray-900 border-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-cyan-400" />
              Scan Document
            </DialogTitle>
            <DialogDescription>
              Choose what you want to scan or let AI auto-detect
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scan types... (receipt, insurance, medical...)"
              className="pl-10 bg-gray-800/50 border-gray-700 focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-4 space-y-6">
            {/* Quick Actions */}
            {!searchQuery && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-400">Quick Scan</h3>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Auto-Detect
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickOptions.map((option) => (
                    <QuickScanButton
                      key={option.id}
                      option={option}
                      onSelect={(method) => handleSelect(option.id, method)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400">
                  {filteredOptions.length} results for &ldquo;{searchQuery}&rdquo;
                </h3>
                
                <div className="grid gap-2">
                  {filteredOptions.map((option) => (
                    <ScanOptionRow
                      key={option.id}
                      option={option}
                      onSelect={(method) => handleSelect(option.id, method)}
                    />
                  ))}
                </div>
                
                {filteredOptions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No scan types found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            ) : (
              /* Category Groups */
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">All Categories</h3>
                
                <div className="grid gap-3">
                  {SCAN_CATEGORY_GROUPS.map((group) => (
                    <CategoryGroup
                      key={group.id}
                      group={group}
                      isExpanded={activeGroup === group.id}
                      onToggle={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
                      onSelect={(category, method) => handleSelect(category, method)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Detection Info */}
            {!searchQuery && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">AI Auto-Detection</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Not sure which type? Choose &ldquo;Any Document&rdquo; and our AI will automatically 
                      identify receipts, IDs, medical records, and 25+ document types.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {SCAN_OPTIONS.length} document types supported
            </p>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function QuickScanButton({ 
  option, 
  onSelect 
}: { 
  option: ScanOption
  onSelect: (method: 'camera' | 'upload') => void 
}) {
  const [showMethods, setShowMethods] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowMethods(!showMethods)}
        className={cn(
          "w-full flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
          "bg-gray-800/50 border-gray-700/50 hover:border-cyan-500/30 hover:bg-cyan-500/5"
        )}
      >
        <span className="text-2xl">{option.icon}</span>
        <span className="text-xs font-medium">{option.shortLabel}</span>
      </button>

      {showMethods && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gray-900/95 rounded-xl border border-cyan-500/30 z-10">
          <button
            onClick={() => onSelect('camera')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800"
          >
            <Camera className="h-5 w-5 text-cyan-400" />
            <span className="text-[10px]">Camera</span>
          </button>
          <button
            onClick={() => onSelect('upload')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800"
          >
            <Upload className="h-5 w-5 text-purple-400" />
            <span className="text-[10px]">Upload</span>
          </button>
          <button
            onClick={() => setShowMethods(false)}
            className="absolute top-1 right-1 p-1 rounded text-gray-500 hover:text-gray-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function ScanOptionRow({ 
  option, 
  onSelect 
}: { 
  option: ScanOption
  onSelect: (method: 'camera' | 'upload') => void 
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all group",
      "bg-gray-800/30 border-gray-700/50 hover:border-cyan-500/30 hover:bg-gray-800/50"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
        option.bgColor
      )}>
        <span className="text-xl">{option.icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{option.label}</h4>
        <p className="text-xs text-gray-500 truncate">{option.description}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onSelect('camera')}
          className="p-2 rounded-lg bg-gray-700/50 hover:bg-cyan-500/20 transition-colors"
          title="Use Camera"
        >
          <Camera className="h-4 w-4 text-cyan-400" />
        </button>
        <button
          onClick={() => onSelect('upload')}
          className="p-2 rounded-lg bg-gray-700/50 hover:bg-purple-500/20 transition-colors"
          title="Upload File"
        >
          <Upload className="h-4 w-4 text-purple-400" />
        </button>
      </div>
    </div>
  )
}

function CategoryGroup({ 
  group, 
  isExpanded, 
  onToggle,
  onSelect 
}: { 
  group: typeof SCAN_CATEGORY_GROUPS[0]
  isExpanded: boolean
  onToggle: () => void
  onSelect: (category: ScanCategory, method: 'camera' | 'upload') => void 
}) {
  const options = group.options.map(id => getScanOption(id)).filter(Boolean) as ScanOption[]

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isExpanded ? "border-gray-600 bg-gray-800/30" : "border-gray-800 hover:border-gray-700"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
          group.color
        )}>
          <span className="text-xl">{group.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{group.label}</h4>
          <p className="text-xs text-gray-500">{options.length} types</p>
        </div>

        <ChevronRight className={cn(
          "h-4 w-4 text-gray-500 transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-lg">{option.icon}</span>
              <span className="flex-1 text-sm">{option.label}</span>
              
              <button
                onClick={() => onSelect(option.id, 'camera')}
                className="p-1.5 rounded bg-gray-700/50 hover:bg-cyan-500/20 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => onSelect(option.id, 'upload')}
                className="p-1.5 rounded bg-gray-700/50 hover:bg-purple-500/20 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-purple-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SmartScannerMenu

